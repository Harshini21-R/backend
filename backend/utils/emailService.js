// backend/utils/emailService.js
// Robust Brevo + Nodemailer adapter.
// - Prefer Brevo API (BREVO_API_KEY or BREVO_API_KE)
// - Fallback to Nodemailer (Gmail OAuth2 or SMTP) if available and configured
// - Returns { ok: true, response } or { ok: false, error }

require("dotenv").config();

const BREVO_KEY = process.env.BREVO_API_KEY || process.env.BREVO_API_KE;
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.MAIL_FROM || process.env.EMAIL_USER;

// helper to get fetch (global or node-fetch)
function getFetch() {
    if (typeof fetch === "function") return fetch;
    try {
        // node-fetch v2 CommonJS
        // eslint-disable-next-line global-require
        return require("node-fetch");
    } catch (err) {
        return null;
    }
}

function init() {
    if (BREVO_KEY && EMAIL_FROM) {
        console.log("✅ Brevo mailer ready (BREVO key and from present)");
        return true;
    }
    if (!BREVO_KEY) {
        console.warn("⚠️ BREVO_API_KEY not present. Will attempt Nodemailer fallback if configured.");
    }
    if (!EMAIL_FROM) {
        console.warn("⚠️ EMAIL_FROM / MAIL_FROM not present. Some providers require a valid sender.");
    }
    return !!(BREVO_KEY && EMAIL_FROM);
}

/**
 * sendEmail({ to, subject, text, html })
 * - to: string or array of strings
 */
async function sendEmail({ to, subject, text, html, from } = {}) {
    // Normalize sender
    const sender = from || EMAIL_FROM;

    // Normalize recipients
    const recipients = Array.isArray(to) ? to.map((e) => ({ email: e })) : [{ email: to }];

    // 1) Prefer Brevo API if key present
    if (BREVO_KEY) {
        const fetcher = getFetch();
        if (!fetcher) {
            const err = "No fetch available (install node-fetch or use Node 18+)";
            console.error("❌", err);
            return { ok: false, error: err };
        }

        try {
            const res = await fetcher(BREVO_URL, {
                method: "POST",
                headers: {
                    "api-key": BREVO_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sender: { email: sender },
                    to: recipients,
                    subject,
                    textContent: text,
                    htmlContent: html,
                }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                const err = (body && (body.message || JSON.stringify(body))) || `HTTP ${res.status}`;
                console.error("❌ Brevo API error:", err, body || "");
                return { ok: false, error: err, raw: body };
            }

            console.log("📨 Brevo send OK:", body);
            return { ok: true, response: body };
        } catch (err) {
            console.error("❌ Brevo network/fetch error:", err && (err.message || String(err)));
            // Fall through to possible Nodemailer fallback below if desired — but return error for now
            return { ok: false, error: err && (err.message || String(err)) };
        }
    }

    // 2) Nodemailer fallback (only if Brevo not configured)
    try {
        // lazy-require nodemailer to avoid dependency failure if not installed
        // eslint-disable-next-line global-require
        const nodemailer = require("nodemailer");
        const { google } = require("googleapis");

        // create transporter using OAuth2 or SMTP if configured
        const createTransporter = async () => {
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
                    "https://developers.google.com/oauthplayground"
                );
                oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

                const accessToken = await new Promise((resolve, reject) => {
                    oauth2Client.getAccessToken((err, token) => {
                        if (err) return reject(err);
                        resolve(token);
                    });
                });

                return nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        type: "OAuth2",
                        user: process.env.EMAIL_USER,
                        clientId: process.env.CLIENT_ID,
                        clientSecret: process.env.CLIENT_SECRET,
                        refreshToken: process.env.REFRESH_TOKEN,
                        accessToken,
                    },
                });
            }

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                return nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });
            }

            return null;
        };

        const transporter = await createTransporter();
        if (!transporter) {
            const err = "Nodemailer not configured (no OAuth2 or EMAIL_PASS).";
            console.warn("⚠️", err);
            return { ok: false, error: err };
        }

        const mailOptions = {
            from: sender || process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("📨 Nodemailer sent:", info && (info.messageId || info.response || info));
        // Return info in a shape callers may expect
        return { ok: true, response: info };
    } catch (err) {
        // nodemailer not installed or failed
        console.error("❌ Email send failed (no Brevo, nodemailer fallback failed):", err && (err.message || String(err)));
        return { ok: false, error: err && (err.message || String(err)) };
    }
}

module.exports = { init, sendEmail };