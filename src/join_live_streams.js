const socketClient = require('socket.io-client');
const socketPromise = require('../lib/socket.io-promise').promise;

//list options
let event_list;

//fetch  the host, 
let hostname = window.location.host
let private_eventId = window.location.search.slice(1)

//initate conn with the server when the page is loaded
document.addEventListener("DOMContentLoaded", () => {

  event_list = document.getElementById('list_live_events')

  console.log('event_list', event_list)
  
});
const opts = {
  secure:true,
reconnect: true,
rejectUnauthorized : false
}


const serverUrl = `https://${hostname}`

const socket = socketClient(serverUrl, opts);
socket.request = socketPromise(socket);

socket.on('connect', async () => {

  console.log (`connected to ${serverUrl}`)

  if (private_eventId === ""){

    let event_names = await socket.request('fetch_live_events') //set

    console.log("event name", event_names)

    listdown_live_events(event_names)

  }

  else {

    console.log('private event: ', private_eventId)

    let private_eventname = await socket.request('fetch_private_live_events' , { private_eventId })

    console.log('private_eventname: ', private_eventname)

    listdown_private_live_events(private_eventname)
  }

  
  
});

socket.on('disconnect', () => {
  console.log (`disconnected from ${serverUrl}`)
});

socket.on('connect_error', (error) => {
  console.error('could not connect to %s%s (%s)', serverUrl, error.message);
  
});

async function listdown_live_events(event_names){

  for (let i = 0; i < event_names.length; i++){
    let event = event_names[i]
    let option = document.createElement("option");
    option.textContent = event;
    option.value = event;
    event_list.appendChild(option);
  }
 
}

async function listdown_private_live_events(private_eventname){

  let option = document.createElement("option");
    option.textContent = private_eventname;
    option.value = private_eventname;
    event_list.appendChild(option);
}