const { app } = require("electron");
const { createClient } = require('@supabase/supabase-js');
const config = require('../../config.js');
const fs = require('fs');
const path = require('path');

// We will save the VIP token right next to your pawse.db file!
const sessionFilePath = path.join(app.getPath('userData'), "supabase-session.json");

// Teach Supabase how to read and write to a local file instead of localStorage
const customStorage = {
    getItem: (key) => {
    try {
        if (fs.existsSync(sessionFilePath)) {
        const data = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
        return data[key] || null;
        }
    } catch (e) { return null; }
    return null;
    },
    setItem: (key, value) => {
    try {
        let data = {};
        if (fs.existsSync(sessionFilePath)) {
        data = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
        }
        data[key] = value;
        fs.writeFileSync(sessionFilePath, JSON.stringify(data));
    } catch (e) {}
    },
    removeItem: (key) => {
    try {
        if (fs.existsSync(sessionFilePath)) {
        let data = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
        delete data[key];
        fs.writeFileSync(sessionFilePath, JSON.stringify(data));
        }
    } catch (e) {}
    }
};

// Initialize Supabase with our new custom memory
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY, {
    auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
    }
});

module.exports = supabase;
