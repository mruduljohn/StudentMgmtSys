const { createUser, getUserByUsername } = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        console.log('Registering user:', username, role); // Debug log

        const existingUser = await getUserByUsername(username);
        console.log('Existing user:', existingUser.rows); // Debug log

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const result = await createUser(username, password, role);
        console.log('User created:', result.rows); // Debug log

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error); // Debug log
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Logging in user:', username); // Debug log

        const user = await getUserByUsername(username);
        console.log('User found:', user.rows); // Debug log

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        console.log('Password valid:', validPassword); // Debug log

        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.SECRET_KEY, { expiresIn: '1h' });
        console.log('Token generated:', token); // Debug log

        res.json({ token, user: user.rows[0] }); // Return user data
    } catch (error) {
        console.error('Error during login:', error); // Debug log
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login };