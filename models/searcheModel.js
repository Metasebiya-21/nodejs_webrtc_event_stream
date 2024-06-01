const { Sequelize } = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const search = sequelize.define("searchHistory",{
    id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        unique:true,
        primaryKey:true
    },
    userId:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    searchName:{
        type:Sequelize.STRING,
        allowNull:false
    },
})
module.exports=search