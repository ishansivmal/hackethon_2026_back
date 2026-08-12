const nodemailer = require("nodemailer");

// Brevo SMTP configuration (https://www.brevo.com)
const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_SERVER || "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.BREVO_LOGIN,
        pass: process.env.BREVO_SMTP_KEY
    }
});

const sendEmail = async ({ to, subject, html }) => {
    return transporter.sendMail({
        from: `"${process.env.BREVO_SENDER_NAME}" <${process.env.BREVO_SENDER_EMAIL}>`,
        to,
        subject,
        html
    });
};

module.exports = { sendEmail };
