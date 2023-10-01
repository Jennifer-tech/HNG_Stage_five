const express = require('express');
const busboy = require('connect-busboy')
const path = require('path');
const fs = require('fs-extra')

const app = express();
const port = process.env.PORT || 3000;
app.use(busboy({
    highWaterMark: 2 * 1024 * 1024  //set 2MiB buffer
}))  //insert the busboy middleware

const uploadPath = path.join(__dirname, 'fu/');  //Register the upload path
fs.ensureDir(uploadPath)

// Create route /upload which handles the post request

app.route('/upload').post((req, res, next) => {
    req.pipe(req.busboy);  //pipe it through busboy

    req.busboy.on('file', (fieldname, file, {filename}) => {
        console.log(`Upload of '${filename}' started`)
        // console.log('filename', filename)
        // console.log('fieldname', fieldname)
        // console.log('file', file)

        // create a write stream of the new file
        const fstream = fs.createWriteStream(path.join(uploadPath, filename))
        // pipe it through
        file.pipe(fstream);

        // On the finish of the upload
        fstream.on('close', () => {
            console.log(`Upload of '${filename}' finished`);
            // res.redirect('back')
            const videoUrl = `/uploaded/${filename}`
            res.send(`File uploaded successfully. Access it <a href="${videoUrl}">here</a>`);
        })
        

    })
})

// serve uploaded fies
app.use('/uploaded', express.static(uploadPath));

app.route('/').get((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="upload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="fileToUpload"><br>')
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end()
});

const server = app.listen(port, () => {
    console.log(`Listening on port ${server.address().port}`)
})

// const express = require('express');
// const { path } = require('express/lib/application');
// const multer = require('multer')
// const path = require('path')

// const app = express()
// const port = process.env.PORT || 3000;

// // configure multer for file upload
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/videos');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     },
// })

// const upload = multer({ storage })

// // serve static files
// app.use(express.static(path.join(__dirname, 'public')));

// // Handle file upload and rendering the page
// app.post('/upload', upload.single('video'), (req, res) => {
//     if(!req.file){
//         return res.status(400).send('No file uploaded');
//     }
//     const videoPath = `/videos/${req.file.filename}`;
//     res.render('index', { videoPath })
// })

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`)
// })