"use strict";
//import npm modules
const os = require("os");
const {v4 : uuidV4} = require("uuid");
//import user defined modules
const { createliveEvent } = require('../lib/event')
const { formatMessage } = require('../util/messages')
const { createWorkers } = require('../lib/createmediasoupWorkers')
const { userJoin, getCurrentUser, userLeave, getliveUsers } = require('../util/users');
/**
 * live events and types Maps Definition
 */
const liveEventData=require('../models/liveEvent') 
const liveStreamUser=require('../models/liveStreamUsers')

let LiveEvents = new Map()     //public events map:   Key: eventId, and Value: event name
let liveEventType = new Map()  // public/private event:  key: eventId, and Value: event type
/**
 * producers and live events, and producer Track Map Definition
 */
let LiveEventProducers = new Map() //LiveEventProducers: key: eventId, and Value: producer usernamea
/**
 * producers and their transport Map Definition
 */

let liveEventProducerUsername; //global variable holds the live event producer username
let producerTransport; // global variable consists instant mediasoup transport of the producer

let videoTrackProducer //contains video tracks of the producer
let audioTrackProducer //contains audio tracks of the producer
let EventProducerArr = [] //this  holds producername, videoTrackProducer and audioTrackProducer

let LiveEventProducersTransport = new Map() //holds Key:producerUsername, and Value: their Mediasoup Transport of the consumer 
let LiveEventProducersTransportID = new Map() //holds Key: TransportId, and Value:Mediasoup Transport of their Mediasoup Transport
/**
 * consumers and live events, consumers joined event type Map Definition
*/
let consumerTransport;  //global variable holds the live event consumer Mediasoup Transport
let liveEventConsumerUsername; //global variable holds the live event consumer username
let liveEventConsumerId;  //global variable holds the live event consumer Id

let LiveEventConsumers = new Map() //holds Key: EventId, and Value: ConsumerID
let ConsumerJoinedEventType = new Map() //holds Key: EventId, and Value: ConsumerID
let LiveEventConsumersBatch = new Map() //holds Key: ConsumerID, and Value: batchCounter
/**
 * consumers and their transport Map Definition
*/
let Consumer; //contains the audio and video tracks of a consumer
let LiveEventConsumersUsername = new Map() //holds Key:ConsumerId, and Value: consumer username
let LiveEventConsumersTransport = new Map() //holds Key:ConsumerId, and Value: their Mediasoup Transport of the consumer 
let LiveEventConsumersTransportID = new Map() //holds Key: ConsumerId, and Value: TransportId of their Mediasoup Transport
let LiveEventSubscribers = new Map() //holds key: consumerId and Value: producerUsername

//global variables
let pflag;
let cflag;
let isProducerTransportClosed = false
const botName = 'ethiolive.net';
// mediasoup Workers.
// @type {Array<mediasoup.Worker>}
let mediasoupWorkers;

let initRouter //  the first Router created.
let eventProducerRouter = []
let batchFlag = false //the batchFlag used to notify wether to use the initRouter or the batchRouter

let batchNumber = os.cpus().length; //number of available batches determined by the number of cpus
let batch_workerIndex = 0 // used to index out mediasoup Workers from an array; batchNumber -1 
let batchCounter = 0; //counter used to count the number of batches
let consumerCounter = 0; //used to index the batch routers; batchNumber - 2  
let batchRouter = [] //array which holds the batch routers created.

let SocketConnUsers = [] //this array holds the socket Id, username, and their role either producer or consumer

