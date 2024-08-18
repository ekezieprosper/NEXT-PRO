const deleteMail = require("../Emails/deleteEmail");
const sendEmail = require("../Emails/email");

const sendMail = async (agent, player) => {
    try {
        const subject = "Your account has been suspended";
        const userName = agent ? agent.userName : player.userName;
        const email = agent ? agent.email : player.email;
        const text = `Your account has been suspended`

        const supportTeam = `elitefootball234@gmail.com`;

        // Create the HTML content for the email
        const html = deleteMail(userName, supportTeam);

        // Send the email
        await sendEmail({ email, subject, text, html });
    } catch (error) {
        console.log(`Failed to send email to ${agent ? agent.email : player.email}: ${error.message}`);
    }
};

module.exports = sendMail;
