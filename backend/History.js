const { DataTypes } = require('sequelize');
const sequelize = require('./database_sqlite');

const History = sequelize.define('History', {
    input: {
        type: DataTypes.JSON, // Store tokens array
        allowNull: false
    },
    output: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mode: {
        type: DataTypes.STRING,
        defaultValue: 'DEAF' // 'DEAF', 'BLIND', 'MOTOR'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = History;
