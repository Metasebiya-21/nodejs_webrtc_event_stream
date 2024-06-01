// "use strict";
const mediasoup = require('mediasoup-client');
const socketClient = require('socket.io-client');
const socketPromise = require('../lib/socket.io-promise').promise;
const { v4: uuidv4 } = require('uuid');

//global variables
let device;
let socket;
let flag;
let videoProducer 
let audioProducer
let media_stream;
let btn_publishLiveEventDiscription;

let btn_record;
let recordButton_status;

let btn_preview
let previewButton_status

let btn_upload
let uploadButton_status

let btn_delete
let deleteButton_status

let btn_download
let downloadButton_status

let codecPreferences

let mediaRecorder;  // 
let recordedBlobs;

//source control buttons
let btn_webcam;
let btn_screen;
let btn_halt;
let btn_restartIce;
let btn_publishLiveStream;

let chk_Simulcast;
let fs_publish;

let transport //this variable is temporarly set to gloabal variable

//display video
let video_live_event

//display texts
let connection_status;
let publish_status;
let webcam_status;
let screen_status;
let pubXsrc_status;
let Halt_Status;

let audio_src_list;
let video_src_list;

let liveEventDiscription;
let live_event_discription;
let invitationLink;

let chatForm
let eventName
let userList
let chatMessages

//fetch  the host, 
let hostname = window.location.host

const opts = {
  secure:true,
  reconnect: true,
  rejectUnauthorized : false
}

//fetch the username and the Live Event Name from the url
const params = new URLSearchParams(window.location.search)
let username = params.get('username')
let eventname = params.get('event_name')
let event_type = params.get('event_type')

let event_Meta_data;
//generate event id
function generate_eventId (){
      
  return uuidv4()

}
chatForm = document.getElementById('chatform');
chatMessages = document.querySelector('.chat-messages');
eventName = document.getElementById('eventName');
userList = document.getElementById('users');
invitationLink = document.getElementById('invitationLink')

document.addEventListener("DOMContentLoaded", function(){

  btn_publishLiveStream = document.getElementById('externalSource')
  btn_webcam = document.getElementById('webcam')
  btn_screen = document.getElementById('screen')
  btn_restartIce = document.getElementById('restartIce');
  btn_publishLiveEventDiscription = document.getElementById('publishLiveEventDiscription');
  fs_publish = document.getElementById('fs_publish')

  btn_record = document.getElementById('recordButton')
  recordButton_status = document.getElementById('recordButton_status')

  btn_preview = document.getElementById('previewButton')
  previewButton_status = document.getElementById('previewButton_status')

  btn_upload = document.getElementById('uploadButton')
  uploadButton_status = document.getElementById('uploadButton_status')

  btn_download = document.getElementById('downloadButton')
  downloadButton_status = document.getElementById('downloadButton_status')

  btn_delete = document.getElementById('deleteButton')
  deleteButton_status = document.getElementById('deleteButton_status')

  codecPreferences = document.getElementById('codecPreferences')


  chk_Simulcast = document.getElementById('simulcast')

  liveEventDiscription = document.getElementById('led')

  webcam_status = document.getElementById('webcam_status')
  screen_status = document.getElementById('screen_status')
  publish_status = document.getElementById('publish_status')
  pubXsrc_status = document.getElementById('pubXsrc_status')

  video_live_event = document.getElementById('live_event');
  // video_live_event.volume = 0
  audio_src_list = document.getElementById('audio_ip_source')
  video_src_list = document.getElementById('video_ip_source')

  btn_halt = document.getElementById('halt');
  Halt_Status = document.getElementById('Halt_Status');

  // add event listener to the source control buttons
  btn_webcam.addEventListener("click", publish)
  btn_screen.addEventListener("click", publish)
  btn_publishLiveStream.addEventListener("click", publish)

  liveEventDiscription = document.getElementById('led')

  btn_halt.addEventListener("click", haltLivestream)
  btn_restartIce.addEventListener("click", restartIce)

  btn_record.addEventListener("click", startRecordMediaStream)

  btn_preview.addEventListener("click", previewRecordedMediaStream)

  btn_upload.addEventListener("click", uploadRecordedMediaStream)

  btn_download.addEventListener("click", downloadRecordedMediaStream )

  btn_delete.addEventListener("click", deleteRecordedMediaStream)

  btn_publishLiveEventDiscription.addEventListener("click", setLiveEventDiscription)

}); 

