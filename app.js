const fs = require('fs')
const cors = require('cors')
const path = require('path')
const express = require('express');
const http = require('http')
// const https = require('https');
const spyd = require('spdy')

let app;
let webServer;



const { Server } = require("socket.io")

const socketIoConnection = require('./lib/Server.js');

const meta_config = require('./config/meta_config');
const mediasoup_config = require('./config/config');
//
const { listenIp, listenPort } = meta_config;

(async () => {
  try {
    await run_express_app();
    await runWebServer();
    // await runSocketServer();
    // await runMediasoupWorker();
  } catch (err) {
    console.error(err);
  }
})();

async function run_express_app() {
  app = express();
  app.use(express.json());

  app.use(cors());


  //serving static folder
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public/index.html'));
  });

  app.get('/join_live_streams', (req, res) => {
    res.sendFile(path.join(__dirname,'public/join_live_streams.html'));
  });

  app.get('/create_live_streams', (req, res) => {
    res.sendFile(path.join(__dirname,'public/create_live_streams.html'));
  });

  app.use((error, req, res, next) => {
    if (error) {
      console.warn('Express app error,', error.message);

      error.status = error.status || (error.name === 'TypeError' ? 400 : 500);

      res.statusMessage = error.message;
      res.status(error.status).send(String(error));
    } else {
      next();
    }
  });
}

async function runWebServer() {
  // const { cert, key } = meta_config;
  // if (!fs.existsSync(key) || !fs.existsSync(cert)) {
  //   console.error('SSL files are not found. check your config.js file');
  //   process.exit(0);
  // }
  // const options = {
  //   cert: fs.readFileSync(cert),
  //   key: fs.readFileSync(key),
  // };
  webServer = http.createServer( app);//options,
  const io = new Server(webServer, {
    cors: { 
          origin: ['*'],

          handlePreflightRequest: (req, res) => {
            res.writeHead(200, {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST",
              "Access-Control-Allow-Headers": "my-custom-header",
              "Access-Control-Allow-Credentials": true
            });
            res.end();
          }
        }
      })
  const socket_server = socketIoConnection.runSocketServer(new Server(webServer));
  webServer.on('error', (err) => {
    console.error('starting web server failed:', err.message);
  });

  await new Promise((resolve) => {
    const { listenIp, listenPort } = meta_config;
    webServer.listen(listenPort, listenIp, () => {
      const listenIps = mediasoup_config.config.mediasoup.webRtcTransport.listenIps[0];
      const ip = listenIps.announcedIp || listenIps.ip;
      console.log('server is running');
      console.log(`open http://${ip}:${listenPort} in your web browser`);
      resolve();
    });
  });
}
