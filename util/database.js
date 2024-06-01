const Sequelize = require('sequelize');
const config = require('../config/db_config');
console.log('config', config)
const sequelize = new Sequelize(config.DB,
                                config.USER,
                                config.PASS,{
                                    host: 'localhost',
                                    dialect:'mysql',  
                                    //logging: function () {}, //disable displays logs of the sequelize
                                    pool: {
                                        max: 5,
                                        min: 0,
                                        idle: 10000
                                    },
                                });
//export the database: the sequelize instance holds for a connection to a single database 
module.exports = sequelize;