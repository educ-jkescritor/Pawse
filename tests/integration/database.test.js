/**
 * Integration Tests: SQLite Schema, Migration, & Data Normalization
 * Tests database operations using an isolated in-memory SQLite database.
 */

const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

describe("Database Schema & Introspective Migration", () => {
    let db;

    // Helper wrappers to convert callback-based sqlite3 methods into clean Promises
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const all = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    beforeEach(async () => {
        await new Promise((resolve, reject) => {
            db = new sqlite3.Database(":memory:", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    afterEach(async () => {
        if (db) {
            await new Promise((resolve) => db.close(resolve));
        }
    });

    test("initializes session table with all 11 required columns", async () => {
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

        await run(createTableQuery);

        const columns = await all("PRAGMA table_info(session)");
        const columnNames = columns.map(c => c.name);

        expect(columnNames).toHaveLength(11);
        expect(columnNames).toContain("id");
        expect(columnNames).toContain("email");
        expect(columnNames).toContain("cat_type");
        expect(columnNames).toContain("total_work_seconds");
        expect(columnNames).toContain("total_break_seconds");
        expect(columnNames).toContain("total_work");
        expect(columnNames).toContain("total_break");
        expect(columnNames).toContain("total_pomodoro");
        expect(columnNames).toContain("date_completed");
        expect(columnNames).toContain("is_synced");
        expect(columnNames).toContain("uuid");
    });

    test("idempotently skips ALTER TABLE when columns already exist", async () => {
        const createTableQuery = `CREATE TABLE session (
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

        await run(createTableQuery);

        // Introspect table structure (mimicking database.js migration logic)
        const columns = await all("PRAGMA table_info(session)");
        const existingColumnNames = new Set(columns.map(c => c.name));
        const requiredColumns = [
            { name: "uuid", ddl: "ALTER TABLE session ADD COLUMN uuid TEXT" },
            { name: "is_synced", ddl: "ALTER TABLE session ADD COLUMN is_synced INTEGER DEFAULT 0" },
            { name: "email", ddl: "ALTER TABLE session ADD COLUMN email TEXT DEFAULT 'guest'" }
        ];

        const missingColumns = requiredColumns.filter(c => !existingColumnNames.has(c.name));

        // Should find ZERO missing columns on an up-to-date database
        expect(missingColumns).toHaveLength(0);
    });

    test("successfully backfills UUIDs and 'guest' email to legacy sessions", async () => {
        // 1. Create legacy table with only 8 columns (v1.0.0 schema)
        const legacyTableQuery = `CREATE TABLE session (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cat_type TEXT,
            total_work_seconds INTEGER,
            total_break_seconds INTEGER,
            total_work INTEGER,
            total_break INTEGER,
            total_pomodoro INTEGER,
            date_completed DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;

        await run(legacyTableQuery);

        // 2. Insert 2 legacy rows without UUIDs or email
        await run(`INSERT INTO session (cat_type, total_work_seconds) VALUES ('tuxedo_cat', 1500)`);
        await run(`INSERT INTO session (cat_type, total_work_seconds) VALUES ('orange_cat', 900)`);

        // 3. Simulate migration: add missing columns
        await run("ALTER TABLE session ADD COLUMN uuid TEXT");
        await run("ALTER TABLE session ADD COLUMN is_synced INTEGER DEFAULT 0");
        await run("ALTER TABLE session ADD COLUMN email TEXT DEFAULT 'guest'");

        // 4. Run data hygiene and backfill
        await run("UPDATE session SET email = 'guest' WHERE email IS NULL OR email = ''");

        const legacyRows = await all("SELECT id FROM session WHERE uuid IS NULL OR uuid = ''");
        expect(legacyRows).toHaveLength(2);

        // Sequentially assign UUIDs to ensure every write completes deterministically
        for (const row of legacyRows) {
            const newUuid = crypto.randomUUID();
            await run("UPDATE session SET uuid = ?, is_synced = 0 WHERE id = ?", [newUuid, row.id]);
        }

        // 5. Verify backfill complete
        const updatedRows = await all("SELECT * FROM session");
        expect(updatedRows).toHaveLength(2);

        for (const row of updatedRows) {
            expect(row.email).toBe("guest");
            expect(row.is_synced).toBe(0);
            expect(typeof row.uuid).toBe("string");
            expect(row.uuid.length).toBeGreaterThan(10);
        }
    });
});
