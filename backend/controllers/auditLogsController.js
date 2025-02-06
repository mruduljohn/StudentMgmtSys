const { getAuditLogs } = require('../models/auditLogs');
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

const getAllAuditLogs = async (req, res) => {
    try {
        const auditLogs = await getAuditLogs();
        res.json(auditLogs.rows);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllAuditLogs, verifyToken, isAdmin };