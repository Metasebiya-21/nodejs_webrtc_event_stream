const { Sequelize } = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const advertise = sequelize.define("advertise",{
    id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        unique:true,
        primaryKey:true
    },
    fileName:{
        type:Sequelize.STRING,
        allowNull:false
    },
    filePath:{
        type:Sequelize.STRING,
        allowNull:false
    },
    
    descrieption:{
        type:Sequelize.STRING,
        allowNull:false
    },
})
module.exports=advertise