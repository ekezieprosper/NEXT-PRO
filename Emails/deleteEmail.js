const deleteMail = (userName, supportTeam) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Account Suspension Notification</title>
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
        </style>
    </head>
    <body>
        <center style="width: 100%; background-color: #f4f4f4;">
            <div class="email-container">
                <div class="header" style="text-align: center;">
                    <img src="https://res.cloudinary.com/dqjixyz71/image/upload/v1714691315/jmf6xunogjxcydxevfue.jpg" alt="ProNest Logo">
                </div>
                <div class="content">
                    
                    <p><b>${userName}</b>, We regret to inform you that your account has been suspended due to violations of our terms of service. This action was taken after careful review and in accordance with our policies to ensure the security and integrity of our platform.</p>
                    <p>If you believe this is a mistake or have any questions regarding the suspension, please contact our support team for further assistance at <a href="mailto:${supportTeam}" style="color: #007bff; text-decoration: underline;">support team</a>. We are here to help you resolve this matter as quickly as possible.</p>
                </div>  
                <div class="footer">
                    <p>© ${new Date().getFullYear()} pronext, all rights reserved.</p>
                </div>
            </div>
        </center>
    </body>
    </html>
    `
}

module.exports = deleteMail
