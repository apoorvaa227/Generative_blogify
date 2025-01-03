import * as nodemailer from "nodemailer";
import { SendMailOptions } from "nodemailer";

const sendMail = async (mailOptions: SendMailOptions): Promise<void> => {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_EMAIL_USER,
      pass: process.env.SMTP_EMAIL_PASS,
    },
  });

  try {
    const info = await transport.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Email could not be sent. Please try again later.");
  }
};

export default sendMail;
