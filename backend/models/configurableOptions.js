const pool = require('./db');

const getConfigurableOptions = async (category) => {
    return pool.query('SELECT * FROM configurable_options WHERE category = $1 AND is_active = true', [category]);
};

const addConfigurableOption = async (category, value, academicYear, createdBy) => {
    const academicYearToUse = academicYear || await pool.query('SELECT get_current_academic_year()').then(result => result.rows[0].get_current_academic_year);
    return pool.query(
        'INSERT INTO configurable_options (category, value, academic_year, created_by, modified_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [category, value, academicYearToUse, createdBy, createdBy]
    );
};

const deactivateConfigurableOption = async (id, modifiedBy) => {
    return pool.query(
        'UPDATE configurable_options SET is_active = false, modified_at = CURRENT_TIMESTAMP, modified_by = $1 WHERE id = $2',
        [modifiedBy, id]
    );
};

const updateConfigurableOption = async (id, value, academicYear, modifiedBy) => {
    const academicYearToUse = academicYear || await pool.query('SELECT get_current_academic_year()').then(result => result.rows[0].get_current_academic_year);
    return pool.query(
        'UPDATE configurable_options SET value = $1, academic_year = $2, modified_at = CURRENT_TIMESTAMP, modified_by = $3 WHERE id = $4 RETURNING *',
        [value, academicYearToUse, modifiedBy, id]
    );
};

module.exports = {
    getConfigurableOptions,
    addConfigurableOption,
    deactivateConfigurableOption,
    updateConfigurableOption,
};