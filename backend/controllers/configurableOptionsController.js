const configurableOptionsModel = require('../models/configurableOptions');
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
        const result = await configurableOptionsModel.getConfigurableOptions(category);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching configurable options:', error);
        res.status(500).json({ message: error.message });
    }
};

const addConfigurableOption = async (req, res) => {
    try {
        const { category, value, academicYear } = req.body;
        const result = await configurableOptionsModel.addConfigurableOption(category, value, academicYear, req.user.id);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding configurable option:', error);
        res.status(500).json({ message: error.message });
    }
};

const deactivateConfigurableOption = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await configurableOptionsModel.deactivateConfigurableOption(id, req.user.id);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Configurable option not found' });
        }
        res.json({ message: 'Configurable option deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating configurable option:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateConfigurableOption = async (req, res) => {
    try {
        const { id } = req.params;
        const { value, academicYear } = req.body;
        const result = await configurableOptionsModel.updateConfigurableOption(id, value, academicYear, req.user.id);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Configurable option not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating configurable option:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getConfigurableOptions,
    addConfigurableOption,
    deactivateConfigurableOption,
    updateConfigurableOption,
    verifyToken,
    isAdmin,
};