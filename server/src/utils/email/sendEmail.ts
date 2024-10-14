import AppError from '@/models/AppErrorModel';
import nodemailer from 'nodemailer';

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
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Sending The Email',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};
export default sendEmail;
