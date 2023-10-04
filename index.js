const express = require('express')
const busboy = require('connect-busboy');
const path = require('path');
const app = express();
const OpenAI = require('openai')
// const fs = require('fs')
const fs = require('fs-extra');
require('dotenv').config()

const port = process.env.PORT || 3000;
// Define the uploadPath variable with the correct path
const uploadPath = path.join(__dirname, 'uploads'); // Adjust as needed
fs.ensureDir(uploadPath);

app.use(busboy({ highWaterMark: 2 * 1024 * 1024 }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.post('/api/upload', (req, res) => {
    req.pipe(req.busboy);

    req.busboy.on('file', (fieldname, file, { filename }) => {
        console.log('filename', filename)
        const filePath = path.join(uploadPath, filename);
        // const transcription = 'This is a sample transcription.';
        const videoLink = `/api/stream/${filename}`;

        const fstream = fs.createWriteStream(filePath);
        file.pipe(fstream);

        fstream.on('close', () => {
            res.json({ message: "The Link to access the video:", videoLink });
        });
    });
});

app.get('/api/video/:filename', (req, res) => {
    const filename = req.params.filename;
    const videoPath = `./uploads/${filename}`;

    const range = req.headers.range
    // console.log(req.headers)
    if (!range)
        res.status(400).send('error')

    const videoSize = fs.statSync(videoPath).size
    const chunkSize = 10 ** 6
    // bytes=64165
    const start = Number(range.replace(/\D/g, ''))
    const end = Math.min(start + chunkSize, videoSize - 1)

    // Ensure valid range values
    if (isNaN(start) || isNaN(end) || start >= videoSize || end >= videoSize) {
        res.status(416).send('Invalid range');
        return;
    }

    const contentLength = end - start + 1
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": 'bytes',
        "Content-Length": contentLength,
        "Content-Type": "video/mp4"
    }
    res.writeHead(206, headers)
    const videoStream = fs.createReadStream(videoPath, { start, end })
    console.log("videoStream", videoStream)

    videoStream.pipe(res)
})

app.get('/api/listvideos', (req, res) => {
    fs.readdir(uploadPath, (err, files) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const videoList = files.filter((file) => file.endsWith('.mp4'));
        res.json(videoList);
    });
});


// Configure OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

// Transcribe audio
app.get('/api/transcription/:filename', async (req, res) => {
    const filename = req.params.filename
    console.log("filenameT:", filename)
    const transcript = await transcribeAudio(filename);
    console.log("transcription:", transcript)
        res.json({ transcription: transcript})
})

// Function to transcribe video
async function transcribeAudio(filename) {
    try{
        const filePath = path.join(uploadPath, filename);
        const transcript = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: fs.createReadStream(filePath),
          });
        //   console.log("transcript:", transcript)
        console.log("Transcription:", transcript.data.text);
        return transcript.data.text
    } catch(error) {
        console.error("Transcription error:", error);
        return "Transcription error"
    }
}



app.listen(port, () => {
    console.log('listening on port 3000')
})

