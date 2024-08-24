const deleteMail = (userName, supportTeam, email) => {
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
       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 10px; border: 1px solid #ddd;">
                <img src="https://res.cloudinary.com/da9fesl0x/image/upload/v1724452088/pj2mmfdp9conop8774ct.jpg" alt="Pronext Logo" width="156" height="100">
            <div style="text-align: center; margin-bottom: 15px;">
                <h2 style="font-size: 20px; color: #000; font-family: 'Helvetica Neue', sans-serif;">Your account has been suspended for 365 days.</h2>
            </div>
            <div style="text-align: left;">
             <p><b>${userName}</b>, We regret to inform you that your account has been suspended due to violations of our terms of service. This action was taken after careful review and in accordance with our policies to ensure the security and integrity of our platform.</p>
                    <p>If you believe this is a mistake or have any questions regarding the suspension, please contact our support team for further assistance at <a href="mailto:${supportTeam}" style="color: #007bff; text-decoration: underline;">support team</a>. We are here to help you resolve this matter as quickly as possible.</p>
             </div>
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

module.exports = deleteMail;