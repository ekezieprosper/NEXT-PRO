const deleteMail = require("../Emails/deleteEmail");
const sendEmail = require("../Emails/email")

const sendMail = async (agent, player, otp) => {
    try {
        const user = agent || player
        if (!user) throw new Error("No valid user provided")

        // Prepare email content
        const subject = `Your account has been suspended`
        const userName = user.userName
        const email = user.email
        const supportTeam = `elitefootball234@gmail.com`

        const html = deleteMail(userName, supportTeam, email)

        await sendEmail({ email, subject, html, text: subject }) 
    } catch (error) {
        console.error("Error sending OTP:", error.message)
    }
}

module.exports = sendMail