const DynamicEmail = (userName, otp, verificationLink) => {
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
                max-width: 600px;
                margin: auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
            }
            .button {
                padding: 8px 16px;
                border-radius: 4px;
                background-color: #007bff;
                color: #ffffff;
                text-decoration: none;
                font-weight: bold;
                display: inline-block;
                margin-top: 20px;
                font-size: 12px;
            }
            .footer {
                font-size: 10px;
                color: #888888;
                text-align: center;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #e0e0e0;
            }
            .header img {
                width: 100px;
                height: auto;
                border-radius: 8px;
            }
            .content {
                font-size: 14px;
                color: #333333;
            }
            h1 {
                font-size: 18px;
                color: #333333;
                margin-bottom: 10px;
            }
            p {
                margin: 0 0 8px 0;
                padding: 0;
            }
            .otp {
                font-size: 14px;
                font-weight: bold;
                color: #333333;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <center style="width: 100%; background-color: #f4f4f4;">
            <div class="email-container">
                <div class="header" style="text-align: center;">
                    <img src="https://res.cloudinary.com/dqjixyz71/image/upload/v1714691315/jmf6xunogjxcydxevfue.jpg" alt="ProNest Logo">
                </div>
                <div class="content">
                    <h1>Hi <b style="color: green;">${userName}</b>!</h1>

                    <p style="text-align: left; font-size: 14px; font-weight: 320; margin-bottom: 0; color: black;">
                        We’re excited to have you join our community. To get started, verify your account by clicking the link below:
                    </p>
                    <a href="${verificationLink}" class="button" style="padding: 8px 16px; display: inline-block; border-radius: 3px; margin-top: 20px; background: green; color: white; text-decoration: none;">
                        Verify your account
                    </a>
                    <p class="otp">Your verification code is: <b>${otp}</b></p>
                </div>  
                <div class="footer">
                    <p>© ${new Date().getFullYear()} ProNest. All rights reserved.</p>
                </div>
            </div>
        </center>
    </body>
    </html>
    `;
}

module.exports = DynamicEmail;
