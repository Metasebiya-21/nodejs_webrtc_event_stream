const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const videoCart = sequelize.define("cart",{
id:{    type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        unique:true,
        primaryKey:true
},
video_id:{
    type:Sequelize.INTEGER,
    allowNull:false
  },
userId:{
    type:Sequelize.INTEGER,
  allowNull:false
},
quantity:{
    type:Sequelize.INTEGER,
    allowNull:false
}
})
module.exports=videoCart