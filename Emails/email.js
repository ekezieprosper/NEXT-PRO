const nodemailer = require('nodemailer')
require('dotenv').config()

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: process.env.SERVICE,
        port: 587,
        secure: false,

        auth: {
            user: process.env.USER,
            pass: process.env.MAILPASS,
        }
    })

    let mailOptions = {
        from: `"ProNest" ${process.env.USER}`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    }

    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.error("Error sending email:", error)
    }
}

module.exports = sendEmail