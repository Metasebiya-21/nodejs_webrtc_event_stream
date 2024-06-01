"use strict";
const os = require("os");
const ip = require("ip");
const WorkerLogTag = require('mediasoup/lib/Worker')
const TransportListenIp = require('mediasoup/lib/Transport')
const RtpCodecCapability = require('mediasoup/lib/RtpParameters')

exports.config = {
    /**# managed by Certbot */
    ssl_certificate: '/etc/letsencrypt/live/ethiolive.net/fullchain.pem',
    ssl_certificate_key: '/etc/letsencrypt/live/ethiolive.net/privkey.pem',
    
    listenIp:'0.0.0.0',
    listenPort: 3016,

    /**
     * 
     * mediasoup configurations
     * 
     * */
    mediasoup: {
        numWorkers: os.cpus().length,

        //setting the workers
        worker: {
            logLevel: "debug",
            logTags: [
                'info',
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp',
            ],
            rtcMinPort: 40000,
            rtcMaxPort: 49999     
        },

        //setting the router
        router: {
            mediaCodecs: [
                {
                    kind: "audio",
                    mimeType: "audio/opus",
                    clockRate: 48000,
                    channels: 2,
                    parameters: {
                        "minptime": 10,
                        "sprop-stereo": 1,
                        "usedtx": 1,
                        "useinbandfec": 1
                      },
                      payloadType: 100,
                      rtcpFeedback: []
                    
                },
                {
                    kind: "video",
                    mimeType: "video/H264",
                    clockRate: 90000,
                    parameters: {
                        "packetization-mode": 1,
                        "profile-level-id": "42e01f",
                        "level-asymmetry-allowed": 1
                    }
                },
            ]
        },

        //webrtc transport settings
        webRtcTransport: {
            listenIps: [
                {
                    ip: '0.0.0.0',
                    announcedIp: ip.address(),
                },
            ],
            maxIncomeBitrate: 150000,
            initialAvailableOutgoingBitrate: 10000000
        },
        plainTransportOptions: {
			listenIp :{
                ip: '0.0.0.0',
                announcedIp: ip.address(),
			},
			maxSctpMessageSize : 262144
		}
    }
};

console.log(`Incoming from config: number of cpus = ${os.cpus().length}`);