const { getBatches, getBatchById, createBatch, updateBatch, deleteBatch } = require('../models/batch');
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

const getAllBatches = async (req, res) => {
    try {
        const batches = await getBatches();
        res.json(batches.rows);
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ message: error.message });
    }
};

const getSingleBatch = async (req, res) => {
    try {
        const batch = await getBatchById(req.params.id);
        if (batch.rows.length === 0) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        res.json(batch.rows[0]);
    } catch (error) {
        console.error('Error fetching batch:', error);
        res.status(500).json({ message: error.message });
    }
};

const createNewBatch = async (req, res) => {
    try {
        const batchData = req.body;
        batchData.created_by = req.user.id;
        batchData.modified_by = req.user.id;
        const batch = await createBatch(batchData);
        res.status(201).json(batch.rows[0]);
    } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateExistingBatch = async (req, res) => {
    try {
        const batchData = req.body;
        batchData.modified_by = req.user.id;
        const batch = await updateBatch(req.params.id, batchData);
        if (batch.rows.length === 0) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        res.json(batch.rows[0]);
    } catch (error) {
        console.error('Error updating batch:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteExistingBatch = async (req, res) => {
    try {
        const batch = await deleteBatch(req.params.id);
        if (batch.rowCount === 0) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllBatches, getSingleBatch, createNewBatch, updateExistingBatch, deleteExistingBatch, verifyToken, isAdmin };