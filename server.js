const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Ensure folders exist
['uploads', 'output'].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
});


const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/convert', upload.single('audio'), (req, res) => {
    const inputPath = req.file.path;
    const outputFilename = `8d_${Date.now()}.mp3`;
    const outputPath = path.join('output', outputFilename);

    // Rotate audio using stereo pan oscillation
const cmd = ffmpeg(inputPath)
  .audioFilters([
    'apulsator=hz=0.08',
    'aecho=0.8:0.9:1000|1800:0.3|0.25'
  ])
  .format('mp3')
  .on('end', () => {
    res.download(outputPath, outputFilename, () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  })
  .on('error', err => {
    res.status(500).send('Conversion failed: ' + err.message);
  })
  .save(outputPath);

});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
