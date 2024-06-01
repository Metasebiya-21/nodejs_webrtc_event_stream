"use strict";
//import npm modules
const { pick } = require('lodash')
const {v4 : uuidV4} = require("uuid");
const { DtlsParameters }  = require('mediasoup/lib/WebRtcTransport')
const { MediaKind, RtpParameters } = require('mediasoup/lib/RtpParameters')
const os = require("os");
//import user defined modules
const { createliveEvent } = require('../lib/event')
const { createWorkers } = require('../lib/createmediasoupWorkers')
const { formatMessage } = require('../utils/messages')
const { userJoin, getCurrentUser, userLeave, getliveUsers } = require('../utils/users');

// Map of Event instances and broadcasters indexed by event Id.
let livEvents = new Map() //rooms: eventId, event name
let private_livEvents = new Map() //rooms: eventId, event name
let eventType_map = new Map()

let livEventBroadcasters = new Map() // room owners: eventId, producer username
let private_livEventBroadcasters = new Map() //room owners: eventId, producer username

// let eventProducerTracks = new Map() //holds the event id the video and audio tracks

let livEventConsumers = new Map() //holds user id and username of the consumer each consumer has unique id
let private_livEventConumers = new Map()

let ConsumerJoinedEventType = new Map() //consumer Id and event type

let livEventConsumersTransport = new Map() //holds user id and their Mediasoup Transport of the consumer each consumer has unique id
let private_livEventConumersTransport = new Map()

let eventID_consumerId_map = new Map()
let livEventConsumersTransport_Id = new Map()

let livEventProducers = new Map()
let private_livEventProducers = new Map()

let livEventTransports = new Map()
let private_livEventTransports = new Map()

let listOfSubscribers = new Map()
let private_listOfSubscribers = new Map()

let EventProducer = new Map() //this map holds eventId as key and producer Map as a value
let producer = new Map(); //contains audio and video tracks of the producer
let Consumer = new Map(); //contains the audio and video tracks of a proucer
//global variables
let producerTransport;

let consumerTransport;

let isProducerTransportClosed = false

let pflag;
let cflag;

let livEvtProducerUsername;

let consumerUsername;

const botName = 'ethiolive.net';
// mediasoup Workers.
// @type {Array<mediasoup.Worker>}
let mediasoupWorkers;

let batchFlag = false

let batchMap = new Map() // consists batch number and the associated router

let batch_workerIndex = 0
let batchCounter = 0;

let consumerCounter;

let batchNumber = os.cpus().length;

let initRouter
let batchRouter = [];
let prEventId