async function init (socketServer){

    socketServer.on('connection', async (socket) => {

        console.log("connection established!")
        /**
         * disconnect 
        */
        socket.on('disconnect', () => {
            let user = SocketConnUsers.find(conn => conn.socketId === socket.id)
            if (user){
                if (user.role === 'producer'){
                    handleHaltLiveStream(user, socket, socketServer)
                    console.log('disconnected producer Info ', user);
                }
                else if (user.role === 'consumer'){
                    user.consumerId = findkeybyValue(user.username, LiveEventConsumersUsername)
                    handleUnsubscribeConsumer(user, socket, socketServer)
                    console.log('disconnected consumer Info ', user);
                }
                else{
                    console.log(' disconnected user: ', user)
                }
                
            }
            console.log('disconnected user socketId ', socket.id);      
        });
        /**
         * connect_error
        */
        socket.on('connect_error', (err) => {
            console.error('client connection error', err);
        });
        /**
         * handle consumers leaving
        */
        socket.on('consumerLeave', (data, callback)=>{
            // console.log('consumerLeave: ', data)

            let { username, consumerId } = data
            let eventId = findkeybyValue(consumerId, LiveEventConsumers)
            let eventname = LiveEvents.get(eventId)
            let user = userLeave(username)
            socketServer.to(eventId).emit('message',formatMessage(botName, `${username} has left the chat`));
            // Send users and room info
            socketServer.to(eventId)
            .emit('liveUsers', {event: eventname, 
                                users: getliveUsers(eventId)
            });
            consumerCounter--;      
        })
        /**
        * create_event
        */
        socket.on('create_event', async (data, callback)=> {
            console.log('@create Event data: ', data)
            try {
                mediasoupWorkers  = await createWorkers()  
            }
            catch (error) {       
                console.log('mediasoupWorker: ', error)
            }
            let  { username, eventname, eventId, event_type } = data
            
            liveEventType.set(eventId, event_type)

            /**
             * socket connections info
             */
            SocketConnUsers.push({socketId: socket.id, username: username, role: 'producer'})
            /**
             * create public events
            */
             liveEventProducerUsername = username //setting the producer user name to global var.
            if ( event_type !== 'Private'){
                // livEvtProducerUsername = username
                const user = userJoin(eventId, username, eventname);
                socket.join(eventId) //the event is created; it is now part of the io class
                LiveEvents.set(eventId, eventname) //store the event id and the event name on a Map
                LiveEventProducers.set(eventId, username) //store the event id and the producer username on a Map
                initRouter = await createliveEvent(mediasoupWorkers[0], username);
                eventProducerRouter.push({username: liveEventProducerUsername, initRouter: initRouter})
                // console.log('first router created: ', initRouter)
                // Welcome current user
                socket.emit('message', formatMessage(botName, 'Welcome to ethiolive.net!'));
                // Broadcast when a user connects
                socket.broadcast.to(eventId)
                 .emit('message',formatMessage(botName, `${username} has joined the chat`));
                 // Send users and room info
                socketServer.to(eventId)
                 .emit('liveUsers', {event: eventname, 
                                     users: getliveUsers(eventId)
                });
                if (initRouter){
                    console.log('init router created sucessfully! @public')
                }
                else{
                    console.log('job for creating init router failed!  @public')
                }  
            }
            /**
             * create private events
            */
            else{
                // console.log('create_event: private event Id ', id)
                const user = userJoin(eventId, username, eventname);
                socket.join(eventId) //the event is created; it is now part of the io class
                LiveEvents.set(eventId, eventname) //store the event id and the event name on a Map
                liveEventType.set(eventId, 'private_event')
                LiveEventProducers.set(eventId, username) //store the event id and the producer username on a Map
                initRouter = await createliveEvent(mediasoupWorkers[0]);
                eventProducerRouter.push({username: liveEventProducerUsername, initRouter: initRouter})
                // Welcome current user
                socket.emit('message', formatMessage(botName, 'Welcome to ethiolive.net!'));
                // Broadcast when a user connects
                socket.broadcast.to(eventId)
                .emit('message',formatMessage(botName, `${username} has joined the chat`));    
                // Send users and room info
                socketServer.to(eventId)
                .emit('liveUsers', {event: eventname, 
                                    users: getliveUsers(eventId)
                }); 
                if (initRouter){
                    console.log('init router created sucessfully!  @private')
                }
                else{
                    console.log('job for creating init router failed! @private')
                }     
            }

        })
        /**
         * join_event
         */
         socket.on('join_event', async (data, callback)=>{
            consumerCounter++;
            console.log('@join_event data: ' , data)
            let {username, consumerId, eventname, producerUsername} = data
            liveEventConsumerId = consumerId
            let eventId = findkeybyValue(producerUsername, LiveEventProducers)
            let eventType = liveEventType.get(eventId)
            LiveEventConsumers.set(eventId, consumerId)
            LiveEventConsumersUsername.set(consumerId, username)
            LiveEventConsumersBatch.set(consumerId, batchCounter)
            // console.log('joined consumer Data: ', data)
             /**
             * socket connections info
             */
              SocketConnUsers.push({socketId: socket.id, username: username, role: 'consumer'})
            /**
             * batch the consumers
            */

            if ( consumerCounter > 500){
                consumerCounter = 0
                batchFlag = true
                if ( batch_workerIndex < batchNumber){
                    batch_workerIndex++; //batchCounter starts with 1 and ends with batchNumber - 1                     
                    batchCounter = batch_workerIndex - 1
                    // console.log(`batch info: batchFlag: ${batchFlag} batch_workerIndex: ${batch_workerIndex}batchCounter: ${batchCounter}`)
                    let worker = mediasoupWorkers[batch_workerIndex]
                    let batch_router = await createBatchRouter(worker, producer, producerUsername)
                    // console.log(batch_router)
                   batchRouter.push(batch_router)
                   let index = eventProducerRouter.findIndex(producer => producer.username === producerUsername)
                   eventProducerRouter[index].batchRouter = batchRouter
                }
            }
            // console.log('batchRouterArray length: ', batchRouter.length)
            /**
             * join public events
             */
            if (eventType !== 'Private'){
                // console.log('event type: ', eventType)
                ConsumerJoinedEventType.set(consumerId, eventType)
                LiveEventSubscribers.set(consumerId, producerUsername)
                let eventId = findkeybyValue(producerUsername, LiveEventProducers)
                // console.log('join_event: event Id = ', eventId)
                const user = userJoin(eventId, username, eventname);
                // console.log('join_event user: ', user)
                socket.join(eventId)
            }
            /**
             * join private events
            */
            else{
                // consumerUsername = username
                ConsumerJoinedEventType.set(consumerId, eventType)
                // console.log('private_consumerUSername: ', consumerUsername)
                // console.log('private_producer_username: ', producerUsername)
                LiveEventSubscribers.set(consumerId, producerUsername)           
                let eventId = findkeybyValue(producerUsername, LiveEventProducers)
                // console.log('join_event: event Id = ', eventId)
                // console.log('join_event: listOfSubscribers = ', private_listOfSubscribers)
                const user = userJoin(eventId, username, eventname);               
                socket.join(eventId)
            }
            // Welcome current user
            socket.emit('message', formatMessage(botName, 'Welcome to ethiolive.net!'));
            // Broadcast when a user connects
            socket.broadcast.to(eventId)
            .emit('message',formatMessage(botName, `${username} has joined the chat`));    
            // Send users and room info
            socketServer.to(eventId)
            .emit('liveUsers', {event: eventname, 
                                users: getliveUsers(eventId)
            });      
        })
        /**
         * live chat messages
        */
       // Listen for chatMessage
        socket.on('chatMessage', data => {

            // console.log('live chat data: ', data)
            let { username, message } = data
            let chatRoom;
            if (data.eventId){
                chatRoom = data.eventId
            }
            else if (data.consumerId){
                chatRoom = findkeybyValue(data.consumerId, LiveEventConsumers)
            }
            else{
                console.log('error @ chat message')
            }
            socketServer.to(chatRoom).emit('message', formatMessage(username, message));
        });
        /**
         * end of the live chat section
        */
         
        /**
         * get LiveEvent RtpCapabilities
        */
          socket.on('getRouterRtpCapabilitiesProducer', async (data, callback) =>{
        
            await resolveAfterXSeconds(3) //wating for 3 sec... to get the router rtp capabilities            
            callback(initRouter.getRtpCapabilities())
        })
        socket.on('getRouterRtpCapabilitiesConsumer', async(data, callback) =>{
            let {username, consumerId, eventname, producerUsername} = data
            console.log('@getRouterRtpCapabilitiesConsumer data: ', data)
            let pU = LiveEventSubscribers.get(liveEventConsumerId)
            console.log('@getRouterRtpCapabilitiesConsumer liveEventConsumerId: ', liveEventConsumerId)
            if (!batchFlag){
                
                let consumerinitRouter = eventProducerRouter.find(producer => producer.username === pU).initRouter
                await resolveAfterXSeconds(3) //wating for 3 sec... to get the router rtp capabilities            
                callback(consumerinitRouter.getRtpCapabilities())
            }
            else{
                let batchNumber = LiveEventConsumersBatch.get(liveEventConsumerId)
                let batchRouter = eventProducerRouter.find(producer => producer.username === pU).batchRouter
                callback(batchRouter[batchNumber].getRtpCapabilities())
            }

        })
        /**
         * create Producer Transport
         */
        socket.on('createProducerTransport', async (data, callback) => {
            
            try {
                const { transport, params } = await initRouter.createTransport();
                producerTransport = transport;
                let producerId = producerTransport.id
                // console.log('producerTransport Id: ', { producerId })
                LiveEventProducersTransport.set(liveEventProducerUsername, producerTransport)
                LiveEventProducersTransportID.set(producerTransport.id, producerTransport)
                callback(params);
            } 
            catch (err) {
                console.error(err);
                callback({ error: err.message });
            }
        });
        /**
         * create Consumer Transport
        */
        socket.on('createConsumerTransport', async (data, callback) => {
            // console.log(`createConsumerTransport batchRouter: , ${batchRouter.length} batchFlag: ${batchFlag} batchNumber: ${batchNumber}`)
            let pU = LiveEventSubscribers.get(liveEventConsumerId)
            if (!batchFlag){
                try {
                    let consumerinitRouter = eventProducerRouter.find(producer => producer.username === pU).initRouter           
                    const { transport, params } = await consumerinitRouter.createTransport();
                    consumerTransport = transport;            
                    callback(params);
                    // console.log(`consumer Transport Id: ${consumerTransport.id}
                                // liveEventConsumerId: ${liveEventConsumerId}`)    
                    LiveEventConsumersTransport.set(liveEventConsumerId, consumerTransport)
                    LiveEventConsumersTransportID.set(liveEventConsumerId, consumerTransport.id)
                } 
                catch (err) {            
                    console.error(err);   
                    callback({ error: err.message });       
                }
            }
            /**
             * after batching initated
            */
            else{
                try {
                    let batchNumber = LiveEventConsumersBatch.get(liveEventConsumerId)
                    let batchRouter = eventProducerRouter.find(producer => producer.username === pU).batchRouter
                    const { transport, params } = await batchRouter[batchNumber].createTransport();
                    consumerTransport = transport;            
                    callback(params);
                    // console.log('consumer Transport Id: ', consumerTransport.id)    
                    LiveEventConsumersTransport.set(liveEventConsumerId, consumerTransport)        
                } 
                catch (err) {            
                    console.error(err);     
                    callback({ error: err.message });       
                }
            }  
        });
        /**
         * connect Producer Transport
        */
        socket.on('connectProducerTransport', async (data, callback) => {
            await producerTransport.connect({ dtlsParameters: data.dtlsParameters });
            callback();
        });
        /**
         * connect Consumer Transport
        */
        socket.on('connectConsumerTransport', async (data, callback) => {
            await consumerTransport.connect({ dtlsParameters: data.dtlsParameters });
            callback();
        });
        /**
         * produce
        */
        let i = 0
         socket.on('produce', async (data, callback) => {
           
            const {id , kind, rtpParameters} = data;
            // console.log("data: ", data)
            if ( kind === 'video'){
                i += 1
                if (i === 1){
                     videoTrackProducer = await producerTransport.produce({ kind, rtpParameters });  
                let eventdata = {username:liveEventProducerUsername, videoTrack: videoTrackProducer }
                EventProducerArr.push(eventdata)
                callback({ id: videoTrackProducer.id });
                }
            }
            if ( kind === 'audio'){
                audioTrackProducer = await producerTransport.produce({ kind, rtpParameters });
                let eventProducer = EventProducerArr.filter(producer  => producer.username === liveEventProducerUsername)[0]
                console.log('@produce eventProducer',eventProducer)
                eventProducer.audioTrack = audioTrackProducer
                callback({ id: audioTrackProducer.id });
            }
            console.log('@produce EventProducerArr: ', EventProducerArr)
            // inform clients about new producer
            socket.broadcast.emit('newProducer');
        });
        /**
         * consumer
        */
        socket.on('consume', async (data, callback) => { 
            // console.log('consume Data: ', data) 
            if (!batchFlag){
                let { rtpCapabilities } = data    
                      
                let producerUsername = LiveEventSubscribers.get(liveEventConsumerId)
                let eventId = findkeybyValue(producerUsername, LiveEventProducers)
                console.log(`@consume event_id : ${eventId}  producerUsername: ${producerUsername} Consumer_id: ${liveEventConsumerId}`)
                /**
                 * consume live events 
                 * 
                */ 
            //    console.log('@consume EventProducerArr ', EventProducerArr)

               let eventProducer = EventProducerArr.find(producer => producer.username === producerUsername);
            //    console.log('@consumer eventProducer ', eventProducer)
               console.log('@consume live Event Producer ', eventProducer.username)
            //    console.log('@consume videoTrackProducer.id: ', eventProducer.videoTrack.id)
            //    console.log('@consume audioTrackProducer.id: ', eventProducer.audioTrack.id)

               let consumerinitRouter = eventProducerRouter.find(producer => producer.username === producerUsername).initRouter

                let videoProducerId
                let audioProducerId

                let canConsumeVideoTrack = false
                let canConsumeAudioTrack = false

               if (eventProducer.videoTrack){
                videoProducerId = eventProducer.videoTrack.id
                canConsumeVideoTrack = consumerinitRouter.canConsume( { producerId: videoProducerId, rtpCapabilities })
               }
               if (eventProducer.audioTrack){
                audioProducerId = eventProducer.audioTrack.id
                canConsumeAudioTrack = consumerinitRouter.canConsume( { producerId: audioProducerId, rtpCapabilities })
               }
                console.log('videoProducerId', videoProducerId)
                console.log('audioProducerId', audioProducerId)
                console.log("Can Consume Video Tracks", canConsumeVideoTrack)
                console.log("Can Consume Audio Tracks", canConsumeAudioTrack)
                console.log('can consume both audio and video tracks: ', canConsumeVideoTrack && canConsumeVideoTrack)
                if (!consumerinitRouter.canConsume( { producerId: videoProducerId, rtpCapabilities }) && !consumerinitRouter.canConsume( { producerId: audioProducerId, rtpCapabilities } )) {
                    console.error('can not consume');
                    return;
                }  
                let { EventConsumerArr, EventConsumerParamsArr } = await consumerinitRouter.createConsumer(liveEventConsumerId, consumerTransport, eventProducer, canConsumeVideoTrack, canConsumeAudioTrack ,rtpCapabilities )
                Consumer  = EventConsumerArr
                // console.log('EventConsumerArr: ', EventConsumerArr)
                // console.log('EventConsumerParamsArr ', EventConsumerParamsArr)
                let consumerParams = EventConsumerParamsArr.find(consumer => consumer.consumerId === liveEventConsumerId)
                console.log('consumerParams: ', consumerParams)
                let consumerParamsJsonText  = stringfyObject(consumerParams)
                console.log('consumerParamsJsonText: ', consumerParamsJsonText)
                callback( consumerParamsJsonText );

            } //initial batch
            else{
                let { rtpCapabilities } = data             
                let producerUsername = LiveEventSubscribers.get(liveEventConsumerId)
                let eventId = findkeybyValue(producerUsername, LiveEventProducers)
                console.log(`@consume event_id : ${eventId}  producerUsername: ${producerUsername} Consumer_id: ${liveEventConsumerId}`)
                /**
                 * consume live events 
                 * 
                */ 
                let batchNumber = LiveEventConsumersBatch.get(liveEventConsumerId)
                let batchRouter = eventProducerRouter.find(producer => producer.username === producerUsername).batchRouter
               console.log('@consume EventProducerArr ', EventProducerArr)

               let eventProducer = EventProducerArr.find(producer => producer.username === producerUsername);
               
               console.log('@consumer eventProducer ', eventProducer)
               console.log('@consume live Event Producer ', eventProducer.username)
               console.log('@consume videoTrackProducer.id: ', eventProducer.videoTrack.id)
               console.log('@consume audioTrackProducer.id: ', eventProducer.audioTrack.id)

                let videoProducerId
                let audioProducerId
                let canConsumeVideoTrack = false
                let canConsumeAudioTrack = false

               if (eventProducer.videoTrack){
                videoProducerId = eventProducer.videoTrack.id
                canConsumeVideoTrack = batchRouter[batchNumber].canConsume( { producerId: videoProducerId, rtpCapabilities })
               }
               if (eventProducer.audioTrack){
                audioProducerId = eventProducer.audioTrack.id
                canConsumeAudioTrack = batchRouter[batchNumber].canConsume( { producerId: audioProducerId, rtpCapabilities })
               }
                console.log('videoProducerId', videoProducerId)
                console.log('audioProducerId', audioProducerId)
                console.log("Can Consume Video Tracks", canConsumeVideoTrack)
                console.log("Can Consume Audio Tracks", canConsumeAudioTrack)
                console.log('can consume both audio and video tracks: ', canConsumeVideoTrack && canConsumeVideoTrack)
                if (!batchRouter[batchCounter].canConsume( { producerId: videoProducerId, rtpCapabilities }) && !batchRouter[batchCounter].canConsume( { producerId: audioProducerId, rtpCapabilities } )) {
                    console.error('can not consume');
                    return;
                }  
                let { EventConsumerArr, EventConsumerParamsArr } = await batchRouter[batchNumber].createConsumer(liveEventConsumerId, consumerTransport, eventProducer, canConsumeVideoTrack, canConsumeAudioTrack ,rtpCapabilities )
                Consumer  = EventConsumerArr
                console.log('EventConsumerArr: ', EventConsumerArr)
                console.log('EventConsumerParamsArr ', EventConsumerParamsArr)
                let consumerParams = EventConsumerParamsArr.find(consumer => consumer.consumerId === liveEventConsumerId)
                console.log('consumerParams: ', consumerParams)
                let consumerParamsJsonText  = stringfyObject(consumerParams)
                callback( consumerParamsJsonText );

            } //end of batch router
        });
         /**
         * restartIce: producer
         */
          socket.on('restartProducerIce', async(data, callback)=>{
            let  { transportId } = data
            console.log('restartIce: ', data)
            let producer_transport = LiveEventProducersTransportID.get(transportId)
            pflag = producer_transport.closed //if not closed: false
           if(!pflag){
               let iceparameters = await producer_transport.restartIce()

               console.log('iceparameters: ', iceparameters)

               callback( iceparameters )
            }
            else{
                console.log('unable to restartIce: producer_transport.close: ', producer_transport.closed)
                callback()           
            }
        })
        /**
         * restartIce: consumer
         */
        socket.on('restartConsumerIce', async(data, callback)=>{
            let { consumerId } = data
            console.log('restartConsumerIce: data = ', data)
            console.log('restartConsumerIce: LiveEventConsumersTransport = ', LiveEventConsumersTransport)
            let consumer_transport = LiveEventConsumersTransport.get(consumerId)
            cflag = consumer_transport.closed //if not closed: false
            if (!cflag){
                let iceparameters = await consumer_transport.restartIce()
                console.log('iceparameters: ', iceparameters)
                callback( iceparameters )
            }
            else{
                console.log('unable to restartIce: consumer_transport.close: ', consumer_transport.closed)

                callback()
            }
        })
        /**
         * resume
         */
        socket.on('resume', async (data, callback) => {

            let consumer = Consumer.find(consumer => consumer.consumerId === liveEventConsumerId)
            
            if (consumer.videoTrack){
                await consumer.videoTrack.resume();
            }
            if (consumer.audioTrack){
                await consumer.audioTrack.resume();
            }
            
            callback();
        });
        /**
         * haltliveStream
        */
          socket.on('haltliveStream', (data, callback) => {
            let { username, eventname, eventId, event_type } = data
            console.log('haltLiveStream: ', data)
            /**
             * halt live events
            */
             if (producerTransport){
                try {
                    if (EventProducerArr){
                        console.log('EventProducerArr length: ', EventProducerArr.length)
                        // console.log('haltLiveStream: producer  ', producer)
                        producerTransport.close()
                        isProducerTransportClosed = producerTransport.closed
                        let indexEventProducerArr = EventProducerArr.findIndex(producer => producer.username === username)
                        let indexeventProducerRouter = eventProducerRouter.findIndex(producer => producer.username === username)
                        if ((indexEventProducerArr > -1) && (indexeventProducerRouter > -1)){
                            EventProducerArr.splice(indexEventProducerArr, 1)
                            eventProducerRouter.splice(indexeventProducerRouter, 1)
                        }
                        console.log('EventProducerArr length: ', EventProducerArr.length)
                        console.log('eventProducerRouter length: ', eventProducerRouter.length)
                    }                
                    socket.to(eventId).emit('liveStreamHalted', {username, eventname, eventId}) //notify consumers that the producer halts the live stream
                    socket.leave(eventId);                   
                    console.log('[socket]: leave event_name :' + LiveEvents.get(eventId) + ' isProducerTransportClosed ', isProducerTransportClosed);             
                    LiveEvents.delete(eventId)
                    LiveEventProducers.delete(eventId)
                    callback (isProducerTransportClosed)
                }
                catch(error){
                    console.log('[error]','leave event_name : ', error);
                    callback(error)
                }
        
            }             
            
            /**
             * halt non streaming events
            */
            else{
                if (EventProducerArr){
                    console.log('EventProducerArr length: ', EventProducerArr.length)
                    let indexEventProducerArr = EventProducerArr.findIndex(producer => producer.username === username)
                    let indexeventProducerRouter = eventProducerRouter.findIndex(producer => producer.username === username)
                    if ((indexEventProducerArr > -1) && (indexeventProducerRouter > -1)){
                        EventProducerArr.splice(indexEventProducerArr, 1)
                        eventProducerRouter.splice(indexeventProducerRouter, 1)
                    }
                    console.log('EventProducerArr length: ', EventProducerArr.length)
                    console.log('eventProducerRouter length: ', eventProducerRouter.length)
                }                
                socket.to(eventId).emit('liveStreamHalted', {username, eventname, eventId}) //notify consumers that the producer halts the live stream
                socket.leave(eventId);                   
                console.log('[socket]: leave event_name :' + LiveEvents.get(eventId));             
                LiveEvents.delete(eventId)
                LiveEventProducers.delete(eventId)
                // callback (isProducerTransportClosed)
            }

            const status='Not_Live'
            const options = { multi: true };//producer
            //    var condition = { where: {username : username } };
            const data1 = { status: status };
            //    liveStreamUser.update(data1, condition, options).then((resualt)=>{
            //      console.log(resualt)
            //    }).catch((err)=>{
            //      console.log(err)
            //    });
               var conditionOne = { where: {producer : username } };
               liveEventData.update(data1, conditionOne, options).then((data)=>{
                 console.log(data)
               }).catch((err)=>{
                 console.log(err)
               });
        })
        /**
        * unsubscribe
        */
        socket.on('unsubscribe', async (data, callback) => {
            let { consumerId, username, producerUsername, eventType } = data
            console.log('unsubscribe: ', data)
            console.log('unsubscribe: LiveEventConsumersTransport ', LiveEventConsumersTransport)
            /**
             * unsubscribe from public live events
             */
             if(LiveEventConsumersTransport.get(consumerId)){
        
                try {           
                let consumerId = data.consumerId           
                let livEventConsumerTransport = LiveEventConsumersTransport.get(consumerId)
                let eventId = findkeybyValue(consumerId, LiveEventConsumers)
                console.log('livEventConsumerTransport ', livEventConsumerTransport)
                livEventConsumerTransport.close()
                socket.leave(eventId);
                LiveEventSubscribers.delete(username)
                // console.log('[socket]','leave event_name: ', eventname);
                let eventname = LiveEvents.get(eventId)
                let user = userLeave(username)
                socketServer.to(eventId).emit('message',formatMessage(botName, `${data.username} has left the chat`));
                // Send users and room info
                socketServer.to(eventId)
                .emit('liveUsers', {event: eventname, 
                                    users: getliveUsers(eventId)
                });
                consumerCounter--;      
                }
                catch(error){
                    console.log('[error]','leave event_name :', error);
                    // callback(error)         
                }
            }
            else{
                let consumerId = data.consumerId 
                let eventId = findkeybyValue(consumerId, LiveEventConsumers)
                socket.leave(eventId);
                LiveEventSubscribers.delete(consumerId)
                // console.log('[socket]','leave event_name: ', eventname);
                let eventname = LiveEvents.get(eventId)
                let user = userLeave(username)
                socketServer.to(eventId).emit('message',formatMessage(botName, `${username} has left the chat`));
                // Send users and room info
                socketServer.to(eventId)
                .emit('liveUsers', {event: eventname, 
                                    users: getliveUsers(eventId)
                });
                consumerCounter--;   
            }   
                  
        })
        /**
        * set event discription
        */
        socket.on('LiveEventDiscription', async(data, callback)=>{       
            let {username, eventname, eventId, event_type, live_event_discription} = data 
            console.log('LiveEventDiscription: ', data)
            socket.to(eventId).emit('liveEventDiscription', live_event_discription)  
        })
        /**
         * fetch privateLiveEvents
        */
        socket.on('fetch_private_live_events', (data, callback) => {
            let { private_eventId }  = data
            // console.log('fetch_private_live_events::eventId: ', private_eventId )
            let privateEvent = LiveEvents.get(private_eventId) + ' produced_by '+ LiveEventProducers.get(private_eventId) + ' eventType ' + liveEventType.get(private_eventId)
            // console.log('fetch_private_live_events::privateEvent: ', private_livEvents)
            callback(privateEvent)
        })
        /**
         * fetch publicLiveEvents
        */
        socket.on('fetch_live_events', (data, callback) => {
            let eventNames = [];
            try {
                if ( LiveEvents.size === 0){
                    callback(0)
                }
                else{
                    for (let event of LiveEvents){
                        eventNames.push(event[1] + ' produced_by ' + LiveEventProducers.get(event[0]))
                    }
                    // console.log('fetch_live_events :  ', eventNames)
                    callback(eventNames)
                }
            }
            catch (error){   
                console.log('error : ', error)
            }         
        })
    })
}

