const { getActiveHostels, getHostelById, createHostel, updateHostel, deleteHostel } = require('../models/hostel');
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

const getAllHostels = async (req, res) => {
    try {
        const hostels = await getActiveHostels();
        res.json(hostels.rows);
    } catch (error) {
        console.error('Error fetching hostels:', error);
        res.status(500).json({ message: error.message });
    }
};

const getSingleHostel = async (req, res) => {
    try {
        const hostel = await getHostelById(req.params.id);
        if (hostel.rows.length === 0) {
            return res.status(404).json({ message: 'Hostel not found' });
        }
        res.json(hostel.rows[0]);
    } catch (error) {
        console.error('Error fetching hostel:', error);
        res.status(500).json({ message: error.message });
    }
};

const createNewHostel = async (req, res) => {
    try {
        const hostelData = req.body;
        hostelData.created_by = req.user.id;
        hostelData.modified_by = req.user.id;
        const hostel = await createHostel(hostelData);
        res.status(201).json(hostel.rows[0]);
    } catch (error) {
        console.error('Error creating hostel:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateExistingHostel = async (req, res) => {
    try {
        const hostelData = req.body;
        hostelData.modified_by = req.user.id;
        const hostel = await updateHostel(req.params.id, hostelData);
        if (hostel.rows.length === 0) {
            return res.status(404).json({ message: 'Hostel not found' });
        }
        res.json(hostel.rows[0]);
    } catch (error) {
        console.error('Error updating hostel:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteExistingHostel = async (req, res) => {
    try {
        const hostel = await deleteHostel(req.params.id);
        if (hostel.rowCount === 0) {
            return res.status(404).json({ message: 'Hostel not found' });
        }
        res.json({ message: 'Hostel deleted successfully' });
    } catch (error) {
        console.error('Error deleting hostel:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllHostels, getSingleHostel, createNewHostel, updateExistingHostel, deleteExistingHostel, verifyToken, isAdmin };