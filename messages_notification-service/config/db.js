// backend/config/db.js
const mysql = require('mysql2/promise');
require("dotenv").config();

// Create a connection to the MySQL database
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Connect to the database
db.getConnection()
    .then(() => console.log("Connected to the MySQL database"))
    .catch(err => console.error("Database connection error:", err));

// Export the database connection
module.exports = db;