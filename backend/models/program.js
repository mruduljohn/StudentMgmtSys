const pool = require('./db');

const getActivePrograms = async () => {
    return pool.query('SELECT * FROM configurable_options WHERE category = $1 AND is_active = true', ['PROGRAM']);
};

const getProgramById = async (id) => {
    return pool.query('SELECT * FROM configurable_options WHERE id = $1', [id]);
};

const createProgram = async (programData) => {
    return pool.query(
        'INSERT INTO configurable_options (category, value, academic_year, created_by, modified_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
            'PROGRAM',
            programData.program_name,
            programData.academic_year,
            programData.created_by,
            programData.modified_by,
        ]
    );
};

const updateProgram = async (id, programData) => {
    return pool.query(
        'UPDATE configurable_options SET value = $1, academic_year = $2, modified_at = CURRENT_TIMESTAMP, modified_by = $3 WHERE id = $4 RETURNING *',
        [
            programData.program_name,
            programData.academic_year,
            programData.modified_by,
            id,
        ]
    );
};

const deleteProgram = async (id) => {
    return pool.query(
        'UPDATE configurable_options SET is_active = false, modified_at = CURRENT_TIMESTAMP, modified_by = $1 WHERE id = $2',
        [req.user.id, id]
    );
};

module.exports = { getActivePrograms, getProgramById, createProgram, updateProgram, deleteProgram };