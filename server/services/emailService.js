import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Check if SMTP is configured, else log to console as fallback (helpful for development/testing)
  if (
    !process.env.EMAIL_HOST ||
    process.env.EMAIL_USER === 'your_smtp_user'
  ) {
    console.log('--- DEVELOPMENT RESET EMAIL ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: \n${options.message}`);
    console.log('--------------------------------');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `${process.env.EMAIL_FROM || 'no-reply@chatapp.com'}`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
