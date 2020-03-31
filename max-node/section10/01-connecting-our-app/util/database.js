const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'qodjstn!00', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;