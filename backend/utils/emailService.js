const { google } = require("googleapis");
require("dotenv").config();

const OAuth2 = google.auth.OAuth2;

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const oauth2Client = new OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN,
        });

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        const encodedMessage = Buffer.from(
            `From: ${process.env.EMAIL_USER}\r\n` +
            `To: ${to}\r\n` +
            `Subject: ${subject}\r\n` +
            `Content-Type: text/html; charset=utf-8\r\n\r\n` +
            `${html || text}`
        )
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const response = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log("📨 Email sent:", response.data.id);
        return response.data;
    } catch (error) {
        console.error("❌ Gmail API Error:", error);
        throw error;
    }
};

module.exports = { sendEmail };