/**
 * user defined functions
*/
async function createBatchRouter(worker, EventProducerArr, producerUsername){
    let router = await createliveEvent(worker);
    let videoTrackProducerId = EventProducerArr.find(producer => producer.username === producerUsername).videoTrack.id
    let audioTrackProducerId = EventProducerArr.find(producer => producer.username === producerUsername).audioTrack.id
    router.pipeToRouter({videoTrackProducerId, audioTrackProducerId, producerUsername})   
    return router
}
function findkeybyValue(value, targetMap){
    let key;
    for (let event of targetMap){
        if (event[1] === value){
            key = event[0]
            break
        }
    }
    return key;
}

function stringfyObject( obj ){
    let jsonText = JSON.stringify(obj);
	return jsonText;
}
//wait for some seconds
function resolveAfterXSeconds(x) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(x);
        }, x * 10**3); 
    });
}
//handleSocketDisconnection
function handleHaltLiveStream(data, socket){
    let { socketId, username, role } = data
    console.log('handleHaltLiveStream: ', data)
    /**
     * halt public live events
    */
   let eventId = findkeybyValue(username, LiveEventProducers)
   let eventname =  LiveEvents.get(eventId)

    console.log(`handleHaltLiveStream { username: ${username}, eventname: ${eventname}, socketId: ${socketId}, role: ${role} }`)
    // findkeybyValue(livEvtProducerUsername, livEventProducers)
    // console.log('LiveEventProducersTransport:', LiveEventProducersTransport)              
    let producerTransport =  LiveEventProducersTransport.get(username)
    console.log('producerTransportId: ', producerTransport)
    if (producerTransport){
        try {
            if (EventProducerArr){
                console.log('EventProducerArr length: ', EventProducerArr.length)
                // console.log('haltLiveStream: producer  ', producer)
                producerTransport.close()
                isProducerTransportClosed = producerTransport.closed
                let indexEventProducerArr = EventProducerArr.findIndex(producer => producer.username === username)
                let indexeventProducerRouter = eventProducerRouter.findIndex(producer => producer.username === username)
                if ((indexEventProducerArr > -1) && (indexeventProducerRouter > -1)){
                    EventProducerArr.splice(indexEventProducerArr, 1)
                    eventProducerRouter.splice(indexeventProducerRouter, 1)
                }
                console.log('EventProducerArr length: ', EventProducerArr.length)
                console.log('eventProducerRouter length: ', eventProducerRouter.length)
            }                
            socket.to(eventId).emit('liveStreamHalted', {username, eventname, eventId}) //notify consumers that the producer halts the live stream
            socket.leave(eventId);                   
            console.log('[socket]: leave event_name :' + LiveEvents.get(eventId) + ' isProducerTransportClosed ', isProducerTransportClosed);             
            LiveEvents.delete(eventId)
            LiveEventProducers.delete(eventId)
            // callback (isProducerTransportClosed)
        }
        catch(error){
            console.log('[error]','leave event_name : ', error);
            // callback(error)
        }

    }             
    
    /**
     * halt non streaming events
    */
    else{
        if (EventProducerArr){
            console.log('EventProducerArr length: ', EventProducerArr.length)
            let indexEventProducerArr = EventProducerArr.findIndex(producer => producer.username === username)
            let indexeventProducerRouter = eventProducerRouter.findIndex(producer => producer.username === username)
            if ((indexEventProducerArr > -1) && (indexeventProducerRouter > -1)){
                EventProducerArr.splice(indexEventProducerArr, 1)
                eventProducerRouter.splice(indexeventProducerRouter, 1)
            }
            console.log('EventProducerArr length: ', EventProducerArr.length)
            console.log('eventProducerRouter length: ', eventProducerRouter.length)
        }                
        socket.to(eventId).emit('liveStreamHalted', {username, eventname, eventId}) //notify consumers that the producer halts the live stream
        socket.leave(eventId);                   
        console.log('[socket]: leave event_name :' + LiveEvents.get(eventId));             
        LiveEvents.delete(eventId)
        LiveEventProducers.delete(eventId)
        // callback (isProducerTransportClosed)
    }
    const status='Not_Live'
    const options = { multi: true };//producer
       var condition = { where: {username : username } };
       const data1 = { status: status };
       liveStreamUser.update(data1, condition, options).then((resualt)=>{
         console.log(resualt)
       }).catch((err)=>{
         console.log(err)
       });
       var conditionOne = { where: {producer : username } };
       liveEventData.update(data1, conditionOne, options).then((data)=>{
         console.log(data)
       }).catch((err)=>{
         console.log(err)
       });

}
function handleUnsubscribeConsumer(data, socket, socketServer){
    let { socketId, username, role, consumerId } =  data
    console.log('handleUnsubscribeConsumer: ', data)
    console.log(`socketId:${socketId}, username:${username}, role:${role}, consumerId:${consumerId}`)
    /**
     * unsubscribe from public live events
    */
    if(LiveEventConsumersTransport.get(consumerId)){
        
        try {           
        let consumerId = data.consumerId           
        let livEventConsumerTransport = LiveEventConsumersTransport.get(consumerId)
        let eventId = findkeybyValue(consumerId, LiveEventConsumers)
        console.log('livEventConsumerTransport ', livEventConsumerTransport)
        livEventConsumerTransport.close()
        socket.leave(eventId);
        LiveEventSubscribers.delete(username)
        // console.log('[socket]','leave event_name: ', eventname);
        let eventname = LiveEvents.get(eventId)
        let user = userLeave(username)
        socketServer.to(eventId).emit('message',formatMessage(botName, `${data.username} has left the chat`));
        // Send users and room info
        socketServer.to(eventId)
        .emit('liveUsers', {event: eventname, 
                            users: getliveUsers(eventId)
        });
        consumerCounter--;      
        }
        catch(error){
            console.log('[error]','leave event_name :', error);
            // callback(error)         
        }
    }
    else{
        let consumerId = data.consumerId 
        let eventId = findkeybyValue(consumerId, LiveEventConsumers)
        socket.leave(eventId);
        LiveEventSubscribers.delete(consumerId)
        // console.log('[socket]','leave event_name: ', eventname);
        let eventname = LiveEvents.get(eventId)
        let user = userLeave(username)
        socketServer.to(eventId).emit('message',formatMessage(botName, `${username} has left the chat`));
        // Send users and room info
        socketServer.to(eventId)
        .emit('liveUsers', {event: eventname, 
                            users: getliveUsers(eventId)
        });
        consumerCounter--;   
    }       
}

/**
 * initiate socket server
*/
 module.exports = { init }
