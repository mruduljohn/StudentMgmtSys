const pool = require('./db');

const getConfigurableOptions = async (category) => {
    return pool.query('SELECT * FROM configurable_options WHERE category = $1 AND is_active = true', [category]);
};

const addConfigurableOption = async (category, value, academicYear) => {
    return pool.query(
        'INSERT INTO configurable_options (category, value, academic_year, created_by, modified_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [category, value, academicYear, req.user.id, req.user.id]
    );
};

const deactivateConfigurableOption = async (id) => {
    return pool.query(
        'UPDATE configurable_options SET is_active = false, modified_at = CURRENT_TIMESTAMP, modified_by = $1 WHERE id = $2 RETURNING *',
        [req.user.id, id]
    );
};

module.exports = { getConfigurableOptions, addConfigurableOption, deactivateConfigurableOption };