const fs = require('fs');
const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
  const range = req.headers.range;

  //  console.log(`initial reuqest range ${range}`);
  //C:\Users\Alemgena\Videos\livestream\backend\public\videos
  const video = path.join(__dirname, '../public/video_1629800988021.mp4');

  //    livefeed = path.join("/livefeed","hls")

  // const video = path.join(livefeed, "stream.m3u8");

  const video_size = fs.statSync(video).size;

  const CHUNK_SIZE = 10 ** 6; // setting the chunk size to 1 MB

  const start = Number(range.replace(/\D/g, ''));

  const end = Math.min(start + CHUNK_SIZE, video_size - 1);

  // Create headers
  const content_length = end - start + 1;

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${video_size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': content_length,
    'Content-Type': 'video/ogg',
  };

  // console.log(`start: ${start} and end: ${end}`);

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(video, { start, end });

  // Stream the video chunk to the client
  videoStream.pipe(res);
});
module.exports = router;
