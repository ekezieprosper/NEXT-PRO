const resendOtpEmail = (userName, otp, verificationLink) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <title>Email Verification</title>
        <link href="https://fonts.googleapis.com/css?family=Lato:300,400,700" rel="stylesheet">
        <style>
            /* General Resets */
            body, table, td, a {
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
            }
            table, td {
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
            }
            img {
                -ms-interpolation-mode: bicubic;
            }
            /* Prevent WebKit and Windows mobile changing default text sizes */
            body {
                margin: 0;
                padding: 0;
                height: 100% !important;
                width: 100% !important;
                background-color: white;
                font-family: 'Lato', sans-serif;
            }
            /* Avoid iOS mail space */
            table {
                border-collapse: collapse !important;
            }
            /* Mobile Styles */
            @media screen and (max-width: 600px) {
                .email-container {
                    width: 100% !important;
                    margin: auto !important;
                }
                .fluid {
                    max-width: 100% !important;
                    height: auto !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                .stack-column,
                .stack-column-center {
                    display: block !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    direction: ltr !important;
                }
                .stack-column-center {
                    text-align: center !important;
                }
                h1 {
                    font-size: 20px !important;
                }
                h2 {
                    font-size: 18px !important;
                }
                h3 {
                    font-size: 16px !important;
                }
                p, ul, li {
                    font-size: 14px !important;
                }
                .padding-mobile {
                    padding: 10px !important;
                }
            }
        </style>
    </head>
    <body>
        <center style="width: 100%; background-color: white;">
            <div style="max-width: 600px; margin: 0 auto;" class="email-container">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
                    <tr>
                        <td style="padding: 2em 0; text-align: center; background-color: #ffffff;" class="padding-mobile">
                            <img src="https://res.cloudinary.com/dqjixyz71/image/upload/v1714691315/jmf6xunogjxcydxevfue.jpg" alt="Elite Football Logo" width="80" style="width: 80px; max-width: 80px; height: auto; margin: auto; display: block; border-radius: 50%;">   
                            <div style="text-align: left;">
                                <h1 style="font-size: 20px; font-weight: 350; margin: 10px 0;">hey, <b style="color: green; font-weight: 350">${userName}</b>!</h1><br>
                            </div>

                             <div style="text-align: left;">
                            <p style="text-align: left; font-size: 16px; font-weight: 320; margin-bottom: 0; color: black;">Click on this link below to verify your account.</p><a href="${verificationLink}" class="btn btn-primary" style="padding: 10px 20px; display: inline-block; border-radius: 3px; margin-top: 20px; background: green; color: white; text-decoration: none;">Verify your account</a>
                            </div>
                            
                            <div style="text-align: left;">
                                <h3 style="font-size: 18px; font-weight: 300; margin-bottom: 0; color: #333;">
                                    <p>otp code: <b>${otp}</b></p>
                                </h3><br>
                            </div>
                                <hr><p style="margin-left:2mm; font-size: 12px; color: #909090;">© ${new Date().getFullYear()} elitefootball.</p>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
    </html>
    `
}

module.exports = resendOtpEmail