const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;

const getGmailClient = () => {
    const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground" // Redirect URL
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
};

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const gmail = getGmailClient();

        // Use Nodemailer to create the raw MIME message
        const mailComposer = new nodemailer.MailComposer({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        });

        const message = await mailComposer.compile().build();

        // Encode the message to base64url format required by Gmail API
        const rawMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage
            }
        });

        console.log("Email sent via Gmail API: ", res.data);
        return res.data;
    } catch (error) {
        console.error("Error sending email via Gmail API:", error);
        throw error;
    }
};

module.exports = { sendEmail };
