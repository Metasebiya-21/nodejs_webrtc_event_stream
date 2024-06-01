"use strict";
/**
 * import npm modules
 */
const fs = require('fs')
const cors = require('cors')
const path = require('path')
const http = require('http');
const express = require('express')
const session = require("express-session");
const { Server } = require('socket.io')
const bodyParser = require('body-parser');
const passport = require('passport');
const ip = require("ip");
const {v4 : uuidV4} = require("uuid");
const { pick } = require("ramda");
const crypto = require("crypto");
require('dotenv').config()

/**
 * import user defined moudles
 */

 const { init } = require('../init/init')
 const sequelize = require('../util/database')
 const { config } = require('../config/config')

const cartController = require('../controller/cartcController');

const errorHandler = require('../helper/errorHndler');

const userController = require('../controller/userController');

const login = require('../controller/loginController');

const sync = require('../models/usr_models');

const admin = require('../controller/adminController');

const videoController = require('../controller/videoController');

const recoverPassword = require('../controller/recoverPassword');

const catagoryController = require('../controller/catagoryController');

const documentController = require('../controller/documentControle');

const videoStream = require('../controller/videoLivestream');

// const { createliveEvent, liveStream } = require('../lib/event')
let popFields;

run().catch((e) => console.error(e));


function convertToSignatureDate(d) {
  const [ isoDate ] = d.toISOString().split(".");

  return `${isoDate}Z`;
}

function sign(fields) {
  const hash = crypto.createHmac("sha256", p_config.cybersource.SECRET_KEY);
  const encodedFields = Object.keys(fields).sort().map(k => `${k}=${fields[ k ]}`).join(",");

  return hash.update(encodedFields).digest("base64");
}
const UNSIGNED_FIELD_NAMES = [  ];
const SIGNED_FIELD_NAMES = [
  "access_key",
  "amount",
  "currency",
  "locale",
  "payment_method",
  "profile_id",
  "reference_number",
  "signed_date_time",
  "signed_field_names",
  "transaction_type",
  "transaction_uuid",
  "unsigned_field_names"
];

async function run() {

  sequelize
  .sync()
  .then((result) => {
    // console.log('sequelize result: \n', result)
  })
  .catch((err) => {
    console.log(err);
  });

  let app = express();
  app.use(express.json());

  var corsOptions = {
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200
    
  }
  app.use(cors())
  //app.options('*', cors());  // enable pre-flight
  app.use(session({secret: "mysecrettoken"}));
  app.use(bodyParser.urlencoded({ extended: true }))

  // app.use(function(req, res, next) {

  //   res.header("Access-Control-Allow-Origin","*");
  //   res.header("Access-Control-Allow-Methods"," GET, POST, PUT, DELETE");
  //   res.header("Access-Control-Allow-Headers", "Authorization");
  //   next();
  // });

  app.use('/api/document', documentController);
  //app.use('/api/cart', cartController);

  var publicDir = require('path').join(__dirname, '/public');

  app.use(express.static(publicDir));

  app.use('/images', express.static(__dirname + '/images'));

  app.use(express.json({ extended: true }));

  app.use('/api/login', login);
  
  app.use('/api/admin', admin);
  
  app.use('/api/recoverPassword', recoverPassword);
  
  app.use('/api/catagorey', catagoryController);
  
  app.use('/api/user', userController);

  app.use('/api/video', videoController);

  app.use('/images', express.static(__dirname + '/images'));
  app.use('/videos', express.static(__dirname + '/video'));
  

  //serving static folder
  app.use(express.static('public'));

  app.use(passport.initialize());
  app.use(passport.session());
  //for google
  var loginwithGoogleController = require('../controller/googleLogin');
  app.use('/api/', loginwithGoogleController);
  //for facebook
  var facebookLoginController = require('../controller/facebookLoginController');
  app.use('/api/', facebookLoginController);
  //for linkedin
  var linkedinLoginController = require('../controller/linkdinLoginController');
  app.use('/api/', linkedinLoginController);

  app.get('/api', (req, res) => {
    res.sendFile(path.join(__dirname,'../public/index.html'));
  });

  app.get('/api/join_live_streams', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/join_live_streams.html'));
  });

  app.get('/api/create_live_streams', (req, res) => {
    res.sendFile(path.join(__dirname,`../public/create_live_streams.html`));
  });

  app.get('/api/produce_live_events', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/produce_live_events.html'));
  })

  app.get('/api/consume_live_events', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/consume_live_events.html'));
  })

  app.use((error, req, res, next) => {
    if (error) {
      console.warn('Express app error,', error);

      error.status = error.status || (error.name === 'TypeError' ? 400 : 500);

      res.statusMessage = error.message;
      res.status(error.status).send(String(error));
    } else {
      next();
    }
  });

  const server = http.createServer( app )

  const socketServer = new Server(server);
  /*, {
    
    cors: { 
      origin: "*",
      methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
      credentials: false
    }
      
  }*/

  init(socketServer);

  server.listen(config.listenPort, () => {
      console.log(`Listening on http://${config.listenIp}:${config.listenPort}`);
  });
}