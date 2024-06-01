"use strict";
/**configuring the worker */
var mediasoup = require("mediasoup");
var { config } = require("../config/config");
const { Worker, Router} = require('mediasoup/lib/types')

// mediasoup Workers.
// @type {Array<mediasoup.Worker>}
const mediasoupWorkers = [];

const createWorkers= async() =>{

    const { numWorkers } = config.mediasoup;
    // console.log('{ numWorkers } = config.mediasoup: ',numWorkers )
    for (let i = 0; i < numWorkers; i++){

        const worker = await mediasoup.createWorker({
            
            logLevel: config.mediasoup.worker.logLevel,
            logTags: config.mediasoup.worker.logTags,
            rtcMinPort: Number(config.mediasoup.worker.rtcMinPort),
            rtcMaxPort: Number(config.mediasoup.worker.rtcMaxPort),
        });
        worker.on('died',()=>{
            console.error('media soup is existing in 2 sec..: [pid: &d]',worker.pid)
            setTimeout(()=>{
                process.exit(1)
            }, 2000);
        })

        mediasoupWorkers.push(worker);
        
    }
    // console.log('[createmediasoupWorkers]: mediasoupWorkers Array length: : ', mediasoupWorkers.length)
    return mediasoupWorkers ;
}
//we need to export the function we build: createWorker
module.exports = {  createWorkers }
// console.log(`Incoming from mediasoupWorkers : ${config.mediasoup.numWorkers}`)