async function init (socketServer){
    
    let liveEvent;

    socketServer.on('connection', async (socket) => {

        // console.log("connection")
   
        /**
         * fetch_private_live_events
        */
    
        socket.on('fetch_private_live_events', (data, callback) => {

            let { private_eventId }  = data

            // console.log('fetch_private_live_events::eventId: ', private_eventId )

            let privateEvent = private_livEvents.get(private_eventId) + ' produced_by '+ private_livEventBroadcasters.get(private_eventId) + ' eventType private_event'

            // console.log('fetch_private_live_events::privateEvent: ', private_livEvents)

            callback(privateEvent)

        })
        /**
         * fetch_live_events
         */
        socket.on('fetch_live_events', (data, callback) => {
            let eventNames = [];

            try {
   
                if ( livEvents.size === 0){
  
                    callback(0)

                }

                else{

                    for (let event of livEvents){
 
                        eventNames.push(event[1] + ' produced_by ' + livEventBroadcasters.get(event[0]))

                    }
  
                    // console.log('fetch_live_events :  ', eventNames)

                    callback(eventNames)

                }

            }

            catch (error){
   
                console.log('error : ', error)
            }
          
        })
        /**
         * set event discription
         */
        socket.on('LiveEventDiscription', async(data, callback)=>{
            let {username, eventname, eventId, event_type, live_event_discription} = data

            socket.to(eventId).emit('liveEventDiscription', live_event_discription)
        })
        /**
         * create_event
         */
        
        socket.on('create_event', async (data, callback)=> {

            try {

                mediasoupWorkers   = await createWorkers()

                // console.log('[init] create Event:number of mediasoupWorkers ', mediasoupWorkers.length)
                // console.log('[init] create Event: mediasoupWorkers \n', mediasoupWorkers)
         
            }
        
            catch (error) {
        
                console.error(error)
        
            }

            console.log('create_event: producer data \n', data)

            let  { username, eventname, eventId, event_type } = data

            eventType_map.set(eventId, event_type)

            // console.log(' is Event Type Private: ',event_type === 'private_event')

            if ( event_type !== 'private_event'){

                livEvtProducerUsername = username

                // console.log('create_event: public event Id ', id)

                const user = userJoin(eventId, username, eventname);
    
                socket.join(eventId) //the event is created; it is now part of the io class
    
                livEvents.set(eventId, eventname) //store the event id and the event name on a Map
    
                livEventBroadcasters.set(eventId, username) //store the event id and the producer username on a Map
    
                liveEvent = eventId

                // console.log('mediasoupWorkers[0] ',mediasoupWorkers[0])
    
                initRouter = await createliveEvent(mediasoupWorkers[0], username);

                // console.log('first router created: ', initRouter)

                // batchMap.set(0, initRouter)

                // Welcome current user
                socket.emit('message', formatMessage(botName, 'Welcome to ethiolive.net!'));

                // Broadcast when a user connects
                socket.broadcast
                .to(eventId)
                .emit('message',formatMessage(botName, `${username} has joined the chat`));

                 // Send users and room info
                 socketServer.to(user.room).emit('liveUsers', {
                    room: eventId,
                    users: getliveUsers(eventId)
                });

            }

            else{
                
                // console.log('create_event: private event Id ', id)
                const user = userJoin(eventId, username, eventname);
    
                socket.join(eventId) //the event is created; it is now part of the io class
    
                private_livEvents.set(eventId, eventname) //store the event id and the event name on a Map
    
                eventType_map.set(eventId, 'private_event')
                private_livEventBroadcasters.set(eventId, username) //store the event id and the producer username on a Map
    
                liveEvent = eventId
    
                // console.log('mediasoupWorkers[0] ',mediasoupWorkers[0])
    
                initRouter = await createliveEvent(mediasoupWorkers[0]);

                // console.log('live Event Object: ', liveEvent)

                // Welcome current user
                socket.emit('message', formatMessage(botName, 'Welcome to ethiolive.net!'));

                // Broadcast when a user connects
                socket.broadcast
                .to(eventId)
                .emit('message',formatMessage(botName, `${username} has joined the chat`));
                
            }

        })
        /**
         * join_event
         */
         socket.on('join_event', async (data, callback)=>{

            consumerCounter ++;

            console.log('consumerCounter: ' , consumerCounter)

            let {username, consumerId, eventname, producerUsername} = data

            livEventConsumers.set(consumerId, username)

            console.log('livEventConsumers: ', livEventConsumers)

            let eventId = findkeybyValue(producerUsername, livEventBroadcasters)
            let eventType = eventType_map.get(eventId)

            eventID_consumerId_map.set(eventId, consumerId)

            console.log('join_event: event type ', {eventId, eventType})
            // console.log('join_event: consumer data ', data)

            if ( consumerCounter > 500){

                consumerCounter = 0

                batchFlag = true


                if ( batch_workerIndex < batchNumber){

                    batch_workerIndex++; //batchCounter starts with 0 and ends with batchNumber - 1
                        
                    batchCounter = batch_workerIndex - 1

                    console.log(`batch info:\n
                                    batchFlag: ${batchFlag}
                                    batch_workerIndex: ${batch_workerIndex}
                                    batchCounter: ${batchCounter}
                                `)

                    let worker = mediasoupWorkers[batch_workerIndex]

                    let batch_router = await createBatchRouter(worker, producer, producerUsername)

                    console.log(batch_router)

                   batchRouter.push(batch_router)
                }
            }

            console.log('batchRouterArray: ', batchRouter[batchCounter])

            if (eventType !== 'private_event'){
                console.log('event type: ', eventType)
                consumerUsername = username

                ConsumerJoinedEventType.set(consumerId, eventType)

                listOfSubscribers.set(consumerUsername, producerUsername)

                let eventId = findkeybyValue(producerUsername, livEventBroadcasters)

                console.log('join_event: event Id = ', eventId)
              
                const user = userJoin(eventId, username, eventname);

                console.log('join_event user: ', user)
                
                socket.join(eventId)
            }

            else{

                consumerUsername = username

                ConsumerJoinedEventType.set(consumerId, eventType)

                // console.log('private_consumerUSername: ', consumerUsername)

                // console.log('private_producer_username: ', producerUsername)

                private_listOfSubscribers.set(consumerUsername, producerUsername)

                
                let eventId = findkeybyValue(producerUsername, private_livEventBroadcasters)

                // console.log('join_event: event Id = ', eventId)
                // console.log('join_event: listOfSubscribers = ', private_listOfSubscribers)
                const user = userJoin(id, username, eventname);
                
                socket.join(eventId)

            }
            

        })
        /**
         *  // inform the client about existence of producer
        */
        if (producer) {

            socket.emit('newProducer');

        }
        /**
         * disconnect
         */
        socket.on('disconnect', (data, callback) => {

            let { username, eventId } = data

            if (username) {
              io.to(eventId).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`));
            }

            console.log('client disconnected');

        });
        /**
         * connect_error
         */
        socket.on('connect_error', (err) => {

            console.error('client connection error', err);

        });
        /**
         * liveProducers
        */
       socket.on('liveProducers', async (data, callback)=>{

        let { eventId } = data

        console.log('liveProducers data: ', data )

        console.log('livEvents: ', livEvents)

        let eventname = livEvents.get(eventId)

        console.log(`eventId: ${eventId} eventname: ${eventname}`)

        let liveUsers = getliveUsers(eventId)
        console.log('liveUsers: ', liveUsers)
        
        let message = {
            eventname: eventname,
            liveUsers: liveUsers
        }

        let msg_str = JSON.stringify(message)

        console.log('liveProducers msg_str: ', msg_str)

        callback( msg_str )

       })
       /**
        * liveConsumers
        */
       socket.on('liveConsumers', async (data, callback)=>{
        console.log('liveConsumers data: ', data )
        let { producerUsername } = data
        
        let eventId = findkeybyValue(producerUsername, livEventBroadcasters)

        let eventname = livEvents.get(eventId)

        console.log(`eventId: ${eventId} eventname: ${eventname}`)

        let liveUsers = getliveUsers(eventId)
        console.log('liveConsumers ', liveUsers)
        
        let message = {
            eventname: eventname,
            liveUsers: liveUsers
        }

        let msg_str = JSON.stringify(message)

        console.log('msg_str: ', msg_str)

        callback( msg_str)

       })

       // Listen for ProducerchatMessage
        socket.on('ProducerchatMessage', (data, callback) => {

            console.log('chatMessage: ', data)

            let { eventId, username, message, producerUsername} = data

            console.log('formatMessage(username, message): ', formatMessage(username, message))

            socket.to(eventId).emit('message', formatMessage(username, message));
        });
         // Listen for ConsumerchatMessage
         socket.on('ConsumerchatMessage', (data, callback) => {

            console.log('chatMessage: ', data)

            let { username, message, producerUsername} = data

            let eventId = findkeybyValue(producerUsername, livEventBroadcasters)

            let eventname = livEvents.get(eventId)

            socket.to(eventId).emit('message', formatMessage(username, message));

            console.log('formatMessage(username, message): ', formatMessage(username, message))

        });
        /**
         * 
         */

        /**
         * haltliveStream
        */
        socket.on('haltliveStream', (data, callback) => {

            let { username, eventname, eventId, event_type } = data

            console.log('haltLiveStream: ', data)

            if ( event_type !== 'private_event'){

                console.log(`haltliveStream { username: ${username}, eventname: ${eventname}, id: ${eventId}, event_type: ${event_type} }`)

                // findkeybyValue(livEvtProducerUsername, livEventProducers)

                console.log('livEventProducers:', livEventProducers)
                
                let producerTransportId = findkeybyValue(username, livEventProducers)

                console.log('producerTransportId: ', producerTransportId)

                let livEvtProducerTransport = livEventTransports.get(producerTransportId)

                console.log('livEvtProducerTransport', livEvtProducerTransport)
                
                try {

                    if (producer){

                        console.log('haltLiveStream: producer ', producer)

                        livEvtProducerTransport.close()

                        isProducerTransportClosed = livEvtProducerTransport.closed
                        // console.log('live Event Producer Transport: ', livEvtProducerTransport)

                    }
                
                    socket.to(eventId).emit('liveStreamHalted', {username, eventname, eventId}) //notify consumers that the producer halts the live stream
                    
                    socket.leave(eventId);
                    
                    console.log('[socket]: leave event_name :' + livEvents.get(eventId) + ' isProducerTransportClosed ', isProducerTransportClosed);
                    
                    livEvents.delete(eventId)
                    
                    livEventBroadcasters.delete(eventId)
                    
                    callback (isProducerTransportClosed)
                }

                catch(error){

                    console.log('[error]','leave event_name : ', error);

                    callback(error)

                }
            }

            else{

                console.log('producerUsername: ', username)
                let producerTransportId = findkeybyValue(username, private_livEventProducers)

                let livEvtProducerTransport = private_livEventTransports.get(producerTransportId)
                
                try {

                    if ( producer ){

                        livEvtProducerTransport.close()

                        isProducerTransportClosed = livEvtProducerTransport.closed
                        // console.log('live Event Producer Transport: ', livEvtProducerTransport)


                    }
                
                    socket.to(eventId).emit('liveStreamHalted', {username, eventname, eventId}) //notify consumers that the producer halts the live stream
                    
                    socket.leave(eventId);
                    
                    // console.log('[socket]: leave event_name :' + private_livEvents.get(id) + ' isProducerTransportClosed ', isProducerTransportClosed);
                    
                    livEvents.delete(eventId)
                    
                    livEventBroadcasters.delete(eventId)
                    
                    callback (isProducerTransportClosed)
                }

                catch(error){

                    console.log('[error]','leave event_name : ', error);

                    callback(error)

                }

            }
  
        })
        /**
        * unsubscribe
        */
        socket.on('unsubscribe', async (data, callback) => {

            let { username, eventname, producerUsername, eventType } = data

            if (eventType !== 'private_event'){

                try {
 
                    
                    let consumerId = findkeybyValue(username, livEventConsumers)
    
                    let eventId =   findkeybyValue(producerUsername, livEventBroadcasters)
    
                    let livEventConsumerTransport = livEventConsumersTransport.get(consumerId)

                    console.log('livEventConsumersTransport ', livEventConsumerTransport)
                    
                    console.log('livEventConsumerTransport', livEventConsumerTransport)
    
                    livEventConsumerTransport.close()
    
                    socket.leave(eventId);
    
                    listOfSubscribers.delete(username)
                
                    // console.log('[socket]','leave event_name: ', eventname);
    
                    let unsubscribe_status = true
    
                    callback(unsubscribe_status)
    
                }
        
                catch(error){
    
                    console.log('[error]','leave event_name :', error);
        
                    callback(error)
            
                }

            }

            else{
                try {
 
                    
                    let consumerId = findkeybyValue(username, livEventConsumers)

                    let eventId =  findkeybyValue(producerUsername, private_livEventBroadcasters)
    
                    let livEventConsumerTransport = private_livEventConsumersTransport.get(consumerId)
    
                    // console.log('key: ', key)
    
                    // console.log('consumerId', consumerId)
    
                    // console.log('consumer', consumer);
    
                    // console.log('event Id: ', eventId)
    
                    livEventConsumerTransport.close()
    
                    socket.leave(eventId);
    
                    listOfSubscribers.delete(username)
                
                    // console.log('[socket]','leave event_name: ', eventname);
    
                    let unsubscribe_status = true
    
                    callback(unsubscribe_status)
    
                }
        
                catch(error){
    
                    console.log('[error]','leave event_name :', error);
        
                    callback(error)
            
                }

            }
            
        })
        /**
         * get LiveEvent RtpCapabilities
         */
        socket.on('getRouterRtpCapabilities', async (data, callback) =>{

            if (!batchFlag){
            
                await resolveAfterXSeconds(3) //wating for 3 sec... to get the router rtp capabilities
            
                callback(initRouter.getRtpCapabilities())
            }

            else{
                
                await resolveAfterXSeconds(3) //wating for 3 sec... to get the router rtp capabilities
            
                callback(batchRouter[batchCounter].getRtpCapabilities())
            }
        })
        /**
         * create Producer Transport
         */
        socket.on('createProducerTransport', async (data, callback) => {
            try {
                const { transport, params } = await initRouter.createTransport();

                producerTransport = transport;

                console.log('producerTransport Id: ', producerTransport.id)

                livEventProducers.set(producerTransport.id, livEvtProducerUsername)

                livEventTransports.set(producerTransport.id, producerTransport)

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

            console.log('batchRouter: ', batchRouter.length)

            if (!batchFlag){

                try {           
                    const { transport, params } = await initRouter.createTransport();
    
                    consumerTransport = transport;            
    
                    callback(params);
                    
                    console.log('consumer Transport Id: ', consumerTransport.id)    
                    
                    let consumerId =  findkeybyValue(consumerUsername, livEventConsumers) 
                    livEventConsumersTransport_Id.set(consumerId, consumerTransport.id)
                    let evenType = ConsumerJoinedEventType.get(consumerId)
    
                    if ( evenType !== 'private_event'){
    
                        livEventConsumersTransport.set(consumerId, consumerTransport)
    
                    }
                    else {
    
                        private_livEventConsumersTransport.set(consumerId, consumerTransport)
    
                    }
                    
                } 
                catch (err) {            
    
                    console.error(err);   
    
                    callback({ error: err.message });       
    
                }

            }

            else{

                try {           
                    const { transport, params } = await batchRouter[batchCounter].createTransport();
    
                    consumerTransport = transport;            
    
                    callback(params);
                    
                    console.log('consumer Transport Id: ', consumerTransport.id)
                    
                    let consumerId =  findkeybyValue(consumerUsername, livEventConsumers) 
    
                    let evenType = ConsumerJoinedEventType.get(consumerId)
    
                    if ( evenType !== 'private_event'){
    
                        livEventConsumersTransport.set(consumerId, consumerTransport)
    
                    }
                    else {
    
                        private_livEventConsumersTransport.set(consumerId, consumerTransport)
    
                    }
                    
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

            console.log('connectConsumerTransport::data:', data)

            await consumerTransport.connect({ dtlsParameters: data.dtlsParameters });

            callback();

        });
        /**
         * produce
         */
        socket.on('produce', async (data, callback) => {

            const {id , kind, rtpParameters} = data;

            let producerUsername = livEventProducers.get(producerTransport.id)

            console.log("data: ", data)

            if ( kind === 'video'){

                let videoTrackProducer = await producerTransport.produce({ kind, rtpParameters });

                producer.set('videoTrackProducer', videoTrackProducer)

                callback({ id: videoTrackProducer.id });

            }
            else{

                let audioTrackProducer = await producerTransport.produce({ kind, rtpParameters });

                producer.set('audioTrackProducer', audioTrackProducer)

                callback({ id: audioTrackProducer.id });
            }

            EventProducer.set(livEvtProducerUsername, producer)
            
            // inform clients about new producer
            socket.broadcast.emit('newProducer');
        });
        /**
         * consume
         */
        socket.on('consume', async (data, callback) => { 

           if (!batchFlag){
            
            let { rtpCapabilities, eventType } = data

            let consumer_id = findkeybyValue(consumerTransport.id, livEventConsumersTransport_Id)
            let event_id = findkeybyValue(consumer_id, eventID_consumerId_map)
            let producerUsername = livEventBroadcasters.get(event_id)

            console.log(`
                        producerUsername: ${producerUsername}
                        event_id : ${event_id}  
                        Consumer_id: ${consumer_id} 
                        `)
            
            // console.log('consumer --> producer ID: ', producer.id)

            // console.log('consume:', { producerId: producer.get('videoTrackProducer').id, rtpCapabilities})

            if (eventType !== 'private_event'){

                // console.log('can consume video: ', liveEvent.canConsume( { producerId: producer.get('videoTrackProducer').id, rtpCapabilities } ))
                // console.log('can consume audio: ', liveEvent.canConsume( { producerId: producer.get('audioTrackProducer').id, rtpCapabilities } ))
                
             
                if (!initRouter.canConsume( { producerId: EventProducer.get(producerUsername).get('videoTrackProducer').id, rtpCapabilities }) && !initRouter.canConsume( { producerId: EventProducer.get(producerUsername).get('audioTrackProducer').id, rtpCapabilities } )) {

                    console.error('can not consume');

                    return;
                }

           
                let { consumer, consumerParams } = await initRouter.createConsumer(consumerTransport, EventProducer.get(producerUsername), rtpCapabilities )

                // console.log('createConsumer@ public : consumer ', consumer)
                // console.log('createConsumer@ public : consumerParams', consumerParams)

                let consumerParamsJsonText  = stringfyMap(consumerParams)

                // console.log('createConsumer@ : consumerParamsJsonText', consumerParamsJsonText)

                Consumer  = consumer

                // console.log('Consumer: ', Consumer)

                // private_livEventConsumers.set( consumer.id, consumerUsername )

                // private_livConsumers.set(consumer.id, consumer)

                // console.log('live Event Consumers Map ', livEventConsumers)
                // console.log('Live Consumers: ', livConsumers)
                
                callback( consumerParamsJsonText );

            }

            else{

                // console.log('can consume: ', liveEvent.canConsume( { producerId: producer.get('videoTrackProducer').id, rtpCapabilities } ))
                // console.log('can consume: ', liveEvent.canConsume( { producerId: producer.get('audioTrackProducer').id, rtpCapabilities } ))
            
                if (!initRouter.canConsume( { producerId: EventProducer.get(producerUsername).get('videoTrackProducer').id, rtpCapabilities }) && !initRouter.canConsume( { producerId: EventProducer.get(producerUsername).get('audioTrackProducer').id, rtpCapabilities } )) {

                    console.error('can not consume');

                    return;
                }

            
                let { consumer, consumerParams } = await init.createConsumer(consumerTransport, EventProducer.get(producerUsername), rtpCapabilities )

                // console.log('createConsumer@ : consumer ', consumer)
                // console.log('createConsumer@ : consumerParams', consumerParams)

                let consumerParamsJsonText  = stringfyMap(consumerParams)

                // console.log('createConsumer@ : consumerParamsJsonText', consumerParamsJsonText)

                Consumer  = consumer

                console.log('consumerUsername: ', consumerUsername)

                // private_livEventConsumers.set( consumer.id, consumerUsername )

                // private_livConsumers.set(consumer.id, consumer)

                // console.log('live Event Consumers Map ', livEventConsumers)
                // console.log('Live Consumers: ', livConsumers)
                
                callback( consumerParamsJsonText );
            
            }
           
        }
           else{
            let { rtpCapabilities, eventType } = data
            // console.log('consumer --> producer ID: ', producer.id)

            // console.log('consume:', { producerId: producer.get('videoTrackProducer').id, rtpCapabilities})

            if (eventType !== 'private_event'){

                // console.log('can consume video: ', liveEvent.canConsume( { producerId: producer.get('videoTrackProducer').id, rtpCapabilities } ))
                // console.log('can consume audio: ', liveEvent.canConsume( { producerId: producer.get('audioTrackProducer').id, rtpCapabilities } ))
                
                if (!batchRouter[batchCounter].canConsume( { producerId: EventProducer.get(producerUsername).get('videoTrackProducer').id, rtpCapabilities }) && !batchRouter[batchCounter].canConsume( { producerId: EventProducer.get(producerUsername).get('audioTrackProducer').id, rtpCapabilities } )) {

                    console.error('can not consume');

                    return;
                }

            
                let { consumer, consumerParams } = await batchRouter[batchCounter].createConsumer(consumerTransport, EventProducer.get(producerUsername), rtpCapabilities )

                // console.log('createConsumer@ public : consumer ', consumer)
                // console.log('createConsumer@ public : consumerParams', consumerParams)

                let consumerParamsJsonText  = stringfyMap(consumerParams)

                // console.log('createConsumer@ : consumerParamsJsonText', consumerParamsJsonText)

                Consumer  = consumer

                // console.log('Consumer: ', Consumer)

                // private_livEventConsumers.set( consumer.id, consumerUsername )

                // private_livConsumers.set(consumer.id, consumer)

                // console.log('live Event Consumers Map ', livEventConsumers)
                // console.log('Live Consumers: ', livConsumers)
                
                callback( consumerParamsJsonText );

            }

            else{

                // console.log('can consume: ', liveEvent.canConsume( { producerId: producer.get('videoTrackProducer').id, rtpCapabilities } ))
                // console.log('can consume: ', liveEvent.canConsume( { producerId: producer.get('audioTrackProducer').id, rtpCapabilities } ))
            
                if (!batchRouter[batchCounter].canConsume( { producerId: EventProducer.get(producerUsername).get('videoTrackProducer').id, rtpCapabilities }) && !batchRouter[batchCounter].canConsume( { producerId: EventProducer.get(producerUsername).get('audioTrackProducer').id, rtpCapabilities } )) {

                    console.error('can not consume');

                    return;
                }

            
                let { consumer, consumerParams } = await batchRouter[batchCounter].createConsumer(consumerTransport, EventProducer.get(producerUsername), rtpCapabilities )

                // console.log('createConsumer@ : consumer ', consumer)
                // console.log('createConsumer@ : consumerParams', consumerParams)

                let consumerParamsJsonText  = stringfyMap(consumerParams)

                // console.log('createConsumer@ : consumerParamsJsonText', consumerParamsJsonText)

                Consumer  = consumer

                console.log('consumerUsername: ', consumerUsername)

                // private_livEventConsumers.set( consumer.id, consumerUsername )

                // private_livConsumers.set(consumer.id, consumer)

                // console.log('live Event Consumers Map ', livEventConsumers)
                // console.log('Live Consumers: ', livConsumers)
                
                callback( consumerParamsJsonText );
            }
           
        }

            
        });
        /**
         * restartIce: producer
         */
        socket.on('restartProducerIce', async(data, callback)=>{

            let { transportId } = data

            let producer_transport = livEventTransports.get(transportId)

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

            let consumer_transport = livEventConsumersTransport.get(consumerId)

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
            await Consumer.get('videoTrackConsumer').resume();
            await Consumer.get('audioTrackConsumer').resume();
            callback();
        });
    })
}
//
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

function stringfyMap( map ){

    let jsonText = JSON.stringify(Array.from(map.entries()));

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
/**
 * // Have two workers.
const worker1 = await mediasoup.createWorker();
const worker2 = await mediasoup.createWorker();

// Create a router in each worker.
const router1 = await worker1.createRouter({ mediaCodecs });
const router2 = await worker2.createRouter({ mediaCodecs });

// Produce in router1.
const transport1 = await router1.createWebRtcTransport({ ... });
const producer1 = await transport1.produce({ ... });

// Pipe producer1 into router2.
await router1.pipeToRouter({ producerId: producer1.id, router: router2 });

// Consume producer1 from router2.
const transport2 = await router2.createWebRtcTransport({ ... });
const consumer2 = await transport2.consume({ producerId: producer1.id, ... });
 */
async function createBatchRouter(worker, producer, producerUsername){

    let router = await createliveEvent(worker);

    let videoTrackProducerId = producer.get('videoTrackProducer').id
    let audioTrackProducerId = producer.get('audioTrackProducer').id
    
    router.pipeToRouter({videoTrackProducerId, audioTrackProducerId, producerUsername})
    
    return router
}

/**
 * initiate socket server
 */
module.exports = { init }