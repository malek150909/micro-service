// backend/config/db.js
const mysql = require('mysql2');

// Create a connection to the MySQL database
const db = mysql.createConnection({
    host: 'localhost', // Replace with your MySQL host
    user: 'root', // Replace with your MySQL username
    password: '15092003Malek@', // Replace with your MySQL password
    database: 'uni_db' // Replace with your database name
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the application if the connection fails
    }
    console.log('Connected to the MySQL database');
});

// Export the database connection
module.exports = db;