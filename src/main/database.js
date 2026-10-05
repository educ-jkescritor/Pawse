const { app } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const fs = require("fs");

// In development, read/write directly to ./pawse.db in project root so changes are visible in IDE.
// In production (packaged app), use AppData to comply with OS permissions.
const isDev = !app.isPackaged;
const appDataDb = path.join(app.getPath("userData"), "pawse.db");
const rootDb = path.join(__dirname, "../../pawse.db");

// If AppData has newer sessions (e.g. from testing a packaged .exe build),
// automatically pull them into the local project pawse.db so the IDE stays up-to-date.
if (isDev && fs.existsSync(appDataDb) && fs.existsSync(rootDb)) {
    try {
        const appDataMtime = fs.statSync(appDataDb).mtimeMs;
        const rootMtime = fs.statSync(rootDb).mtimeMs;
        if (appDataMtime > rootMtime) {
            fs.copyFileSync(appDataDb, rootDb);
            console.log("Synced newer database from AppData into local pawse.db.");
        }
    } catch (syncErr) {
        // Non-critical startup check
    }
}

const dbPath = isDev ? rootDb : appDataDb;

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
        
        const createTableQuery = `CREATE TABLE IF NOT EXISTS session (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT DEFAULT 'guest',
            cat_type TEXT,
            total_work_seconds INTEGER,
            total_break_seconds INTEGER,
            total_work INTEGER,
            total_break INTEGER,
            total_pomodoro INTEGER,
            date_completed DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_synced INTEGER DEFAULT 0,
            uuid TEXT UNIQUE
        )`;
        
        db.run(createTableQuery, (err) => {
            if (err) {
                console.log("Error creating session table:", err.message);
            } else {
                db.run("ALTER TABLE session ADD COLUMN uuid TEXT", () => {
                    db.run("ALTER TABLE session ADD COLUMN is_synced INTEGER DEFAULT 0", () => {
                        db.run("ALTER TABLE session ADD COLUMN email TEXT DEFAULT 'guest'", () => {
                            db.run("UPDATE session SET email = 'guest' WHERE email IS NULL OR email = ''", () => {
                                // Find any past sessions with NULL UUIDs
                                db.all("SELECT id FROM session WHERE uuid IS NULL OR uuid = ''", (err, rows) => {
                                    if (!err && rows && rows.length > 0) {
                                        // Give each past session its unique UUID and mark as not synced yet
                                        rows.forEach((row) => {
                                            const newUuid = crypto.randomUUID();
                                            db.run("UPDATE session SET uuid = ?, is_synced = 0 WHERE id = ?", [newUuid, row.id]);
                                        });
                                        console.log(`Successfully assigned UUIDs to ${rows.length} past sessions.`);
                                    }
                                });
                            });
                        });
                    });
                });
                console.log("Session database is ready.");
            }
        });
    }
});

