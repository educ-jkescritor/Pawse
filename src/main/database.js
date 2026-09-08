const { app } = require("electron");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const supabase = require("./supabase");

const dbPath = path.join(app.getPath('userData'), "pawse.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log("Error opening database:", err.message);
    } else {
        const createTableQuery = `CREATE TABLE IF NOT EXISTS session (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            cat_type TEXT,
            total_work_seconds INTEGER,
            total_break_seconds INTEGER,
            total_work INTEGER,
            total_break INTEGER,
            total_pomodoro INTEGER,
            date_completed DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_synced BOOLEAN DEFAULT 0,
            uuid TEXT
        )`;
        
        db.run(createTableQuery, (err) => {
            if (err) {
                console.log("Error creating session table:", err.message);
            } else {
                db.run("ALTER TABLE session ADD COLUMN email TEXT", () => {
                    db.run("ALTER TABLE session ADD COLUMN is_synced BOOLEAN DEFAULT 0", () => {
                        db.run("ALTER TABLE session ADD COLUMN uuid TEXT", () => {
                            db.run("UPDATE session SET email = 'guest' WHERE email IS NULL", () => {
                                const crypto = require('crypto');
                                db.all("SELECT id FROM session WHERE uuid IS NULL", (err, rows) => {
                                    if (!err && rows && rows.length > 0) {
                                        console.log(`Found ${rows.length} rows without uuid. Generating uuid for them.`);
                                        rows.forEach(row => {
                                            const uuid = crypto.randomUUID();
                                            db.run("UPDATE session SET uuid = ?, is_synced = 0 WHERE id = ?", [uuid, row.id]);
                                        });
                                    }
                                });
                            });
                        });
                    });
                });
            }
        });
    }
});

let isSyncing = false;

// update the parallel programming features later if timer.html is merged with index.html 
async function pushDatabase(){
    if (isSyncing) return;
    isSyncing = true;
    db.all("SELECT * FROM session WHERE is_synced = 0", async (err, rows) => {
        if (err || rows.length === 0) {
            isSyncing = false;
            return;
        }

        console.log(`Found ${rows.length} unsynced rows. Pushing to cloud.`);

        for (const row of rows) {
            try{
                const { data, error } = await supabase
                .from('session')
                .select('id')
                .eq('uuid', row.uuid);
            
                if (error)  {
                    throw error;
                }

                if (data && data.length > 0) {
                    db.run("UPDATE session SET is_synced = 1 WHERE id = ?", [row.id]);
                    console.log(`Row ${row.id} pushed successfully.`);
                } else {
                    const { error } = await supabase
                    .from('session')
                    .insert([{
                        email: row.email,
                        cat_type: row.cat_type,
                        total_work_seconds: row.total_work_seconds,
                        total_break_seconds: row.total_break_seconds,
                        total_work: row.total_work,
                        total_break: row.total_break,
                        total_pomodoro: row.total_pomodoro,
                        date_completed: row.date_completed,
                        uuid: row.uuid
                    }]);
                    
                    if (error) {
                        throw error;
                    }

                    db.run("UPDATE session SET is_synced = 1 WHERE id = ?", [row.id]);
                    console.log(`Row ${row.id} pushed successfully.`);
                }
            } catch (error) {
                console.log("No internet connection. Please try again later.");
                console.log("Error:", error.message);
                continue;
            }
        }
        isSyncing = false;
    });
}

