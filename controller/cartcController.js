const express = require('express');
const router = express.Router();
const videoCart = require('../models/cartModel');
const user_password = require('../models/usersPassword.model');
//creat cart
router.post('/creatCart', async (req, res) => {
  console.log(req.body.user_id);
  /*
    for (let i = 0; i < req.body.length; i++) {
    const  user_id= JSON.stringify(req.body[i].user_id);
    const quantity=JSON.stringify(req.body[i]).quantity;
    const video_id=JSON.stringify(req.body[i]).vide_id;
//delet the prevows cart
const resualt=await videoCart.findOne({where:{userId:user_id,video_id:video_id}})
if(resualt){
  videoCart.destroy({where:{userId:user_id,video_id:video_id}})
}
else{
  videoCart.create({
    userId:user_id,
    video_id:video-id,
    quantity:quantity
  }).then((resualt)=>{
    console.log(resualt);
    res.status(200).json({status:true})
  }).catch((err)=>{
console.log(err)
  })

}
    }*/
});
//get cart user id
router.get('/getCart/:userID', (req, res) => {
  const user_id = req.params.userID;
  videoCart
    .findAll({ where: { userId: user_id } })
    .then((resualt) => {
      if (resualt) {
        res.status(200).json({ data: resualt });
      } else {
        res.status(200).json({ message: 'no cart' });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
//ediet cart
router.put('/edietCart/:id', (req, res) => {
  const id = req.params.id;
  const quantity = req.body.quantity;
  const user_id = req.body.user_id;
  const video_id = req.body.vide_id;
  const data = {
    quantity: quantity,
    user_id: user_id,
    video_id: video_id,
  };
  var condition = { where: { id: id } };
  options = { multi: true };
  videoCart.update(data, condition, options).then((resualt) => {
    if (resualt) {
      res.status(200).json({ upadate: true });
    } else {
      res.status(200).json({ upadate: false });
    }
  });
});
module.exports = router;
