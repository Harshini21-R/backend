const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

const OAuth2 = google.auth.OAuth2;

const getTransporter = () => {
    const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground" // redirect URL
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL_USER,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: oauth2Client.getAccessToken() // auto refresh
        }
    });
};

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = getTransporter();

        const mailOptions = {
            from: `Readify <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("📨 Email sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Gmail Error Message:", error.message);
        console.error("❌ Gmail Error Stack:", error.stack);
        console.error("❌ Gmail Error Response:", error.response?.data || error.response || "No response");
        throw error;
    }
};

module.exports = { sendEmail };
