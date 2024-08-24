const resendOtpEmail = (userName, otp, verificationLink, email) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Email Verification</title>
        <style>
            body, table, td, a {
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
                margin: 0;
                padding: 0;
            }
            table, td {
                border-collapse: collapse;
            }
            img {
                -ms-interpolation-mode: bicubic;
            }
            body {
                background-color: #f4f4f4;
                font-family: Arial, sans-serif;
                width: 100% !important;
                height: 100% !important;
            }
            .email-container {
                max-width: 500px;
                margin: auto;
                background: #ffffff;
                padding: 10px;
                border-radius: 8px;
            }
            .button {
                padding: 6px 12px;
                border-radius: 4px;
                background-color: #28a745;
                color: #ffffff;
                text-decoration: none;
                font-weight: bold;
                display: inline-block;
                margin-top: 15px;
                font-size: 12px;
            }
            .footer {
                font-size: 9px;
                color: #888888;
                text-align: center;
                margin-top: 15px;
                padding-top: 5px;
                border-top: 1px solid #e0e0e0;
            }
            .header img {
                width: 50px;
                height: auto;
                border-radius: 8px;
            }
            .content {
                font-size: 12px;
                color: #333333;
            }
            h1 {
                font-size: 16px;
                color: #333333;
                margin-bottom: 8px;
            }
            p {
                margin: 0 0 6px 0;
                padding: 0;
            }
            .otp {
                font-size: 18px;
                font-weight: bold;
                color: #333333;
                margin-top: 8px;
            }
        </style>
    </head>
    <body>
       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 10px;">
                <img src="https://res.cloudinary.com/da9fesl0x/image/upload/v1724452088/pj2mmfdp9conop8774ct.jpg" alt="Pronext Logo" width="156" height="100">
                <div style="text-align: center; margin-bottom: 15px;">
                <h2 style="font-size: 20px; color: #000; font-family: 'Helvetica Neue', sans-serif;">Account verification.</h2>
            </div>
            <p>Hi ${userName},</p>
            <div style="text-align: left;">
            <p> We're excited to have you join us, click the button below to verify your account and stay connected:</p>
             </div>
            <div style="text-align: center;">
                <a href="${verificationLink}" class="button" style="display: inline-block; padding: 8px 16px; background-color: green; color: #ffffff; text-decoration: none; font-size: 14px; border-radius: 4px;">Verify Account</a>
            </div>

            <p style="text-align: center; margin-top: 15px;">Or enter this verification code:</p>
            <h2 style="text-align: center; font-size: 28px; letter-spacing: 5px; color: #333;">${otp}</h2>
            <hr style="margin: 15px 0;">
            <footer style="text-align: center; color: #999; font-size: 10px;">
                <p>© ${new Date().getFullYear()} Pronext. 203 Muyibi Road</p>
                <p>This message was sent to <a href="mailto:${email}" style="color: #999;">${email}</a>.</p>
            </footer>
        </div>
    </body>
    </html>
    `;
}

module.exports = resendOtpEmail;
