const DynamicEmail = require("../Emails/emailIndex")
const sendEmail = require("../Emails/email")
const OTPModel = require("../models/otpModel")
const bcrypt = require("bcrypt")

const sendOtp = async (agent, player, otp) => {
    try {
        
        // Hash OTP then save it to the database
        const saltotp = bcrypt.genSaltSync(10)
        const hashotp = bcrypt.hashSync(otp, saltotp)

        await OTPModel.create({
            agentId: agent ? agent._id : undefined,
            playerId: player ? player._id : undefined,
            otp: hashotp
        })

        const subject = "Email Verification"
        const userName = agent ? agent.userName : player.userName
        const email = agent ? agent.email : player.email
        const text = `Verification code ${otp}`
        const verificationLink = `https://elitefootball.onrender.com/verify/${agent?._id||player?._id}`
        const html = DynamicEmail(userName, otp, verificationLink)
        await sendEmail({ email, subject, text, html })
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = sendOtp