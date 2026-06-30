// Database Configuration
// Uses mock database by default for testing
// Set USE_REAL_DB=true to use real MySQL

const useRealDb = process.env.USE_REAL_DB === 'true';

let db;

if (useRealDb) {
    // Real MySQL connection
    const mysql = require('mysql');
    db = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'fitness_db'
    });
    
    db.connect((err) => {
        if (err) {
            console.error('Database connection failed:', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.error('Database connection was closed.');
            }
            if (err.code === 'ER_CON_COUNT_ERROR') {
                console.error('Database has too many connections.');
            }
            if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('Database access was denied.');
            }
        } else {
            console.log('MySQL connected successfully');
        }
    });
} else {
    // Mock database for testing
    db = require('./mockDb');
    db.connect();
}

module.exports = db;
