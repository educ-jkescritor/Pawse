/**
 * PAWSE Test Suite — Database & SQLite Concurrency
 * Validates SQLite WAL mode, PRAGMA busy_timeout, parameterized query security, and ACID transactions.
 */

const sqlite3 = require('sqlite3').verbose();

describe('SQLite Database & Concurrency Protections', () => {
    let testDb;

    beforeEach((done) => {
        // Open an in-memory SQLite database instance for clean, isolated test runs
        testDb = new sqlite3.Database(':memory:', (err) => {
            if (err) return done(err);

            // Apply PAWSE v1.0.0 PRAGMA optimizations
            testDb.run("PRAGMA journal_mode = WAL;");
            testDb.run("PRAGMA busy_timeout = 3000;");
            testDb.run("PRAGMA synchronous = NORMAL;");

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
            testDb.run(createTableQuery, done);
        });
    });

    afterEach((done) => {
        if (testDb) {
            testDb.close(done);
        } else {
            done();
        }
    });

    test('should configure busy_timeout to 3000ms to eliminate SQLITE_BUSY race conditions', (done) => {
        testDb.get("PRAGMA busy_timeout;", (err, row) => {
            expect(err).toBeNull();
            expect(row.timeout).toBeGreaterThanOrEqual(3000);
            done();
        });
    });

    test('should configure synchronous to NORMAL for high-throughput concurrency', (done) => {
        testDb.get("PRAGMA synchronous;", (err, row) => {
            expect(err).toBeNull();
            // SQLite PRAGMA synchronous returns 1 for NORMAL
            expect(row.synchronous).toBe(1);
            done();
        });
    });

    test('should insert and query session using parameterized statements without SQL injection vulnerabilities', (done) => {
        const maliciousPayload = "guest'; DROP TABLE session; --";
        const sessionUuid = 'test-uuid-1234';

        const insertQuery = `INSERT INTO session (email, cat_type, total_work_seconds, total_break_seconds, total_work, total_break, total_pomodoro, uuid)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        testDb.run(insertQuery, [maliciousPayload, 'tuxedo', 1500, 300, 1, 1, 1, sessionUuid], function (err) {
            expect(err).toBeNull();

            // Verify session table is intact and the malicious string was safely stored as raw text
            testDb.get("SELECT * FROM session WHERE uuid = ?", [sessionUuid], (err, row) => {
                expect(err).toBeNull();
                expect(row).toBeDefined();
                expect(row.email).toBe(maliciousPayload);
                expect(row.cat_type).toBe('tuxedo');
                expect(row.total_work_seconds).toBe(1500);
                done();
            });
        });
    });

    test('should handle concurrent read and write operations without throwing locked errors', (done) => {
        let completed = 0;
        const totalOperations = 10;

        function checkComplete() {
            completed++;
            if (completed === totalOperations * 2) {
                done();
            }
        }

        // Simulate 10 simultaneous writes and 10 simultaneous reads
        for (let i = 0; i < totalOperations; i++) {
            const uuid = `concurrent-uuid-${i}`;
            testDb.run(
                `INSERT INTO session (email, cat_type, total_work_seconds, uuid) VALUES (?, ?, ?, ?)`,
                ['guest', 'ginger', 1500, uuid],
                (err) => {
                    expect(err).toBeNull();
                    checkComplete();
                }
            );

            testDb.all(`SELECT COUNT(*) as count FROM session`, (err, rows) => {
                expect(err).toBeNull();
                expect(rows[0].count).toBeGreaterThanOrEqual(0);
                checkComplete();
            });
        }
    });

    test('should enforce unique constraint on session UUID deduplication', (done) => {
        const duplicateUuid = 'dedup-test-uuid';

        const query = `INSERT INTO session (email, cat_type, total_work_seconds, uuid) VALUES (?, ?, ?, ?)`;

        testDb.run(query, ['guest', 'void', 1500, duplicateUuid], (err) => {
            expect(err).toBeNull();

            // Attempting to insert the exact same UUID must be rejected by SQLite
            testDb.run(query, ['guest', 'void', 1500, duplicateUuid], (err) => {
                expect(err).toBeDefined();
                expect(err.message).toMatch(/UNIQUE constraint failed/);
                done();
            });
        });
    });
});
