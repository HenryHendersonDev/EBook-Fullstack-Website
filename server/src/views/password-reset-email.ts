const template = (code: string) => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset OTP</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f0f4ff;
        margin: 0;
        padding: 0;
        line-height: 1.5;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #007bff;
        color: #ffffff;
        padding: 20px;
        text-align: center;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }
      .content {
        padding: 30px;
        text-align: center;
      }
      .otp {
        font-size: 36px;
        font-weight: bold;
        color: #007bff;
        margin: 20px 0;
        padding: 10px 20px;
        display: inline-block;
        border: 2px solid #007bff;
        border-radius: 5px;
      }
      .footer {
        background-color: #f0f4ff;
        text-align: center;
        padding: 15px;
        font-size: 12px;
        color: #777777;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
      }
      a {
        color: #007bff;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>
          We received a request to reset your password. Please use the following
          One-Time Password (OTP) to complete your password reset:
        </p>
        <div class="otp">${code}</div>
        <p>
          This OTP is valid for 5 minutes. Please do not share it with anyone.
        </p>
        <p>
          If you did not request a password reset, please ignore this email.
        </p>
        <p>Thank you!</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ${process.env['WEBSITE_NAME']}. All rights reserved.</p>
        <p>
            ${process.env['WEBSITE_TERMS_URL'] ? `<a href="${process.env['WEBSITE_TERMS_URL']}">Terms of Service</a>` : null} |
            ${process.env['WEBSITE_PRIVACY_URL'] ? `<a href="${process.env['WEBSITE_PRIVACY_URL']}">Privacy Policy</a>` : null}
        </p>
      </div>
    </div>
  </body>
</html>
`;
};

export default template;
