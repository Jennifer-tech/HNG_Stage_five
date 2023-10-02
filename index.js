const express = require('express');
const busboy = require('connect-busboy');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const port = process.env.PORT || 3000;

app.use(busboy({ highWaterMark: 2 * 1024 * 1024 }));
app.use(express.json());

const uploadPath = path.join(__dirname, 'uploads');
fs.ensureDir(uploadPath);

// Route for file upload
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

// Route to get a specific video by filename
app.get('/api/stream/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadPath, filename);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

// Route to get a list of all uploaded videos
app.get('/api/videos', (req, res) => {
    fs.readdir(uploadPath, (err, files) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            const videoList = files.filter((file) => file.endsWith('.mp4'));
            res.json(videoList);
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// const express = require('express');
// const busboy = require('connect-busboy')
// const path = require('path');
// const fs = require('fs-extra')

// const app = express();
// const port = process.env.PORT || 3000;

// const OPENAI_API_KEY = 'your-openai-api-key';

// app.use(busboy({
//     highWaterMark: 2 * 1024 * 1024  //set 2MiB buffer
// }))  //insert the busboy middleware

// const uploadPath = path.join(__dirname, 'uploads');  //Register the upload path
// fs.ensureDir(uploadPath)

// // Create route /upload which handles the post request

// app.route('/upload').post((req, res, next) => {
//     req.pipe(req.busboy);  //pipe it through busboy

//     const uploadedFiles = []

//     req.busboy.on('file', (fieldname, file, {filename}) => {
//         console.log(`Upload of '${filename}' started`)
        
//         // create a write stream for the new file
//         const fstream = fs.createWriteStream(path.join(uploadPath, filename))
//         // pipe the file stream through the write stream
//         file.pipe(fstream);

//         // On the finish of the upload
//         fstream.on('close', async () => {
//             console.log(`Upload of '${filename}' finished`);
//             uploadedFiles.push(filename);
            
//             // if all files have been uploaded, transcribe them and generate links
//             if(uploadedFiles.length === req.busboy._files.length){
//                 try {
//                     const transcriptions = await transcribeUploadedVideos(uploadedFiles);
//                     console.log('Transcriptions:', transcriptions);

//                     // Generate links to the uploaded videos
//                     const videoLinks = uploadedFiles.map(filename => ({
//                         filename,
//                         videoUrl: `/uploaded/${filename}` 
//                     }))

//                     // You can now use the transcriptions and video links in your aplications
//                     res.send({ transcriptions, videoLinks })
//                 }catch(error) {
//                     console.error('Error transcribing videos: ', error);
//                     res.status(500).send('Error occured during transcription');
//                 }
//             } 
//             // const videoUrl = `/uploaded/${filename}`
//             // res.send(`File uploaded successfully. Access it <a href="${videoUrl}">here</a>`);
//         })
        

//     })
// })
// async function transcribeUploadedVideos(files){
//     const transcriptions = [];

//     for (const filename of files){
//         const audioFilePath = path.join(uploadPath, filename);
//         const transcripton = await transcribeWithWhisper(audioFilePath)
//         transcriptions.push({ filename, transcription })
//     }
//     return transcriptions;
// }

// async function transcribeWithWhisper(audioFilePath) {
//     const audioFileBuffer = fs.readFileSync(audioFilePath)
// }

// // serve uploaded fies
// app.use('/uploaded', express.static(uploadPath));

// app.route('/').get((req, res) => {
//     res.writeHead(200, {'Content-Type': 'text/html'});
//     res.write('<form action="upload" method="post" enctype="multipart/form-data">');
//     res.write('<input type="file" name="fileToUpload"><br>')
//     res.write('<input type="submit">');
//     res.write('</form>');
//     return res.end()
// });

// const server = app.listen(port, () => {
//     console.log(`Listening on port ${server.address().port}`)
// })

