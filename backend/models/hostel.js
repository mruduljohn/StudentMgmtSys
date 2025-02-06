const pool = require('./db');

const getActiveHostels = async () => {
    return pool.query('SELECT * FROM configurable_options WHERE category = $1 AND is_active = true', ['HOSTEL']);
};

const getHostelById = async (id) => {
    return pool.query('SELECT * FROM configurable_options WHERE id = $1', [id]);
};

const createHostel = async (hostelData) => {
    return pool.query(
        'INSERT INTO configurable_options (category, value, academic_year, created_by, modified_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
            'HOSTEL',
            hostelData.hostel_name,
            hostelData.academic_year,
            hostelData.created_by,
            hostelData.modified_by,
        ]
    );
};

const updateHostel = async (id, hostelData) => {
    return pool.query(
        'UPDATE configurable_options SET value = $1, academic_year = $2, modified_at = CURRENT_TIMESTAMP, modified_by = $3 WHERE id = $4 RETURNING *',
        [
            hostelData.hostel_name,
            hostelData.academic_year,
            hostelData.modified_by,
            id,
        ]
    );
};

const deleteHostel = async (id) => {
    return pool.query(
        'UPDATE configurable_options SET is_active = false, modified_at = CURRENT_TIMESTAMP, modified_by = $1 WHERE id = $2',
        [req.user.id, id]
    );
};

module.exports = { getActiveHostels, getHostelById, createHostel, updateHostel, deleteHostel };