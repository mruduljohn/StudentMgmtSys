const pool = require('./db');

const getActiveHostels = async () => {
    return pool.query('SELECT * FROM configurable_options WHERE category = $1 AND is_active = true', ['HOSTEL']);
};

const getHostelById = async (id) => {
    return pool.query('SELECT * FROM configurable_options WHERE id = $1 AND is_active = true', [id]);
};

const createHostel = async (hostelData) => {
    const academicYear = await pool.query('SELECT get_current_academic_year()').then(result => result.rows[0].get_current_academic_year);
    return pool.query(
        'INSERT INTO configurable_options (category, value, academic_year, created_by, modified_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['HOSTEL', hostelData.hostel_name, academicYear, hostelData.created_by, hostelData.modified_by]
    );
};

const updateExistingHostel = async (id, hostelData) => {
    return pool.query(
        'UPDATE configurable_options SET value = $1, modified_at = CURRENT_TIMESTAMP, modified_by = $2 WHERE id = $3 RETURNING *',
        [hostelData.hostel_name, hostelData.modified_by, id]
    );
};

const deleteExistingHostel = async (id) => {
    return pool.query(
        'UPDATE configurable_options SET is_active = false, modified_at = CURRENT_TIMESTAMP, modified_by = $1 WHERE id = $2',
        [hostelData.modified_by, id]
    );
};

module.exports = {
    getActiveHostels,
    getHostelById,
    createHostel,
    updateExistingHostel,
    deleteExistingHostel,
};