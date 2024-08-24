const DynamicEmail = require("../Emails/emailIndex")
const sendEmail = require("../Emails/email")
const OTPModel = require("../models/otpModel")
const bcrypt = require("bcrypt")

const sendOtp = async (agent, player, otp) => {
    try {
        const user = agent || player
        if (!user) throw new Error("No valid user provided")

        const salt = await bcrypt.genSalt(10)
        const hashedOtp = await bcrypt.hash(otp, salt)

        await OTPModel.create({
            agentId: agent ? agent._id : undefined,
            playerId: player ? player._id : undefined,
            otp: hashedOtp,
        })

        const subject = `${otp} is your verification code`
        const userName = user.userName
        const email = user.email
        const verificationLink = `https://pronext.onrender.com/verify/${user._id}`
        const html = DynamicEmail(userName, otp, verificationLink, email)

        await sendEmail({ email, subject, html, text: subject }) 
    } catch (error) {
        console.error("Error sending OTP:", error.message)
    }
}

module.exports = sendOtp