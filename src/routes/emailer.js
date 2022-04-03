const express = require("express")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const nodemailer = require('nodemailer')
const scheduler = require('node-schedule')
const router = new express.Router()
require('dotenv').config()

let corsOptions = {
    origin: "*", // allow only viaplanner to use the api 
    optionsSuccessStatus: 200,
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per 15 minutes, so 9 requests per seconds
})
  
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'viaplanner1@gmail.com',
        pass: process.env.EMAIL_PW
    }
})
router.options('*', [limiter, cors(corsOptions)])
router.post('/create-notification', [limiter, cors(corsOptions)], (req, res) => {
    
    // if(req.headers["x-api-key"] !== process.env.API_KEY){
    //     return res.status(400).send({ message: "Invalid api key" })
    // }

    const body = req.body
    const date = new Date(body.notificationDate)
    const job = scheduler.scheduleJob(date, () => {
        transporter.sendMail({
           from: 'viaplanner1@gmail.com',
           to: body.recipientEmail,
           subject: 'Assessment Notification From Viaplanner', 
           text:    `
                    Assessment Course: ${body.assessmentCourse}
                    Assessment Name: ${body.assessmentName}
                    Assessment Due Date: ${new Date(body.assessmentDate).toString()}
                    Assessment Details: ${body.assessmentDetails}
                    `
        }, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email send: ' + info.response);
            }
        });
    })
    res.status(200).send({ message: "Notification successfully created" })
})

module.exports = router