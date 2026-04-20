"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emailTemplate = (name, otp) => {
    return `
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>OTP Verification</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px; background-color:#f4f6f8;">
      <tr>
        <td align="center">

          <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; padding:30px;">
            
            <tr>
              <td style="text-align:center;">
                <h2 style="margin-bottom:10px;">OTP Verification</h2>
              </td>
            </tr>

            <tr>
              <td style="color:#333; font-size:16px;">
                <p>Hello ${name},</p>
                <p>Your One-Time Password (OTP) is:</p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:20px 0;">
                <div style="font-size:28px; font-weight:bold; letter-spacing:4px; color:#4f46e5;">
                  ${otp}
                </div>
              </td>
            </tr>

            <tr>
              <td style="color:#555; font-size:14px;">
                <p>This OTP is valid for a limited time. Do not share it with anyone.</p>
                <p>If you didn’t request this, you can ignore this email.</p>
              </td>
            </tr>

            <tr>
              <td style="padding-top:20px; font-size:12px; color:#999; text-align:center;">
                © 2026 Your App
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};
exports.default = emailTemplate;
