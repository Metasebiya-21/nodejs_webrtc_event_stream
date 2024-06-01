"use strict";
const mediasoup = require('mediasoup-client');
const socketClient = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');
const socketPromise = require('../lib/socket.io-promise').promise;

//global variables
let device;
let videoConsumer;
let audioConsumer;
let flag;

//video control buttons
let Video_controls
let btn_backward;
let btn_play;
let btn_pause; 
let btn_forward; 
let liveStream;

let liveEventDiscription;

//volume control buttons variables
let Volume_Controls;
let btn_mute; 
let btn_volume_up;
let btn_volume_down;
let btn_restartIce;

//subscription control buttons
let Subscribtion_Control
let btn_subscribe;
let btn_unsubscribe;

let transport //this variable is temporarly set to gloabal variable

//fetch  the host, 
let hostname = window.location.host

//fetch the username and the Live Event Name from the url
const params = new URLSearchParams(window.location.search)
let username = params.get('username')
// let private_event = params.get('live_event').split('eventType')
// console.log(`private_event[0]: ${private_event[0]} \n private_event[1]: ${private_event[1]}`)
// let eventType = private_event[1]

let event = params.split('produced_by')

let eventname = event[0].trim()

let producerUsername = event[1].trim()

console.log(`hostname ${hostname} eventname: ${eventname} \n producerUsername:${producerUsername} `)

let joinedLiveEvent = new Map()

joinedLiveEvent.set(producerUsername, eventname)

let live_media_stream;

const opts = {
  secure:true,
reconnect: true,
rejectUnauthorized : false
}
liveEventDiscription = document.getElementById('led')
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const eventName = document.getElementById('eventName');
const userList = document.getElementById('users');
//initate conn with the server when the page is loaded
document.addEventListener("DOMContentLoaded", () => {

  liveStream = document.getElementById('live_event')

  btn_backward = document.getElementById('backward')
  btn_play = document.getElementById('play')
  btn_pause = document.getElementById('pause')
  btn_forward = document.getElementById('forward')
  btn_restartIce = document.getElementById('restartIce');

  btn_mute = document.getElementById('mute')
  btn_volume_up = document.getElementById('volume_up')
  btn_volume_down = document.getElementById('volume_down')

  btn_subscribe = document.getElementById('subscribe')
  btn_unsubscribe = document.getElementById('unsubscribe')

  btn_unsubscribe.disabled = true

  // add event listener to the video control buttons
  btn_backward.addEventListener('click', console.log(`you clicked : ${btn_backward}`))
  btn_play.addEventListener('click', console.log(`you clicked : ${btn_backward}`))       //console.log(`you clicked : ${btn_play}`))
  btn_pause.addEventListener('click', console.log(`you clicked on : ${btn_pause}`))
  btn_forward.addEventListener('click', console.log(`you clicked on : ${btn_forward}`))

  // add event listener to the volume control buttons
  btn_mute.addEventListener('click', console.log(`you clicked : ${btn_mute}`))
  btn_volume_up.addEventListener('click', console.log(`you clicked : ${btn_volume_up}`))
  btn_volume_down.addEventListener('click', console.log(`you clicked on : ${btn_volume_down}`))

  // add event listener to the subscription control buttons
  btn_subscribe.addEventListener('click', subscribe)
  btn_unsubscribe.addEventListener('click', unsubscribe)
  btn_restartIce.addEventListener("click", restartIce)
  // alert("DOM ready : consumer!");
});
console.log(`hostname: ${hostname} username: ${username} live_event: ${eventname} producerUsername: ${producerUsername}`)

function generate_consumerId(){
      
  return uuidv4()

}

let consumerId = generate_consumerId()

const serverUrl = `https://${hostname}`

const socket = socketClient(serverUrl, opts);
socket.request = socketPromise(socket);

socket.on('connect', async () => {
  console.log (`connected to ${serverUrl}`)
  console.log (`connected user : ${username} event : ${eventname}`)

  const data = await socket.request('getRouterRtpCapabilitiesConsumer',  {username, consumerId, eventname, producerUsername});
  await loadDevice(data);
});

socket.on('disconnect', () => {
  console.log (`disconnected from ${serverUrl}`)
  window.location.replace(`https://${hostname}/api/join_live_streams`);
});

socket.on('connect_error', (error) => {
  console.error('could not connect to %s %s (%s)', serverUrl, error.message);
  
});

socket.emit('join_event', {username,consumerId, eventname, producerUsername})

socket.on('liveEventDiscription', async (data, callback)=>{
  console.log('LiveEventDiscription', data)
  console.log('liveEventDiscription ', liveEventDiscription)
  liveEventDiscription.value = data
})

socket.on('liveStreamHalted', async (data, callback) =>{
  let {username, eventname, id} = data
  alert(`${username} halted the live stream of ${eventname} you are now redirected to ${serverUrl}/join_live_streams`)
  await resolveAfterXSeconds(2)
  window.location.replace(`${serverUrl}/join_live_streams`)
})

getliveEventDiscription()

async function getliveEventDiscription (){
  let led = await socket.request('live_event_discription')

  liveEventDiscription.value = led

}

