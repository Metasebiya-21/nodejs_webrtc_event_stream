# Node.js WebRTC Livestreaming with mediasoup

This Node.js project demonstrates how to build a livestreaming application using WebRTC and mediasoup. It enables real-time video streaming between multiple participants, with media processing handled by mediasoup.

## Features

- Real-time video streaming using WebRTC
- Scalable media processing with mediasoup
- Support for multiple participants in a livestream
- Simple Node.js setup

## Enviroment Requirements
- Docker
- Docker Compose
  
## Technologies

- [mediasoup](https://mediasoup.org/) - A WebRTC SFU (Selective Forwarding Unit) for Node.js.
- [WebRTC](https://webrtc.org/) - A free, open-source project that provides web browsers and mobile applications with real-time communication via simple application programming interfaces (APIs).
- [Node.js](https://nodejs.org/) - A JavaScript runtime built on Chrome's V8 JavaScript engine.
  
## Installation and Usage with Docker Compose

1. Clone this repository:

    ```bash
    git clone https://github.com/Metasebiya-21/nodejs_webrtc_event_stream.git
    ```

2. Navigate into the project directory:

    ```bash
    cd nodejs_webrtc_event_stream
    ```

3. Build and start the containers with Docker Compose:

    ```bash
    docker-compose up
    ```

4. Access the application in your web browser:

    ```
    http://localhost:3000
    ```

5. You will be prompted to provide access to your camera and microphone. Grant the necessary permissions to start livestreaming.

6. Share the provided URL with other participants to join the livestream.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


## Contact

For any inquiries or support, please contact [metasebiya8@gmail.com](mailto:metasebiya8@gmail.com).
