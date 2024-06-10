const nodemailer = require('nodemailer')
require('dotenv').config()

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: process.env.service,
        auth: {
            user: process.env.user,
            pass: process.env.mailpass,
            secure: true 
        },
        tls: {rejectUnauthorized: false}
    })

    let mailOptions = { 
        from: process.env.user,
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

