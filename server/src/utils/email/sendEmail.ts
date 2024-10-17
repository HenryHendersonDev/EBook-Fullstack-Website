import nodemailer from 'nodemailer';
import handleError from '../errorHandle';

const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'],
      port: Number(process.env['SMTP_PORT']),
      secure: process.env['SMTP_SECURE'] === 'true',
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env['SMTP_FROM_EMAIL']!,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    if (!info) {
      return false;
    }
    return true;
  } catch (error) {
    return handleError(error, 'Sending Email');
  }
};
export default sendEmail;
