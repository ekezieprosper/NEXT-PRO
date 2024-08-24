// const resetFunc = (userName,verificationLink) => {
//     return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <meta http-equiv="X-UA-Compatible" content="IE=edge">
//         <meta name="x-apple-disable-message-reformatting">
//         <title>Email Verification</title>
//         <link href="https://fonts.googleapis.com/css?family=Lato:300,400,700" rel="stylesheet">
//         <style>
//             /* General Resets */
//             body, table, td, a {
//                 -webkit-text-size-adjust: 100%;
//                 -ms-text-size-adjust: 100%;
//             }
//             table, td {
//                 mso-table-lspace: 0pt;
//                 mso-table-rspace: 0pt;
//             }
//             img {
//                 -ms-interpolation-mode: bicubic;
//             }
//             /* Prevent WebKit and Windows mobile changing default text sizes */
//             body {
//                 margin: 0;
//                 padding: 0;
//                 height: 100% !important;
//                 width: 100% !important;
//                 background-color: white;
//                 font-family: 'Lato', sans-serif;
//             }
//             /* Avoid iOS mail space */
//             table {
//                 border-collapse: collapse !important;
//             }
//             /* Mobile Styles */
//             @media screen and (max-width: 600px) {
//                 .email-container {
//                     width: 100% !important;
//                     margin: auto !important;
//                 }
//                 .fluid {
//                     max-width: 100% !important;
//                     height: auto !important;
//                     margin-left: auto !important;
//                     margin-right: auto !important;
//                 }
//                 .stack-column,
//                 .stack-column-center {
//                     display: block !important;
//                     width: 100% !important;
//                     max-width: 100% !important;
//                     direction: ltr !important;
//                 }
//                 .stack-column-center {
//                     text-align: center !important;
//                 }
//                 h1 {
//                     font-size: 20px !important;
//                 }
//                 h2 {
//                     font-size: 18px !important;
//                 }
//                 h3 {
//                     font-size: 16px !important;
//                 }
//                 p, ul, li {
//                     font-size: 14px !important;
//                 }
//                 .padding-mobile {
//                     padding: 10px !important;
//                 }
//             }
//         </style>
//     </head>
//     <body>
//         <center style="width: 100%; background-color: white;">
//             <div style="max-width: 600px; margin: 0 auto;" class="email-container">
//                 <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
//                     <tr>
//                         <td style="padding: 2em 0; text-align: center; background-color: #ffffff;" class="padding-mobile">
//                             <img src="https://res.cloudinary.com/dqjixyz71/image/upload/v1714691315/jmf6xunogjxcydxevfue.jpg" alt="Elite Football Logo" width="80" style="width: 80px; max-width: 80px; height: auto; margin: auto; display: block; border-radius: 50%;">   
//                             <div style="text-align: left;">
//                                 <h1 style="font-size: 20px; font-weight: 350; margin: 10px 0;">hi, <b style="color: black; font-weight: 350">${userName}</b>!</h1><br>
//                             </div>

//                             <div style="text-align: left;">
//                             <p style="text-align: left; font-size: 16px; font-weight: 300; margin-bottom: 0; color: black;">We received a request to reset your password.<br>You can directly reset your password by clicking on the link below.</p><a href="${verificationLink}" class="btn btn-primary" style="padding: 10px 20px; display: inline-block; border-radius: 3px; margin-top: 20px; background: green; color: white; text-decoration: none;">reset password</a>
//                             </div>
//                                 <hr><p style="margin-left:2mm; font-size: 12px; color: #909090;">©${new Date().getFullYear()} pronext, all rights reserved.</p>
//                         </td>
//                     </tr>
//                 </table>
//             </div>
//         </center>
//     </body>
//     </html>
//     `
// }

// module.exports = {resetFunc}




const resetFunc = (verificationLink, email) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Password Reset</title>
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
                padding: 10px 20px;
                border-radius: 4px;
                background-color: #28a745;
                color: #ffffff;
                text-decoration: none;
                font-weight: bold;
                display: inline-block;
                margin-top: 15px;
                font-size: 16px;
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
                width: 156px;
                height: auto;
            }
            .content {
                font-size: 14px;
                color: #333333;
            }
            h1 {
                font-size: 20px;
                color: #333333;
                margin-bottom: 8px;
            }
            p {
                margin: 0 0 10px 0;
                padding: 0;
            }
        </style>
    </head>
    <body>
       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 10px; border: 1px solid #ddd;">
            <img src="https://res.cloudinary.com/da9fesl0x/image/upload/v1724452088/pj2mmfdp9conop8774ct.jpg" alt="Pronext Logo" width="156" height="100">
            <div style="text-align: left; margin-bottom: 15px;">
                <p>We received a request to reset the password for your account.</p>
                <p>If you did not request a password reset, you can ignore this email. Otherwise, click the button below to reset your password:</p>
            </div>
            <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Reset Password</a>
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

module.exports = { resetFunc };
