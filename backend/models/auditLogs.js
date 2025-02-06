const pool = require('./db');

const getAuditLogs = async () => {
    return pool.query('SELECT * FROM audit_logs');
};

module.exports = { getAuditLogs };