const { Sequelize } = require('sequelize');
const path = require('path');

// Use SQLite for simple, file-based persistence
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'access_ai.sqlite'), // Database file
    logging: false // Disable logging for cleaner output
});

module.exports = sequelize;
