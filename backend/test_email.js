require("dotenv").config();
const { sendEmail } = require("./utils/emailService");

async function testEmail() {
    console.log("🔍 Testing Email Configuration (Gmail API)...");

    const user = process.env.EMAIL_USER;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const refreshToken = process.env.REFRESH_TOKEN;

    console.log(`📧 EMAIL_USER: ${user ? "Set ✅" : "Not Set ❌"}`);
    console.log(`🆔 CLIENT_ID: ${clientId ? "Set ✅" : "Not Set ❌"}`);
    console.log(`🔒 CLIENT_SECRET: ${clientSecret ? "Set ✅" : "Not Set ❌"}`);
    console.log(`🔄 REFRESH_TOKEN: ${refreshToken ? "Set ✅" : "Not Set ❌"}`);

    if (!user || !clientId || !clientSecret || !refreshToken) {
        console.error("❌ Missing environment variables. Please check your .env file.");
        return;
    }

    try {
        console.log("📤 Attempting to send test email...");
        const info = await sendEmail({
            to: user, // Send to self
            subject: "Readify Email Test (Gmail API)",
            text: "If you are reading this, your Gmail API configuration is working correctly! 🚀"
        });
        console.log("✅ Email sent successfully!");
        console.log("Response:", info.response);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}

testEmail();
