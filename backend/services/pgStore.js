// backend/services/pgStore.js
const db = require('../config/db');

class PgStore {
    constructor(options) {
        this.tableName = options.tableName || 'wwebjs_sessions';
    }

    async save(options) {
        const { session } = options;
        const sessionKey = session; 
        const sessionValue = JSON.stringify(options);

        const query = `
            INSERT INTO ${this.tableName} (session_key, session_value) 
            VALUES ($1, $2) 
            ON CONFLICT (session_key) 
            DO UPDATE SET session_value = $2;
        `;
        await db.query(query, [sessionKey, sessionValue]);
    }

    async fetch(options) {
        const { session } = options;
        const sessionKey = session;
        const query = `SELECT session_value FROM ${this.tableName} WHERE session_key = $1;`;
        const { rows } = await db.query(query, [sessionKey]);

        if (rows.length === 0) {
            return null;
        }
        return JSON.parse(rows[0].session_value);
    }

    async delete(options) {
        const { session } = options;
        const sessionKey = session;
        const query = `DELETE FROM ${this.tableName} WHERE session_key = $1;`;
        await db.query(query, [sessionKey]);
    }
}

module.exports = PgStore;