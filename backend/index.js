const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const pool = require('./models/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', routes);

// Test route
app.get('/', (req, res) => {
    res.send('Student Management System Backend');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});