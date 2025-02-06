const pool = require('../models/db');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Access Denied: Admin Only' });
    next();
};

const getConfigurableOptions = async (req, res) => {
    try {
        const { category } = req.params;
        const result = await pool.query('SELECT * FROM configurable_options WHERE category = $1 AND is_active = true', [category]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching configurable options:', error);
        res.status(500).json({ message: error.message });
    }
};

const addConfigurableOption = async (req, res) => {
    try {
        const { category, value, academicYear } = req.body;
        const academicYearToUse = academicYear || await pool.query('SELECT get_current_academic_year()').then(result => result.rows[0].get_current_academic_year);
        const result = await pool.query(
            'INSERT INTO configurable_options (category, value, academic_year, created_by, modified_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [category, value, academicYearToUse, req.user.id, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding configurable option:', error);
        res.status(500).json({ message: error.message });
    }
};

const deactivateConfigurableOption = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE configurable_options SET is_active = false, modified_at = CURRENT_TIMESTAMP, modified_by = $1 WHERE id = $2 RETURNING *',
            [req.user.id, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Configurable option not found' });
        }
        res.json({ message: 'Configurable option deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating configurable option:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getConfigurableOptions,
    addConfigurableOption,
    deactivateConfigurableOption,
    verifyToken,
    isAdmin,
};