// console.log('invitationLink: ', invitationLink)

console.log(`hostname: ${hostname} username: ${username} live_event: ${eventname} event type ${event_type}`)

const serverUrl = `https://${hostname}`

socket = socketClient.connect(serverUrl, opts);
socket.request = socketPromise(socket);

socket.on('connect', async () => {

  console.log (`connected to ${serverUrl}`)

  available_Devices()//

});

socket.on('disconnect', () => {
  console.log (`disconnected from ${serverUrl}`)
  window.location.replace(`https://${hostname}/api/create_live_streams`);
});

socket.on('connect_error', (error) => {
  console.error('could not connect to %s%s (%s)', serverUrl, error.message);
  
});

let eventId = generate_eventId ()

event_Meta_data = {username, eventname, eventId}

console.log('event_Meta_data :', event_Meta_data )



socket.emit('create_event', { username, eventname, eventId, event_type })

function setLiveEventDiscription(){
  live_event_discription = liveEventDiscription.value.trim()
  console.log('live_event_discription: ', live_event_discription)
  socket.emit('LiveEventDiscription', {username, eventname, eventId, event_type, live_event_discription})
}

async function get_room_rtp_capabilities (){
  const data = await socket.request('getRouterRtpCapabilitiesProducer');
  
  await loadDevice(data);

}
get_room_rtp_capabilities()

if (event_type === 'Private'){
  console.log(`event type ${event_type} : eventname ${eventname}`)

  invitationLink.disabled = false

  generate_invitationLink(eventname)

}

function generate_invitationLink(eventname){

  invitationLink.innerHTML = `https://${hostname}/api/join_live_streams?${eventId}`
}
/**
 * Performs current browser/device detection and returns the corresponding
 * mediasoup-client WebRTC handler name (or nothing if the browser/device is not supported).
*/
const handlerName = mediasoup.detectDevice();

if (handlerName) {
  console.log("detected handler: %s", handlerName);
} 
else {
  console.warn("no suitable handler found for current browser/device");
}

/** 
 * A device represents an endpoint that connects 
 * to a mediasoup Router to send and/or receive media.
 * 
 * @throws UnsupportedError, if the current browser/device is not supported.
*/
async function loadDevice(routerRtpCapabilities) {
  try {
    device = new mediasoup.Device();
  } catch (error) {
    if (error.name === 'UnsupportedError') {
      console.error('browser not supported');
    }
  }

  /*
  @device.load({ routerRtpCapabilities }) Loads the device with the RTP capabilities of 
                                           the mediasoup router.
  */
  await device.load({ routerRtpCapabilities }); 

}//end of loadDevice(routerRtpCapabilities)
/** 
 * live chat panel
*/
socket.emit('liveUsers', {eventId})

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
  socket.emit('chatMessage', { eventId, username, message});

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
/** end of live chat panel */

