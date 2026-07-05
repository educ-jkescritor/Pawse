const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "pawse.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
        
        const createTableQuery = `CREATE TABLE IF NOT EXISTS session (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cat_type TEXT,
            total_work_seconds INTEGER,
            total_break_seconds INTEGER,
            total_work INTEGER,
            total_break INTEGER,
            total_pomodoro INTEGER,
            date_completed DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
        
        db.run(createTableQuery, (err) => {
            if (err) {
                console.log("Error creating session table:", err.message);
            } else {
                console.log("Session database is ready.");
            }
        });
    }
});

function createMockData() {
    const insertMockDataQuery = `INSERT INTO session (
        cat_type, 
        total_work_seconds, 
        total_break_seconds, 
        total_work, 
        total_break,
        total_pomodoro 
    ) VALUES (
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

function generateAnalytics(weeksAgo = 0) {
    return new Promise((resolve, reject) => {
        const analyticData = {
            today_work_seconds: 0,
            historical_pomodoro: 0,
            favorite_cat: 'None',
            weekly_data: [0, 0, 0, 0, 0, 0, 0] // Sun to Sat
        };

        const todayWorkQuery = `SELECT SUM(total_work_seconds) AS today_work_seconds FROM session WHERE date(date_completed, 'localtime') = date('now', 'localtime')`;
        const historicalPomodoroQuery = `SELECT SUM(total_pomodoro) AS historical_pomodoro FROM session`;
        const favoriteCatQuery = `SELECT cat_type, COUNT(*) AS favorite_cat FROM session GROUP BY cat_type ORDER BY favorite_cat DESC LIMIT 1`;
        db.get(todayWorkQuery, [], (err, row1) => {
            if (!err && row1 && row1.today_work_seconds) analyticData.today_work_seconds = row1.today_work_seconds;

            db.get(historicalPomodoroQuery, [], (err, row2) => {
                if (!err && row2 && row2.historical_pomodoro) analyticData.historical_pomodoro = row2.historical_pomodoro;

                db.get(favoriteCatQuery, [], (err, row3) => {
                    if (!err && row3 && row3.cat_type) analyticData.favorite_cat = row3.cat_type;

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

                        resolve(analyticData);
                    });
                });
            });
        });
    });
}

module.exports = { db, createMockData, clearMockData, generateAnalytics };

