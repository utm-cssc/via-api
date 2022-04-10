const express = require("express")
const cors = require("cors")
const rateLimit = require("express-rate-limit");
const router = new express.Router()
const {
  PdfData,
  VerbosityLevel
} = require('pdfdataextract');
const multer = require('multer');
const upload = multer();

let corsOptions = {
  origin: 'https://timetable.viaplanner.ca', // allow only viaplanner to use the api 
  optionsSuccessStatus: 200
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per 15 minutes, so 9 requests per seconds
});

const re = /(Class Participation|Lab|Assignment|Term Test|Final Exam|Other|Quiz|Presentations|Final Exam Changed To)(.*|(?:.*\n+)*)(On-going|TBA|TBD|\d{4}-\d{2}-\d{2})+ (\d{1,3}%)\n/gmi;

router.post('/manager/parser', [upload.single('syllabus'), limiter, cors(corsOptions)], (req, res) => {
  PdfData.extract(req.file.buffer, {
    verbosity: VerbosityLevel.ERRORS, // set the verbosity level for parsing
    get: { // enable or disable data extraction (all are optional and enabled by default)
      text: true, // get text of each page
    },
  }).then((data) => {
    let result = [];
    let content = data.text.join();
    let matches = [...content.matchAll(re)];
    for (const match of matches) {
      const item = {
        type: match[1],
        description: match[2].trim(),
        deadline: /\d{4}-\d{2}-\d{2}/.test(match[3]) ? match[3] : null,
        on_going: match[3] === 'On-going',
        weight: match[4]
      }
      result.push(item);
    }
    if (result.length === 0) {
      res.status(400).send({
        message: 'Invalid syllabus format. Cannot parse the uploaded syllabus.'
      })
    } else {
      res.status(200).send(result);
    }
  }).catch(e => {
    res.status(500).send({
      message: e.message
    })
  })
})

module.exports = router