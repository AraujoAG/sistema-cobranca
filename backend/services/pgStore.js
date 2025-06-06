// backend/services/pgStore.js
const db = require('../config/db');

/**
 * Este é o nosso conector customizado que ensina a RemoteAuth a usar o PostgreSQL.
 * Ele precisa ter quatro funções: save, fetch, delete, e sessionExists.
 */
class PgStore {
    constructor(options) {
        this.tableName = options.tableName || 'wwebjs_sessions';
    }

    /**
     * Salva ou atualiza os dados da sessão no banco de dados.
     */
    async save(options) {
        const sessionKey = options.session;
        const sessionValue = JSON.stringify(options);

        const query = `
            INSERT INTO ${this.tableName} (session_key, session_value) 
            VALUES ($1, $2) 
            ON CONFLICT (session_key) 
            DO UPDATE SET session_value = $2;
        `;
        await db.query(query, [sessionKey, sessionValue]);
    }

    /**
     * Busca os dados da sessão do banco de dados.
     */
    async fetch(options) {
        const sessionKey = options.session;
        const query = `SELECT session_value FROM ${this.tableName} WHERE session_key = $1;`;
        const { rows } = await db.query(query, [sessionKey]);

        if (rows.length === 0) {
            return null;
        }
        return JSON.parse(rows[0].session_value);
    }

    /**
     * Deleta os dados da sessão do banco de dados.
     */
    async delete(options) {
        const sessionKey = options.session;
        const query = `DELETE FROM ${this.tableName} WHERE session_key = $1;`;
        await db.query(query, [sessionKey]);
    }

    /**
     * **--> A FUNÇÃO QUE FALTAVA <--**
     * Verifica se uma sessão com a chave fornecida já existe no banco.
     * Retorna true se existir, false caso contrário.
     */
    async sessionExists(options) {
        const sessionKey = options.session;
        const query = `SELECT 1 FROM ${this.tableName} WHERE session_key = $1 LIMIT 1;`;
        const { rowCount } = await db.query(query, [sessionKey]);
        return rowCount > 0;
    }
}

module.exports = PgStore;