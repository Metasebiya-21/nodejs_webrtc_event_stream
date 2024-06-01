const Router = require('mediasoup/lib/Router')
var { config } = require("../config/config");

const create_transport = async(mediasoupRouter, peerId, direction) => {
    //distracting the  maxIncomeBitrate, initalAvailabilityOutgoingBitrate for WebRTC Transport
    const {
        listenIps,
        maxIncomeBitrate,
        initialAvailableOutgoingBitrate
    } = config.mediasoup.webRtcTransport


    const transport = await mediasoupRouter.createWebRtcTransport({
        listenIps, //the webrtc transport listens to this ip
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate,
        appData: { peerId, clientDirection: direction },
    });

    if (maxIncomeBitrate){
        try{
            await transport.setMaxIncomingBitrate(maxIncomeBitrate)
        }
        catch(error){
            console.log(error)
        }
    }

    return{
        transport,
        params:{
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            dtlsCandidate: transport.dtlsCandidates
        }
    }
}

module.exports = { create_transport }