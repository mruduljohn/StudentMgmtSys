const pool = require('./db');

const getBatches = async () => {
    return pool.query('SELECT * FROM batches');
};

const getBatchById = async (id) => {
    return pool.query('SELECT * FROM batches WHERE id = $1', [id]);
};

const createBatch = async (batchData) => {
    return pool.query(
        'INSERT INTO batches (batch_id, strength, stream, program_id, class_teacher, created_by, modified_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
            batchData.batch_id,
            batchData.strength,
            batchData.stream,
            batchData.program_id,
            batchData.class_teacher,
            batchData.created_by,
            batchData.modified_by,
        ]
    );
};

const updateBatch = async (id, batchData) => {
    return pool.query(
        'UPDATE batches SET batch_id = $1, strength = $2, stream = $3, program_id = $4, class_teacher = $5, modified_at = CURRENT_TIMESTAMP, modified_by = $6 WHERE id = $7 RETURNING *',
        [
            batchData.batch_id,
            batchData.strength,
            batchData.stream,
            batchData.program_id,
            batchData.class_teacher,
            batchData.modified_by,
            id,
        ]
    );
};

const deleteBatch = async (id) => {
    return pool.query('DELETE FROM batches WHERE id = $1', [id]);
};

module.exports = { getBatches, getBatchById, createBatch, updateBatch, deleteBatch };