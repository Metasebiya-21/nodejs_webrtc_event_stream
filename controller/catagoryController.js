const express = require('express');
const router = express.Router();
const video_catagory = require('../models/video_catagory');
const subCategory=require('../models/subCategory')
const mainCatagorie=require('../models/mainCategorie');
const mainCategorie = require('../models/mainCategorie');
const { Op } = require("sequelize");
router.post('/createSubCatagory', async (req, res) => {
  const data = ({ catagorey_name, Description,CategoryID } = req.body);
  console.log(data)
  subCategory
    .create({
      CategoryID:data.CategoryID,
      catagory_Name: data.catagorey_name,
      Description: data.Description,
    })
    .then((resualt) => {
      res.status(200).json({ data:'scusses' });
    })
    .catch((err) => {
      console.log(err);
    });
    
});
router.post('/createCatagory', async (req, res) => {
  const data = ({ catagorey_name, Description,CategoryID } = req.body);
  console.log(data)
  mainCategorie
    .create({
      parentId :CategoryID,
      catagory_Name: data.catagorey_name,
      Description: data.Description,
    })
    .then((resualt) => {
      console.log(resualt)
      res.status(200).json({  data:'scusses' });
    })
    .catch((err) => {
      console.log(err);
    });
    
});
router.get('/getCtagoreyById/:id', async (req, res) => {
  const id = req.params.id;
  const resualt = await mainCategorie.findOne({ where: { id: id } });
  if (resualt) {
    res.status(200).json({ data: resualt });
  } else {
    res.send({ messages: 'no catagory' });
  }
});
router.get('/getAllCatagory', async (req, res) => {
  mainCatagorie.findAll({ order: [['updatedAt', 'DESC']],
  include: [{ model: mainCatagorie ,  as:"parent"}],

 
}).then((resualt) => {
    if (resualt) {
const parentID=resualt.parentId
console.log(parentID)
      return res.json({ data: resualt });
    } else {
      res.send({ messages: 'no data at all' });
    }
  });
});
router.get('/getAllCatagory', async (req, res) => {
  mainCatagorie.findAll({ order: [['updatedAt', 'DESC']],where:{parentId:{
    [Op.not]: true, 
  }},
  include: [{ model: mainCatagorie ,  as:"parent"}],

 
}).then((resualt) => {
    if (resualt) {

      return res.json({ data: resualt });
    } else {
      res.send({ messages: 'no data at all' });
    }
  });
});
router.get('/getMainCategorie', async (req, res) => {
  mainCatagorie.findAll({ order: [['updatedAt', 'DESC']],where:{parentId:{
    [Op.is]: null, 
  }},
  include: [{ model: mainCatagorie ,  as:"parent"}],

 
}).then((resualt) => {
    if (resualt) {

      return res.json({ data: resualt });
    } else {
      res.send({ messages: 'no data at all' });
    }
  });
});

router.get('/getAllSubCatagory/:id', async (req, res) => {
  const CategoryId=req.params.id
  mainCatagorie.findAll({where:{parentId:CategoryId}, order: [['updatedAt', 'DESC']], 
  
}).then((resualt) => {
    if (resualt) {
      console.log(resualt)
      return res.json({ data: resualt });
    } else {
      res.send({ messages: 'no data at all' });
    }
  });
});


//deletSubCatagoreyById

router.delete('/deletCatagoreyById/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id)
  mainCatagorie.destroy({ where: { id: id } })
    .then((resualt) => {
      res.status(200).json({ data: resualt });
    })
    .catch((err) => {
      console.log(err);
    });
    
});
router.put('/edietCatagoreyById/:id', async (req, res) => {
  const id = req.params.id;
  const data = {
    // 
    Description: req.body.Description,
    catagory_Name: req.body.catagorey_name,
  };
  console.log(data)
  
  var condition = { where: { id: id } };
  options = { multi: true };
  video_catagory
    .update(data, condition, options)
    .then((resualt) => {
      res.status(200).json({ scuses: "update correct" });
    })
    .catch((err) => {
      console.log(err);
    });
});
module.exports = router;