/** 
 * 
 * publish users audio and video 
 * 
*/
async function publish(e) {

  btn_halt.disabled = false
  console.log(`you clicked : ${e.target.id}`)
  const mediaInputSource = e.target.id
  
  switch (mediaInputSource){
    case 'webcam':
      publish_status = webcam_status
      break
    case 'screen':
      publish_status = screen_status
      break
    case 'externalSource':
      publish_status = pubXsrc_status
      break
    default:
      break
  }

  const data = await socket.request('createProducerTransport', {
    forceTcp: false,
    rtpCapabilities: device.rtpCapabilities,
  });

  if (data.error) {
    console.error(data.error);
    return;
  }
  if (!device){
    console.log('device is not ready yet')
    resolveAfterXSeconds(3)
    transport = device.createSendTransport(data);
  }

  transport = device.createSendTransport(data);-

  transport.getStats()

  transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
  
    socket.request('connectProducerTransport', {
       transportId    : transport.id, 
       dtlsParameters })
    .then(callback)
    .catch(errback);
  });
  //{ kind, rtpParameters }
  transport.on('produce', async ( data, callback, errback) => {
    console.log('data: ', data)
    try {
      const { id } = await socket.request('produce', {
        transportId: transport.id,
        kind : data.kind,
        rtpParameters: data.rtpParameters,
      });
      console.log ('producer id ', id)
      console.log('producer Kind: ', data.kind)
      callback({ id });
    } catch (err) {
      errback(err);
    }
  });
  
  transport.on('connectionstatechange', async (state) => {
    switch (state) {
      case 'connecting':
        publish_status.innerHTML = `connectionstatechange --> ${state} `;

        fs_publish.disabled = true;
      break;

      case 'connected':
        video_live_event.srcObject = media_stream;
        video_live_event.muted = true
        publish_status.innerHTML = `connectionstatechange --> ${state} transportId ${transport.id}`;
        if (videoProducer && audioProducer){
          videoProducer.resume()
        
          audioProducer.resume()

        }
        fs_publish.disabled = true;
      break;

      case 'disconnected' :
        let transportId = transport.id
        let iceparameters = await socket.request('restartProducerIce', { transportId, username });
        if (iceparameters){
            console.log("restartIce::iceparameters ", {...iceparameters})
            transport.restartIce({iceParameters: {...iceparameters} })
            publish_status.innerHTML =  `connectionstatechange --> ${state} `;
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
          let transport_Id = transport.id
          let iceparams = await socket.request('restartProducerIce', { transportId, username });
          if (iceparams){
            console.log("restartIce::iceparameters ", {...iceparameters})
            transport.restartIce({iceParameters: {...iceparams} })
          }
        }
      break;

      default:
         break;
    }
  });

  //let stream;
  try {

    media_stream = await getUserMedia(mediaInputSource);
    // console.log('media_stream :', media_stream)
    if (media_stream){
      handleSuccess(media_stream)
    }
    
    const videoTrack = media_stream.getVideoTracks()[0]; //video track

    const audioTrack = media_stream.getAudioTracks()[0]; // audio track

    const videoParams = { videoTrack };

    const audioParams = { audioTrack };

    console.log('videoParams: ', videoParams)
    console.log('audioParams: ', audioParams)

    /**
     * 
     * N.B: producer can have multiple audio and video tracks
    */

    /***
     * producing the video and audio
    */
   if (media_stream.getVideoTracks()[0] && media_stream.getAudioTracks()[0]){
     console.log('producing the video and audio streams')
      /***
     * producing the video
      */
      videoProducer = await transport.produce({
        track: media_stream.getVideoTracks()[0],
        encodings   :
        [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 }
        ],
        codecOptions :
        {
          videoGoogleStartBitrate : 1000
        }
      })
      console.log('videoProducer: ', videoProducer)
      /**
       * producing the audio
       */
      audioProducer = await transport.produce({
        track: media_stream.getAudioTracks()[0],
        codecOptions: {
          opusStereo: 1,
          opusDtx: 1,
        }
      });
    }
    /**
    * producing the video only
    */
    else if (media_stream.getVideoTracks()[0]){
      console.log('producing the video stream only')
      videoProducer = await transport.produce({
        track: media_stream.getVideoTracks()[0],
        encodings   :
        [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 }
        ],
        codecOptions :
        {
          videoGoogleStartBitrate : 1000
        }
      })
      console.log('videoProducer: ', videoProducer)
    }
    
    /**
     * producing the audio only
     * 
    */
    else if (media_stream.getAudioTracks()[0]){
      console.log('producing the audio stream only')
      audioProducer = await transport.produce({
        track: media_stream.getAudioTracks()[0],
        codecOptions: {
          opusStereo: 1,
          opusDtx: 1,
        }
      });
    }
    else{
      console.log('no video or audio')
    }
  } 
  catch (err) {

    publish_status.innerHTML = err;

  }

} //end of publish(e)

/** get User Media Function */
async function getUserMedia(mediaInputSource) {
  if (!device.canProduce('video')) {
    console.error('cannot produce video');
    return;
  }

  let stream;

  try {

    switch (mediaInputSource){
      case 'webcam':
        stream = await navigator.mediaDevices.getUserMedia({ video: {

                                                              width: {max: 1024},
                                                              height: {max: 1024},
                                                              aspectRatio: {ideal: 1}

                                                            },
                                                            audio: { 
          
                                                              autoGainControl: false,
                                                              googAutoGainControl: false,
                                                              channelCount: 2,
                                                              echoCancellation: false,
                                                              latency: 0,
                                                              noiseSuppression: false,
                                                              sampleRate: 48000,
                                                              sampleSize: 16,
                                                              volume: 1.0
                                                              
                                                            },
        })
        break
      case 'screen':
        stream = await navigator.mediaDevices.getDisplayMedia({ video:{

                                                                  width: {max: 1080},
                                                                  height: {max: 1080},
                                                                  aspectRatio: {ideal: 1}
                                                                },
                                                                audio: { 
          
                                                                  autoGainControl: false,
                                                                  googAutoGainControl: false,
                                                                  channelCount: 2,
                                                                  echoCancellation: false,
                                                                  latency: 0,
                                                                  noiseSuppression: false,
                                                                  sampleRate: 48000,
                                                                  sampleSize: 16,
                                                                  volume: 1.0
                                                                  
                                                                },
        })
        break
      case 'externalSource':
        stream = await getStream();
        break
      default:
        break
    }
  } 

  catch (err) {
    console.error('getUserMedia(mediaInputSource) failed --> ', err);
    throw err;
  }
  return stream;
}//end of getUserMedia(isWebcam)