/** load device rtp capabilities */
async function loadDevice(routerRtpCapabilities) {
  try {
    device = new mediasoup.Device();
    console.log("device is",device);
  } catch (error) {
    if (error.name === 'UnsupportedError') {
      console.error('browser not supported');
    }
  }
  await device.load({ routerRtpCapabilities });
}//end of loadDevice(routerRtpCapabilities)

/**
 * live chat panel
 */

// Get live event and users

// socket.emit('liveUsers', {eventId})

socket.on('liveUsers', ({ event, users })=>{
  console.log('liveUsers', { event, users })
  outputEventName(event);
  outputUsers(users);
})
// Message from server
socket.on('message', (message) => {
  console.log('message', message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  let message = e.target.elements.msg.value;

  message = message.trim();

  if (!message) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', { consumerId, username, message});

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += ` <span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputEventName(eventname) {
  eventName.innerText = eventname;
}

// Add users to DOM
function outputUsers(users) {
  console.log('array contains objects: ', users)
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

/**end of live chat panel */


/** subscribe audio and video */

async function subscribe() {
  

  const data = await socket.request('createConsumerTransport', { forceTcp: false });
  if (data.error) {
    console.error(data.error);
    return;
  }

  transport = device.createRecvTransport(data);

  console.log('transport: ', transport )

  transport.on('connect', ({ dtlsParameters }, callback, errback) => {
    
    socket.request('connectConsumerTransport', {
      transportId: transport.id,
      dtlsParameters
    })
      .then(callback)
      .catch(errback);
      console.log(`consumer -> transport Connectionstate --> ${transport.connectionState}`)
  });

  transport.on('connectionstatechange', async (state) => {

    console.log(`transport-->consumer connectionState --> ${state}`)

    switch (state) {
      case 'connecting':
        sub_status.innerHTML = 'subscribing...';
        //Subscribtion_Control.disabled = true;
        break;

      case 'connected':
        await resolveAfterXSeconds(3)
        liveStream.srcObject = live_media_stream
        liveStream.play()
        await socket.request('resume');
        console.log('live media stream: ',live_media_stream)
        sub_status.innerHTML = 'subscribed';
        btn_subscribe.disabled = true
        btn_unsubscribe.disabled = false
        break;
      case 'disconnected':
        let iceparameters = await socket.request('restartConsumerIce', { consumerId });
        if (iceparameters){
            console.log("restartIce::iceparameters ", {...iceparameters})
            transport.restartIce({iceParameters: {...iceparameters} })
        }
        else{
          flag = true
          transport.close()
        }
      
        break;      

      case 'failed':
        if(flag){
          transport.close()
          publish_status.innerHTML =  `connectionstatechange --> ${state} `;
        }

        else{
          let iceparams = await socket.request('restartConsumerIce', { consumerId });
          if (iceparams){
            console.log("restartIce::iceparameters ", {...iceparams})
            transport.restartIce({iceParameters: {...iceparams} })
          }
        }

        break;

      default: break;
    }
  });

  live_media_stream = await consume(transport);

  console.log('live media stream: ',live_media_stream)
 
}

async function consume(transport) {
  const { rtpCapabilities } = device;
  let dataJsonString = await socket.request('consume', { rtpCapabilities, eventType, consumerId });

  const data = parseJsonText(dataJsonString) 

  console.log('consumerParams ', data)

  let videoConsumerParams  = data.videoParams
  let audioConsumerParams = data.audioParams

  console.log('videoConsumerParams: ', {...videoConsumerParams })
  console.log('audioConsumerParams: ', {...audioConsumerParams })

  let stream = new MediaStream();
  if (videoConsumerParams){
      videoConsumer = await transport.consume({ ...videoConsumerParams })
      stream.addTrack(videoConsumer.track);
  }
  if (audioConsumerParams){
    audioConsumer = await transport.consume({ ...audioConsumerParams })
    stream.addTrack(audioConsumer.track)
  }

  
  


  // console.log('consumer track : ',{videoConsumer.track,  audioConsumer.track})

  console.log('stream: ', stream)

  return stream;
}

async function restartIce(){

  let iceparameters = await socket.request('restartConsumerIce', { consumerId });

  console.log("restartIce::iceparameters ", {...iceparameters})
  transport.restartIce({iceParameters: {...iceparameters} })

}

async function unsubscribe(){
  
  let consumerConfirmation = confirm('would you like to leave the live stream')
  if (consumerConfirmation){
    let unsubscribe_status = await socket.request('unsubscribe', { consumerId, username, producerUsername, eventType })

    if (unsubscribe_status){
      socket.emit('consumerLeave', {username, consumerId})
      await resolveAfterXSeconds(2)
      window.location.replace(`${serverUrl}/join_live_streams`);
    }
  }
}

function parseJsonText ( jsonText ){

	let map = JSON.parse(jsonText);

	return map
}

function resolveAfterXSeconds(x) {

  return new Promise(resolve => {

    setTimeout(() => {

      resolve(x);

    }, x * 10**3);

  });

}