function generateAnalytics(weeksAgo = 0) {
    return new Promise((resolve, reject) => {
        const analyticData = {
            today_work_seconds: 0,
            historical_pomodoro: 0,
            favorite_cat: 'None',
            weekly_data: [0, 0, 0, 0, 0, 0, 0], // Sun to Sat
            weekly_avg_seconds: 0,
            current_streak: 0,
            best_streak: 0,
            avg_daily_seconds: 0,
            personal_best_seconds: 0,
            personal_best_date: ''
        };

        // Establish accurate local timezone bounds for "Today" using JavaScript
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayStart.getDate() + 1);
        
        const todayStartUTC = todayStart.toISOString().replace('T', ' ').substring(0, 19);
        const todayEndUTC = todayEnd.toISOString().replace('T', ' ').substring(0, 19);

        const todayWorkQuery = `SELECT SUM(total_work_seconds) AS today_work_seconds FROM session WHERE date_completed >= ? AND date_completed < ?`;
        const historicalPomodoroQuery = `SELECT SUM(total_pomodoro) AS historical_pomodoro FROM session`;
        const favoriteCatQuery = `SELECT cat_type, COUNT(*) AS favorite_cat FROM session GROUP BY cat_type ORDER BY favorite_cat DESC LIMIT 1`;
        
        db.get(todayWorkQuery, [todayStartUTC, todayEndUTC], (err, row1) => {
            if (!err && row1 && row1.today_work_seconds) analyticData.today_work_seconds = row1.today_work_seconds;

            db.get(historicalPomodoroQuery, [], (err, row2) => {
                if (!err && row2 && row2.historical_pomodoro) analyticData.historical_pomodoro = row2.historical_pomodoro;

                db.get(favoriteCatQuery, [], (err, row3) => {
                    if (!err && row3 && row3.cat_type) analyticData.favorite_cat = row3.cat_type;

                    // Query historical sessions to compute streaks, personal best, and daily average
                    const allSessionsQuery = `SELECT date_completed, total_work_seconds, total_pomodoro FROM session WHERE date_completed IS NOT NULL`;
                    db.all(allSessionsQuery, [], (err, allRows) => {
                        if (!err && allRows && allRows.length > 0) {
                            const dailyWorkMap = {};
                            const dailyPomodoroMap = {};

                            allRows.forEach(row => {
                                if (!row.date_completed) return;
                                const dateString = row.date_completed.replace(' ', 'T') + 'Z';
                                const localDate = new Date(dateString);
                                if (isNaN(localDate.getTime())) return;

                                const y = localDate.getFullYear();
                                const m = String(localDate.getMonth() + 1).padStart(2, '0');
                                const d = String(localDate.getDate()).padStart(2, '0');
                                const dayKey = `${y}-${m}-${d}`;

                                dailyWorkMap[dayKey] = (dailyWorkMap[dayKey] || 0) + (row.total_work_seconds || 0);
                                dailyPomodoroMap[dayKey] = (dailyPomodoroMap[dayKey] || 0) + (row.total_pomodoro || 0);
                            });

                            const recordedDays = Object.keys(dailyWorkMap);

                            // 1. Daily Average Focus Seconds (averaged across days with focus)
                            const activeWorkDays = recordedDays.filter(k => dailyWorkMap[k] > 0);
                            if (activeWorkDays.length > 0) {
                                const totalWork = activeWorkDays.reduce((acc, k) => acc + dailyWorkMap[k], 0);
                                analyticData.avg_daily_seconds = Math.round(totalWork / activeWorkDays.length);
                            }

                            // 2. Personal Best (day with highest total focus seconds)
                            let bestSeconds = 0;
                            let bestDateKey = '';
                            recordedDays.forEach(k => {
                                if (dailyWorkMap[k] > bestSeconds) {
                                    bestSeconds = dailyWorkMap[k];
                                    bestDateKey = k;
                                }
                            });
                            analyticData.personal_best_seconds = bestSeconds;
                            analyticData.personal_best_date = bestDateKey;

                            // 3. Streak Calculation (qualifying day: >= 60 seconds or >= 1 pomodoro)
                            const qualifyingDates = recordedDays.filter(k => 
                                dailyWorkMap[k] >= 60 || (dailyPomodoroMap[k] && dailyPomodoroMap[k] >= 1)
                            ).sort();

                            if (qualifyingDates.length > 0) {
                                const qualifyingSet = new Set(qualifyingDates);

                                const toDayKey = (dt) => {
                                    const y = dt.getFullYear();
                                    const m = String(dt.getMonth() + 1).padStart(2, '0');
                                    const d = String(dt.getDate()).padStart(2, '0');
                                    return `${y}-${m}-${d}`;
                                };

                                const nowLocal = new Date();
                                const todayKey = toDayKey(nowLocal);

                                const yesterdayLocal = new Date(nowLocal);
                                yesterdayLocal.setDate(nowLocal.getDate() - 1);
                                const yesterdayKey = toDayKey(yesterdayLocal);

                                // Current streak: starts from today if active, else yesterday if active (grace period until end of today)
                                let currentStreak = 0;
                                let checkDate = null;

                                if (qualifyingSet.has(todayKey)) {
                                    checkDate = new Date(nowLocal);
                                } else if (qualifyingSet.has(yesterdayKey)) {
                                    checkDate = new Date(yesterdayLocal);
                                }

                                if (checkDate) {
                                    while (true) {
                                        const key = toDayKey(checkDate);
                                        if (qualifyingSet.has(key)) {
                                            currentStreak++;
                                            checkDate.setDate(checkDate.getDate() - 1);
                                        } else {
                                            break;
                                        }
                                    }
                                }
                                analyticData.current_streak = currentStreak;

                                // Best streak ever (longest consecutive sequence in sorted qualifying dates)
                                let longestStreak = 0;
                                let tempStreak = 0;
                                let prevDateObj = null;

                                qualifyingDates.forEach(k => {
                                    const [y, m, d] = k.split('-').map(Number);
                                    const currDateObj = new Date(y, m - 1, d);

                                    if (!prevDateObj) {
                                        tempStreak = 1;
                                    } else {
                                        const diffDays = Math.round((currDateObj - prevDateObj) / (1000 * 60 * 60 * 24));
                                        if (diffDays === 1) {
                                            tempStreak++;
                                        } else if (diffDays > 1) {
                                            tempStreak = 1;
                                        }
                                    }
                                    if (tempStreak > longestStreak) {
                                        longestStreak = tempStreak;
                                    }
                                    prevDateObj = currDateObj;
                                });

                                analyticData.best_streak = Math.max(longestStreak, currentStreak);
                            }
                        }

                        // Determine local start of week (Sunday 00:00:00) based on weeksAgo
                        const now = new Date();
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay() - (weeksAgo * 7));
                        startOfWeek.setHours(0,0,0,0);
                        
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 7);
                        
                        // Convert local boundaries to UTC string format (YYYY-MM-DD HH:MM:SS) for SQLite
                        const startOfWeekUTC = startOfWeek.toISOString().replace('T', ' ').substring(0, 19);
                        const endOfWeekUTC = endOfWeek.toISOString().replace('T', ' ').substring(0, 19);
                        
                        const weeklyDataQuery = `SELECT date_completed, total_work_seconds FROM session WHERE date_completed >= ? AND date_completed < ?`;

                        db.all(weeklyDataQuery, [startOfWeekUTC, endOfWeekUTC], (err, rows) => {
                            if (!err && rows) {
                                rows.forEach(row => {
                                    // Parse the UTC date from database to get local day
                                    const dateString = row.date_completed.replace(' ', 'T') + 'Z';
                                    const localDate = new Date(dateString);
                                    
                                    analyticData.weekly_data[localDate.getDay()] += row.total_work_seconds;
                                });
                                
                                // We now send raw seconds instead of destructively rounding to hours
                                // to ensure even short sessions (like 2 minutes) are accurately graphed.
                            }

                            // Calculate daily average for the selected week across active days (> 0 seconds)
                            const activeWeekDays = analyticData.weekly_data.filter(seconds => seconds > 0);
                            if (activeWeekDays.length > 0) {
                                const totalWeekWork = activeWeekDays.reduce((acc, s) => acc + s, 0);
                                analyticData.weekly_avg_seconds = Math.round(totalWeekWork / activeWeekDays.length);
                            } else {
                                analyticData.weekly_avg_seconds = 0;
                            }

                            resolve(analyticData);
                        });
                    });
                });
            });
        });
    });
}

module.exports = { db, generateAnalytics };

