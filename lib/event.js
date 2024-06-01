const EventEmitter = require('events')
const { config } = require('../config/config')
const { create_transport } = require('./createTransport')

/**  
* Make new room instance  
*/

let mediasoupRouters = []
let mediasoupAudioObservers = []

// Index of next mediasoup Worker to use.
// @type {Number}
let nextMediasoupWorkerIdx = 0;

let initRouter = new Map()

async function createliveEvent(worker, username) {
    

    const mediaCodecs = config.mediasoup.router.mediaCodecs;
   
    try {

        let router = await worker.createRouter({ mediaCodecs })

        initRouter.set(username, router)

        // create an AudioLevelObserver object
    
        let audioLevelObserver = await router.createAudioLevelObserver({

                maxEntries : 1,
                threshold  : -80,
                interval   : 800

            });

        mediasoupRouters.push(router)

        mediasoupAudioObservers.push(audioLevelObserver)


        return new liveStream(worker, router, audioLevelObserver);

    }

    catch (error) {

        console.error(error)

    }
   
};

class liveStream extends EventEmitter {

    /**
     * Peers map
     **/
    peers = {};
    /**
    * Active speaker info
    **/
    activeSpeaker = { producerId: null, volume: null, peerId: null };
    /**
    * Transports map
    **/
    transports = {};
    /**
    * List of producers
    **/
    videoProducer;
    audioProducer;
    /**
    * List of consumers
    * */
    consumers = [];
    /**
    * Worker
    * */
    worker;
    /**
    * Router
    * */
    router;
    /**
    * AudioLevelObserver
    * */
    audioLevelObserver

    /** class constructor
     * 
     * @param {*} worker 
     * @param {*} router 
     * @param {*} audioLevelObserver 
     * 
     */
 
