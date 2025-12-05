// backend/utils/emailService.js
// Brevo (Sendinblue) API mailer – keeps the same sendEmail({to,subject,text,html}) signature

require("dotenv").config();
// Removed node-fetch requiring as Node 22 has global fetch

const API_KEY = process.env.BREVO_API_KEY;
const API_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_FROM = process.env.EMAIL_FROM;

function init() {
    if (!API_KEY || !EMAIL_FROM) {
        console.warn("❌ Missing BREVO_API_KEY or EMAIL_FROM - Email service will fail if called.");
        return false;
    }
    console.log("✅ Brevo email service initialized");
    return true;
}

/**
 * sendEmail({ to, subject, text, html })
 */
async function sendEmail({ to, subject, text, html }) {
    // Ensure 'to' is formatted correctly for Brevo: [{ email: '...' }, ...]
    const recipients = Array.isArray(to)
        ? to.map((email) => ({ email }))
        : [{ email: to }];

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "api-key": API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sender: { email: EMAIL_FROM },
                to: recipients,
                subject,
                textContent: text,
                htmlContent: html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Brevo API Error:", data);
            return { ok: false, error: data.message || JSON.stringify(data) };
        }

        return { ok: true, response: data };
    } catch (err) {
        console.error("❌ Network/Fetch Error:", err.message);
        return { ok: false, error: err.message };
    }
}

module.exports = { init, sendEmail };