async function restartIce(){

  let transportId = transport.id

  let iceparameters = await socket.request('restartProducerIce', { transportId });
  console.log("restartIce::iceparameters ", {...iceparameters})
  transport.restartIce({iceParameters: {...iceparameters} })

}

async function listdown_available_Devices(deviceList){

  for (let device of deviceList){
    console.log("Device Kind: "+device.kind + " Device Label: " + device.label + " DeviceId = " + device.deviceId);
    
    if (device.kind === 'audioinput'){
      let option = document.createElement("option");-0
      option.textContent = device.label;
      option.value = device.deviceId
      audio_src_list.appendChild(option);
    }
    else if ( device.kind === 'videoinput'){
      let option = document.createElement("option");
      option.textContent = device.label;
      option.value = device.deviceId
      video_src_list.appendChild(option);
    }
  }
}

async function available_Devices(){
  await navigator.mediaDevices.getUserMedia({ video: true,audio: { 
              autoGainControl: false,
              googAutoGainControl: false,
              channelCount: 2,
              echoCancellation: false,
              latency: 0,
              noiseSuppression: false,
              sampleRate: 48000,
              sampleSize: 16,
              volume: 1.0
   }})
  .then((p) => {
    navigator.mediaDevices.enumerateDevices()
    .then((deviceList) => listdown_available_Devices(deviceList)) //
    .catch((err) => {
      console.log('error getting MediaDeviceInfo list', err);
    });
  }) 
}
navigator.mediaDevices.ondevicechange = function(event) {
  updateDeviceList()
}
function updateDeviceList() {
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
    audio_src_list.innerHTML = "";
    video_src_list.innerHTML = "";
    
    devices.forEach(function(device) {

      if (device.kind === 'audioinput'){
        let option = document.createElement("option");-0
        option.textContent = device.label;
        option.value = device.deviceId
        audio_src_list.appendChild(option);
      }
      else if ( device.kind === 'videoinput'){
        let option = document.createElement("option");
        option.textContent = device.label;
        option.value = device.deviceId
        video_src_list.appendChild(option);
      }
      
    });
  });
}
async function getStream(){

  let audioInput = audio_src_list.options[audio_src_list.selectedIndex].value
  let videoInput = video_src_list.options[video_src_list.selectedIndex].value

  console.log('external source: '+' audioInput Id:  '+ audioInput +'\n'+'  videoInput Id: '+ videoInput)

  let constraints = {
    audio: { deviceId: {exact: audioInput} },// exact: audioInput ? : undefined
    video: { deviceId: {exact: videoInput} } // exact: videoInput ? : undefined 
  }
  console.log('constraints: ', constraints)
  try{
    let stream = await navigator.mediaDevices.getUserMedia(constraints)
    // .then(async (stream) =>{

    //   recordMediaStream(stream)

    // })
    console.log('enumerate devices:  stream ', stream)
    return stream;
  }
  catch(error){
    console.log('external src: stream: ', error)
  }

}
async function haltLivestream(){
  
  let producerConfirmation = confirm('would you like to halt the live stream')

  if (producerConfirmation){
    
    let isProducerTransportClosed = await socket.request('haltliveStream', { username, eventname, eventId, event_type })
    console.log('isProducerTransportClosed: ', isProducerTransportClosed)

    if (isProducerTransportClosed){
     
      btn_webcam.disabled = false 
      console.log('btn_webcam.disabled: ',btn_webcam.disabled)
      btn_screen.disabled = false
      console.log('btn_screen.disabled: ', btn_screen.disabled)
      btn_publishLiveStream.disabled = false
      video_live_event.muted = false
      btn_record.textContent = 'yello'
      btn_download.disabled = false;
      btn_upload.disabled = false;
      // await resolveAfterXSeconds(2)
      // window.location.replace(`${serverUrl}/create_live_streams`);
      stopRecording()
    }
  }
}
function resolveAfterXSeconds(x) {

  return new Promise(resolve => {

    setTimeout(() => {

      resolve(x);

    }, x * 10**3);
  });
}
function downloadRecordedMediaStream(){
  const blob = new Blob(recordedBlobs, {type: 'video/webm'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `${eventname}.webm`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}
function getDay(newDate){
  
	let day = newDate.getDay()

	switch (day) {
		case 0:
			return 'Sunday'
			break;
			
		case 1:
			return 'Monday'
			break;
		case 2:
			return 'Tuesday'
			break;
		case 3:
      return 'Wednsday'
      break;
		case 0:
      return 'Thursday'
      break;
		case 0:
      return 'Friday'
      break;
		case 0:
      return 'Saturday'
      break;
		default:
			break;
	}
}
function getMonth(newDate){
  let month = newDate.getMonth()
  switch (month) {
    case 1:
      return 'Jan'
      break;
    case 2:
      return 'Feb'
      break;
    case 3:
      return 'Mar'
      break;
    case 4:
      return 'Apr'
    case 5:
      return 'May'
      break;
    case 6:
      return 'Jun'
      break
    case 7:
      return 'Jul'
      break
    case 8:
      return 'Aug'
      break
    case 9:
      return 'Sep'
      break
    case 10:
      return 'Oct'
      break
    case 11:
      return 'Nov'
      break
    case 12:
      return 'Dec'
      break
    default:
      break
  }

}
function uploadRecordedMediaStream(){
  console.log('upload...')
  const blob = new Blob(recordedBlobs, {type: 'video/webm'});
  console.log("upoload blob: ", blob)
  let newDate = new Date();
  let formData = new FormData()
  let premiered_on = {
    Day: getDay(newDate),
    Date: `${getMonth(newDate)} ${newDate.getDate()}/${newDate.getFullYear()}`,
    Time: `${newDate.getHours()}:${newDate.getMinutes()}:${newDate.getSeconds()}`
  }


  formData.append("produced By", username)
  formData.append("premiered on", premiered_on)
  formData.append("live_event_discription", live_event_discription)

  formData.append("webmasterfile", blob);

  var request = new XMLHttpRequest();
  request.open("POST", `https://${hostname}/uploadVideo`);
  request.send(formData);


}
/**
 * 
 */
function previewRecordedMediaStream(){
  console.log('helo previewRecordedMediaStream')
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
  console.log('mimeType: ', mimeType )
  const superBuffer = new Blob(recordedBlobs, {type: mimeType});
  console.log('superBuffer: ', superBuffer )
  // video_live_event.srcObject = null;
  video_live_event.src = window.URL.createObjectURL(superBuffer);
  video_live_event.controls = true;
  video_live_event.play();
}
function deleteRecordedMediaStream(){
  console.log('delete...')
}
function getSupportedMimeTypes() {
  const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
  ];
  return possibleTypes.filter(mimeType => {
    return MediaRecorder.isTypeSupported(mimeType);
  });
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;

  // startRecordMediaStream(stream)

  getSupportedMimeTypes().forEach(mimeType => {
    const option = document.createElement('option');
    option.value = mimeType;
    option.innerText = option.value;
    codecPreferences.appendChild(option);
  });
  codecPreferences.disabled = false;

  startRecordMediaStream()
}

function startRecordMediaStream(){

  console.log('hello startRecordMediaStream')

  if (recordButton.textContent === 'Start Recording'){
    startRecording();
  }
  else{
    stopRecording()
    btn_record.textContent = 'Start Recording'
    btn_preview.disabled = false;
    btn_download.disabled = false;
    btn_upload.disabled = false;
    btn_delete.disabled = false;
    codecPreferences.disabled = false;
  }
 }

 function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {
  console.log('startRecording: ')

  btn_preview.disabled = true;
  btn_download.disabled = true;
  btn_upload.disabled = true;
  btn_delete.disabled = true;
  codecPreferences.disabled = true;

  recordedBlobs = [];
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value;
  const options = {mimeType};
  
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
    console.log('mediaRecorder: ', mediaRecorder)
  } 
  catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    recordButton.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  btn_record.textContent = 'Stop Recording';
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
}
function stopRecording() {
  mediaRecorder.stop();
}
