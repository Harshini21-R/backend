const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

const createTransporter = async () => {
    try {
        // 1. Try OAuth2 (Preferred for Gmail)
        // Check if we have all necessary OAuth2 credentials
        if (
            process.env.CLIENT_ID &&
            process.env.CLIENT_SECRET &&
            process.env.REFRESH_TOKEN &&
            process.env.EMAIL_USER
        ) {
            const OAuth2 = google.auth.OAuth2;
            const oauth2Client = new OAuth2(
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET,
                "https://developers.google.com/oauthplayground" // Standard redirect URI
            );

            oauth2Client.setCredentials({
                refresh_token: process.env.REFRESH_TOKEN,
            });

            // Get fresh access token
            const accessToken = await new Promise((resolve, reject) => {
                oauth2Client.getAccessToken((err, token) => {
                    if (err) {
                        console.warn("⚠️ Failed to get access token for OAuth2, falling back or failing:", err.message);
                        reject("Failed to create access token");
                    }
                    resolve(token);
                });
            });

            console.log("Creating OAuth2 transporter...");
            return nodemailer.createTransport({
                service: "gmail",
                auth: {
                    type: "OAuth2",
                    user: process.env.EMAIL_USER,
                    clientId: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET,
                    refreshToken: process.env.REFRESH_TOKEN,
                    accessToken: accessToken,
                },
            });
        }

        // 2. Fallback to SMTP (App Password)
        // This is simpler and often more reliable for smaller scale or if OAuth fails
        else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            console.log("Creating SMTP transporter...");
            return nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        }

        else {
            throw new Error("No valid email configuration found (OAuth2 or SMTP).");
        }
    } catch (error) {
        console.error("❌ Link setup error:", error.message);
        return null;
    }
};

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = await createTransporter();

        if (!transporter) {
            throw new Error("Email transporter could not be initialized.");
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("📨 Email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Email Error:", error);
        // Don't crash the app if email fails, but log it
        // throw error; // Optional: rethrow if you want the caller to handle it
        return null;
    }
};

module.exports = { sendEmail };
