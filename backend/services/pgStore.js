// backend/services/pgStore.js
const db = require('../config/db');

/**
 * Este é o nosso conector customizado que ensina a RemoteAuth a usar o PostgreSQL.
 * Ele precisa ter três funções: save, fetch, e delete.
 */
class PgStore {
    constructor(options) {
        // Guardamos o nome da tabela para o caso de querermos reutilizar
        this.tableName = options.tableName || 'wwebjs_sessions';
    }

    /**
     * Salva ou atualiza os dados da sessão no banco de dados.
     * @param {object} options - Contém a chave da sessão e os dados.
     */
    async save(options) {
        const { session } = options;
        // A chave da sessão é o 'clientId' que definiremos no whatsappService
        const sessionKey = session; 
        // O valor é o objeto de sessão completo, convertido para texto JSON
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
     * @param {object} options - Contém a chave da sessão a ser buscada.
     */
    async fetch(options) {
        const { session } = options;
        const sessionKey = session;
        const query = `SELECT session_value FROM ${this.tableName} WHERE session_key = $1;`;
        const { rows } = await db.query(query, [sessionKey]);

        if (rows.length === 0) {
            return null; // Retorna nulo se não encontrar a sessão
        }
        // Converte o texto JSON de volta para um objeto
        return JSON.parse(rows[0].session_value);
    }

    /**
     * Deleta os dados da sessão do banco de dados.
     * @param {object} options - Contém a chave da sessão a ser deletada.
     */
    async delete(options) {
        const { session } = options;
        const sessionKey = session;
        const query = `DELETE FROM ${this.tableName} WHERE session_key = $1;`;
        await db.query(query, [sessionKey]);
    }
}

module.exports = PgStore;