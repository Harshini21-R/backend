require("dotenv").config();
const { sendEmail } = require("./utils/emailService");

async function testEmail() {
    console.log("🔍 Testing Email Configuration...");

    const user = process.env.EMAIL_USER;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const refreshToken = process.env.REFRESH_TOKEN;
    const pass = process.env.EMAIL_PASS;

    const isOAuth = user && clientId && clientSecret && refreshToken;
    const isSMTP = user && pass;

    console.log(`📧 EMAIL_USER: ${user ? "Set ✅" : "Not Set ❌"}`);

    if (isOAuth) {
        console.log("✅ OAuth2 Configuration Detected:");
        console.log(`   - CLIENT_ID: Set`);
        console.log(`   - CLIENT_SECRET: Set`);
        console.log(`   - REFRESH_TOKEN: Set`);
    } else if (isSMTP) {
        console.log("✅ SMTP (App Password) Configuration Detected:");
        console.log(`   - EMAIL_PASS: Set`);
    } else {
        console.log("❌ No valid configuration found.");
        console.log("   - For OAuth2: Need EMAIL_USER, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN");
        console.log("   - For SMTP: Need EMAIL_USER, EMAIL_PASS");
        // We will try running anyway to see the error from the service
    }

    try {
        console.log("\n📤 Attempting to send test email...");
        const info = await sendEmail({
            to: user, // Send to self
            subject: "Readify Email Test",
            text: "If you are reading this, your email configuration is working correctly! 🚀"
        });

        if (info) {
            console.log("✅ Email sent successfully!");
            console.log("ID:", info.messageId);
        } else {
            console.error("❌ Failed to send email (check logs above).");
        }
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}

testEmail();
