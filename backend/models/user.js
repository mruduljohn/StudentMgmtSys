const pool = require('./db');
const bcrypt = require('bcryptjs');

const createUser = async (username, password, role, email) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return pool.query(
        'INSERT INTO users (username, password_hash, role, email) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, hashedPassword, role, email]
    );
};

const getUserByUsername = async (username) => {
    return pool.query('SELECT * FROM users WHERE username = $1', [username]);
};

const updateUserLastLogin = async (userId) => {
    return pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
    );
};

module.exports = { createUser, getUserByUsername, updateUserLastLogin };