    constructor (worker, router, audioLevelObserver){
       
        super()

        this.worker = worker
        
        this.router = router
        
        this.audioLevelObserver = audioLevelObserver
    
        // handle audio level volume change

        audioLevelObserver.on("volumes", (volumes) => {

            const { producer, volume } = volumes[0];
    
            console.log("audio-level volumes event", producer.appData.peerId, volume);

            // change active speaker
        
            this.activeSpeaker.producerId = producer.id;
    
            this.activeSpeaker.volume = volume;
        
            this.activeSpeaker.peerId = producer.appData.peerId;
    
        });

        audioLevelObserver.on("silence", () => {
    
            console.log("audio-level silence event");

            this.activeSpeaker.producerId = null;

            this.activeSpeaker.volume = null;
        
            this.activeSpeaker.peerId = null;
        
        
        });
   
    }
    /**
     * 
     * @param {*} peerId
     * 
     */
    joinPeer(peerId) {
    
        console.log(`peer joined ${peerId}`);

        this.peers[peerId] = {
      
            joinTime: new Date(),
      
            lastSeenTime: new Date(),
      
            media: {},
      
            consumerLayers: {},
      
            stats: {},
    
        };
  
    }
    /**
     * 
     * @param {*} transport 
     */
    addTransport(transport) {
        
        this.transports[transport.id] = transport;
      
    }
    /** 
    *   
    * @returns rtpCapabilities
    */
    getRtpCapabilities() {
        
        return this.router.rtpCapabilities;

    }
    pipeToRouter({videoTrackProducerId, audioTrackProducerId, producerUsername}){

        initRouter.get(producerUsername).pipeToRouter({producerId: videoTrackProducerId, router: this.router})
        initRouter.get(producerUsername).pipeToRouter({producerId: audioTrackProducerId, router: this.router})
    }
    /**
     * 
     * @param {*} peerId 
     * @param {*} direction 
     * @returns 
     */
    async createTransport(peerId, direction) {

        try{

            const { transport, params} = await create_transport(this.router, peerId, direction)
        
            let { id } = params //fetch transport id 
            // save transport
            this.transports[id] = transport;
    
            return { transport, params };
        }
        catch (error){

            console.error( error )
        }
       
    }
    /**
     * 
     * @param {*} producerId 
     * @param {*} rtpCapabilities 
     * @returns 
     */ 
    canConsume({producerId, rtpCapabilities}) {

        return this.router.canConsume({ producerId, rtpCapabilities });
      
    }
    /**
     * 
     * @param {*} transportId 
     * @returns 
     */
    getTransport(transportId) {
        
        return this.transports[transportId];
      
    }
    /**
     * 
     * @param {*} peerId 
     * @param {*} direction 
     * @returns 
     */
    getTransportByPeerId(peerId, direction) {
  
        return Object.values(this.transports).find(
          (transport) =>
            transport.appData.peerId === peerId && transport.appData.clientDirection === direction
        );
    }
    /**
     * 
     * @param {*} producer 
     */
    setVideoProducer(producer) {
        
        this.videoProducer = producer;
      
    }
    /**
     * 
     * @returns 
     */
    getVideoProducer() {
        
        return this.videoProducer;
      
    }
    /**
     * 
     * @param {*} producer 
     */
    setAudioProducer(producer) {
        
        this.audioProducer = producer;
      
    }
    /**
     * 
     * @returns 
     */
    getAudioProducer() {
        
        return this.audioProducer;
      
    }
    /**
     * 
     * @param {*} producer 
     * @param {*} rtpCapabilities 
     * @returns 
     */
    async createConsumer(liveEventConsumerId, consumerTransport, eventProducer, canConsumeVideoTrack, canConsumeAudioTrack ,rtpCapabilities) {

        // console.log('createConsumer\n{consumerTransport, producer, rtpCapabilities }: \n',{consumerTransport, producer, rtpCapabilities})
        // console.log("createConsumer::producer.get('videoTrackProducer').id", producer.get('videoTrackProducer').id)
        // console.log("createConsumer::producer.get('audioTrackProducer').id", producer.get('audioTrackProducer').id)
        
        let EventConsumerArr = []
        let EventConsumerParamsArr = []

        let videoTrackConsumer
        let audioTrackConsumer

        try {
            if (canConsumeVideoTrack){
                    videoTrackConsumer = await consumerTransport.consume({
                    producerId: eventProducer.videoTrack.id,
                    rtpCapabilities,
                    paused: eventProducer.videoTrack.kind === 'video',
                });
                EventConsumerArr.push({consumerId: liveEventConsumerId, videoTrack: videoTrackConsumer})
            }

          if (canConsumeAudioTrack){
                audioTrackConsumer = await consumerTransport.consume({
                producerId: eventProducer.audioTrack.id,
                rtpCapabilities
            });
            let index = EventConsumerArr.findIndex(consumer => consumer.consumerId === liveEventConsumerId)
            EventConsumerArr[index].audioTrack = audioTrackConsumer
          }
        } 
        catch (error) {
          console.error('consume failed', error);
          return;
        }

        // if (consumer.type === 'simulcast') {
        //   await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
        // }
        /**
         * consumer map
        */
       let eventConsumer = EventConsumerArr.find(consumer => consumer.consumerId === liveEventConsumerId)
        if (canConsumeVideoTrack){
            let videoConsumerParams = {
                producerId: eventProducer.videoTrack.id,
                id: eventConsumer.videoTrack.id,
                kind: eventConsumer.videoTrack.kind,
                rtpParameters: eventConsumer.videoTrack.rtpParameters,
                type: eventConsumer.videoTrack.type,
                producerPaused: eventConsumer.videoTrack.producerPaused
            }
            EventConsumerParamsArr.push({ consumerId: liveEventConsumerId, videoParams: videoConsumerParams})
        }
        if (canConsumeAudioTrack){
            let audioConsumerParams = {
                producerId: eventConsumer.audioTrack.id,
                id: eventConsumer.audioTrack.id,
                kind:  eventConsumer.audioTrack.kind,
                rtpParameters:  eventConsumer.audioTrack.rtpParameters,
                type:  eventConsumer.audioTrack.type,
                producerPaused:  eventConsumer.audioTrack.producerPaused
            }
            let index = EventConsumerParamsArr.findIndex(consumer => consumer.consumerId === liveEventConsumerId)
            EventConsumerParamsArr[index].audioParams = audioConsumerParams
        }

        return { EventConsumerArr, EventConsumerParamsArr };
    }
}

module.exports = { createliveEvent }