const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const user_address_ctrl = require('../models/usersAddress.model');
const documentModel = require('../models/documentModel');
const advertiseModel = require('../models/advertiseModel');
const imageStorage = multer.diskStorage({
  // Destination to store image
  destination: './public/image', // destination: './public/videos',
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});
const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 1000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg)$/)) {
      // upload only png and jpg format
      return cb(new Error('Please upload a Image'));
    }
    cb(undefined, true);
  },
});
router.post(
  '/createDocument',
  imageUpload.single('image'),
  async (req, res) => {
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const descrieption = req.body.discrieption;

    const documentName = req.body.documentName;
    documentModel
      .create({
        fileName: fileName,
        filePath: filePath,
        descrieption: descrieption,
        documentName: documentName,
      })
      .then((resualt) => {
        console.log(resualt);
        return res.status(400).send('document is  uploaded.');
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

router.put(
  '/udateDocument/:id',
  imageUpload.single('image'),
  async (req, res) => {
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const descrieption = req.body.descrieption;
    const documentName = req.body.documentName;
    const id = req.params.id;
    const condition = { where: { id: id } };
    options = { multi: true };
    const data = {
      fileName: fileName,
      filePath: filePath,
      descrieption: descrieption,
      documentName: documentName,
    };
    const check = documentModel
      .update(data, condition, options)
      .then((resualt) => {
        console.log(resualt);
        res.status(200).json({ sucss: true });
      })
      .catch((err) => {
        console.log(err);
      });
    if (check) {
      const userEmail = await user_address_ctrl.findAll({
        attributes: {
          exclude: ['createdAt', 'updatedAt', ''],
        },
      });
      // sent to gmail////////////
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'alemgenateferi1@gmail.com',
          pass: '0930869450',
        },
      });
      var mailOptions = {
        from: 'alemgenateferi1@gmail.com', //alemgenateferi1@gmail.com
        to: userEmail.email,
        subject: 'some updates there on ' + data.fileName,
        html:
          '<h1>Welcome</h1><p>Our company is updates the </p>' + data.fileName,
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      // console.log(resultEmail);
      res.status(200).json({
        sent: 'update information is Sent to your Gmail successfuly!',
      });
    } else {
      res.status(200).json({ errs: 'Invalid credentials!.' });
    }
  }
);
//delet document
router.delete('/deletDocumentName/:id', async (req, res) => {
  const Id = req.params.id;
  const documentPath = await documentModel.findOne({ where: { id: Id } });
  const correctPath = documentPath.filePath;
  documentModel
    .destroy({ where: { id: Id } })
    .then((resualt) => {
      res.json({
        data: resualt,
      });
    })
    .catch((err) => {
      console.log(err);
    });
  const root = path.dirname(
    'C:\\Users\\Alemgena\\Videos\\livestream\\backend\\public'
  );
  const directory = path.join(root, correctPath);
  try {
    fs.unlinkSync(directory);
    //console.log('suucccc')
  } catch (err) {
    console.error(err);
  }
});
//get the document by name
router.get('/getDocumentName/:Name', async (req, res) => {
  const documentName = req.params.Name;
  //  var documentName = '%' + name.substring(0, 4).toLowerCase() + '%';
  documentModel
    .findOne({ where: { documentName: documentName } })
    .then((resualt) => {
      res.status(200).json({ data: resualt });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post(
  '/createAdvertise',
  imageUpload.single('image'),
  async (req, res) => {
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const descrieption = req.body.descrieption;
    advertiseModel
      .create({
        fileName: fileName,
        filePath: filePath,
        descrieption: descrieption,
      })
      .then((resualt) => {
        console.log(resualt);
        res.status(200).json({ sucss: true });
      })
      .catch((err) => {
        console.log(err);
      });
  }
);
//update advertise
router.put(
  '/updateAdvertise:id',
  imageUpload.single('image'),
  async (req, res) => {
    const filePath = req.file.path;
    const fileName = req.body.filename;
    const descrieption = req.body.descrieption;
    const id = req.params.id;
    const condition = { where: { id: id } };
    const options = { multi: true };
    const data = {
      fileName: fileName,
      filePath: filePath,
      descrieption: descrieption,
    };
    advertiseModel
      .update(data, condition, options)
      .then((resualt) => {
        console.log(resualt);
        res.status(200).json({ sucss: true });
      })
      .catch((err) => {
        console.log(err);
      });
  }
);
//delet the advertize
router.delete('deletAdvertise/:id', async (req, res) => {
  const id = req.params.id;
  const advertisePath = await advertiseModel.findOne({ where: { id: id } });
  const correctPath = advertisePath.filePath;
  advertiseModel
    .destroy({ where: { id: id } })
    .then((resualt) => {
      console.log(resualt);
      res.status(200).json({ sucss: true });
    })
    .catch((err) => {
      console.log(err);
    });
  const root = path.dirname('D:\\livestream\\backend\\public');
  const directory = path.join(root, correctPath);
  try {
    fs.unlinkSync(directory);
    //console.log('suucccc')
  } catch (err) {
    console.error(err);
  }
});
//get a single advertise
router.get('getOneAdvertise/:id', async (req, res) => {
  const id = req.params.id;
  advertiseModel
    .findAll({ where: { id: id } })
    .then((resualt) => {
      res.status(200).json({ data: resualt });
    })
    .catch((err) => {
      console.log(err);
    });
});
//get all advertise
router.get('/getAllAdvertise', async (req, res) => {
  advertiseModel
    .findAll({
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },
    })
    .then((resualt) => {
      res.status(200).json({ data: resualt });
    })
    .catch((err) => {
      console.log(err);
    });
});
module.exports = router;
