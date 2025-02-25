const { getActivePrograms, getProgramById, createProgram, updateProgram, deleteProgram } = require('../models/program');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');

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

const getAllPrograms = async (req, res) => {
    try {
        const programs = await getActivePrograms();
        res.json(programs.rows);
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ message: error.message });
    }
};

const getSingleProgram = async (req, res) => {
    try {
        const program = await getProgramById(req.params.id);
        if (program.rows.length === 0) {
            return res.status(404).json({ message: 'Program not found' });
        }
        res.json(program.rows[0]);
    } catch (error) {
        console.error('Error fetching program:', error);
        res.status(500).json({ message: error.message });
    }
};

const createNewProgram = async (req, res) => {
    try {
        const programData = req.body;
        programData.created_by = req.user.id;
        programData.modified_by = req.user.id;
        programData.academic_year = await pool.query('SELECT get_current_academic_year()').then(result => result.rows[0].get_current_academic_year);
        const program = await createProgram(programData);
        res.status(201).json(program.rows[0]);
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateExistingProgram = async (req, res) => {
    try {
        const programData = req.body;
        programData.modified_by = req.user.id;
        const program = await updateProgram(req.params.id, programData);
        if (program.rows.length === 0) {
            return res.status(404).json({ message: 'Program not found' });
        }
        res.json(program.rows[0]);
    } catch (error) {
        console.error('Error updating program:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteExistingProgram = async (req, res) => {
    try {
        const program = await deleteProgram(req.params.id, req.user.id);
        if (program.rowCount === 0) {
            return res.status(404).json({ message: 'Program not found' });
        }
        res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('Error deleting program:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllPrograms,
    getSingleProgram,
    createNewProgram,
    updateExistingProgram,
    deleteExistingProgram,
    verifyToken,
    isAdmin,
};