async function pullDatabase(email) {
    try {
        if (!email || email === '' || email == 'guest') {
            console.log("Guest account detected. Local sync only.");
            return;
        }

        console.log("Pulling data from cloud for user:", email);

        const lastSync = await new Promise((resolve) => {
            db.get("SELECT MAX(date_completed) as date_completed FROM session WHERE email = ?", [email], (err, row) => {
                if(err || !row || !row.date_completed) {
                    resolve(null);
                } else {
                    resolve(row.date_completed);
                }
            })
        });

        let query = supabase
        .from('session')
        .select('*')
        .eq('email', email)
        .gt('date_completed', lastSync);

        const { data, error } = await query

        if (data && data.length === 0) {
            console.log("Local database is already up-to-date.");
            return;
        }

        if (error) {
            throw error;
        }

        for (const row of data || []) {
            db.get("SELECT * FROM session WHERE uuid = ?", [row.uuid], (err, row) => {
                if (err) return;

                if (!row) {
                    const insertQuery = `INSERT INTO session (
                        email,
                        cat_type, 
                        total_work_seconds, 
                        total_break_seconds, 
                        total_work, 
                        total_break,
                        total_pomodoro,
                        uuid,
                        date_completed,
                        is_synced
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), 1)`;
                    
                    db.run(insertQuery, [
                        row.email,
                        row.cat_type,
                        row.total_work_seconds,
                        row.total_break_seconds,
                        row.total_work,
                        row.total_break,
                        row.total_pomodoro,
                        row.uuid,
                        row.date_completed || null
                    ], (err) => {
                        if (!err) {
                            console.log(`Row with uuid ${row.uuid} pulled successfully from cloud.`);
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.log("No internet connection. Please try again later.");
        console.log("Error:", error.message);
    }
}

// ------------------------------------------------------

function createMockData() {
    const insertMockDataQuery = `INSERT INTO session (  
        email,
        cat_type, 
        total_work_seconds, 
        total_break_seconds, 
        total_work, 
        total_break,
        total_pomodoro 
    ) VALUES (
        'user@example.com',
        'orange_cat', 
        4500, 
        900, 
        4, 
        4,
        1
    )`;

    db.run(insertMockDataQuery, (err) => {
        if (err) {
            console.log("Error inserting mock data:", err.message);
        } else {
            console.log("Mock data inserted successfully.");
            db.all("SELECT * FROM session", (err, rows) => {
                if (err) {
                    console.log("Error fetching session data:", err.message);
                } else {
                    console.log("Session data:", rows);
                }
            });
        }
    });
}

function clearMockData() {
    const deleteMockDataQuery = `DELETE FROM session`;
    
    const deleteSequenceQuery = `DELETE FROM sqlite_sequence WHERE name='session'`;

    db.run(deleteMockDataQuery, (err) => {
        if (err) {
            console.log("Error clearing mock data:", err.message);
        } else {
            console.log("Mock data cleared successfully.");
            
            db.run(deleteSequenceQuery, (err) => {
                if (err) {
                    console.log("Error resetting session ID sequence:", err.message);
                } else {
                    console.log("Session ID sequence reset successfully.");
                }
            });   
        }
    });   
}

// ------------------------------------------------------

function generateAnalytics(weeksAgo = 0) {
    return new Promise((resolve, reject) => {
        const analyticData = {
            today_work_seconds: 0,
            daily_streak: 0,
            favorite_cat: 'None',
            weekly_data: [0, 0, 0, 0, 0, 0, 0] // Sun to Sat
        };

        // Establish accurate local timezone bounds for "Today" using JavaScript
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayStart.getDate() + 1);
        
        const todayStartUTC = todayStart.toISOString().replace('T', ' ').substring(0, 19);
        const todayEndUTC = todayEnd.toISOString().replace('T', ' ').substring(0, 19);

        const todayWorkQuery = `SELECT SUM(total_work_seconds) AS today_work_seconds FROM session WHERE date_completed >= ? AND date_completed < ?`;
        // change total_work_seconds to total_pomodoro
        const streakQuery = `SELECT date_completed FROM session WHERE total_work_seconds > 0 ORDER BY date_completed DESC`;
        const favoriteCatQuery = `SELECT cat_type, COUNT(*) AS favorite_cat FROM session GROUP BY cat_type ORDER BY favorite_cat DESC LIMIT 1`;
        
        db.get(todayWorkQuery, [todayStartUTC, todayEndUTC], (err, row1) => {
            if (!err && row1 && row1.today_work_seconds) analyticData.today_work_seconds = row1.today_work_seconds;

            // --- STREAK CALCULATOR ---
            db.all(streakQuery, [], (err, streakRows) => {
                if (!err && streakRows) {
                    const activeDays = new Set();
                    streakRows.forEach(row => {
                        if (row.date_completed) {
                            const dateString = row.date_completed.replace(' ', 'T') + 'Z';
                            const localDate = new Date(dateString);
                            // Format as YYYY-MM-DD
                            const dayStr = localDate.getFullYear() + '-' + String(localDate.getMonth() + 1).padStart(2, '0') + '-' + String(localDate.getDate()).padStart(2, '0');
                            activeDays.add(dayStr);
                        }
                    });

                    let streak = 0;
                    let checkDate = new Date();
                    const getCheckStr = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    
                    if (activeDays.has(getCheckStr(checkDate))) {
                        streak = 1;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        checkDate.setDate(checkDate.getDate() - 1);
                        if (activeDays.has(getCheckStr(checkDate))) {
                            streak = 1;
                            checkDate.setDate(checkDate.getDate() - 1);
                        }
                    }
                    
                    if (streak > 0) {
                        while (activeDays.has(getCheckStr(checkDate))) {
                            streak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        }
                    }
                    analyticData.daily_streak = streak;
                }

                // --- FAVORITE CAT ---
                db.get(favoriteCatQuery, [], (err, row3) => {
                    if (!err && row3 && row3.cat_type) analyticData.favorite_cat = row3.cat_type;

                    const now = new Date();
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay() - (weeksAgo * 7));
                    startOfWeek.setHours(0,0,0,0);
                    
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 7);
                    
                    const startOfWeekUTC = startOfWeek.toISOString().replace('T', ' ').substring(0, 19);
                    const endOfWeekUTC = endOfWeek.toISOString().replace('T', ' ').substring(0, 19);
                    
                    const weeklyDataQuery = `SELECT date_completed, total_work_seconds FROM session WHERE date_completed >= ? AND date_completed < ?`;

                    // --- WEEKLY DATA ---
                    db.all(weeklyDataQuery, [startOfWeekUTC, endOfWeekUTC], (err, rows) => {
                        if (!err && rows) {
                            rows.forEach(row => {
                                const dateString = row.date_completed.replace(' ', 'T') + 'Z';
                                const localDate = new Date(dateString);
                                analyticData.weekly_data[localDate.getDay()] += row.total_work_seconds;
                            });
                        }
                        
                        // ALL DONE! Return data to renderer.
                        resolve(analyticData);
                    });
                });
            });
        });
    });
}

module.exports = { db, createMockData, clearMockData, generateAnalytics, pushDatabase, pullDatabase};

