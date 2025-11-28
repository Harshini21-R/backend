require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
    console.log("🔍 Testing Email Configuration...");

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log(`📧 EMAIL_USER: ${user ? "Set ✅" : "Not Set ❌"}`);
    console.log(`🔑 EMAIL_PASS: ${pass ? "Set ✅" : "Not Set ❌"}`);

    if (!user || !pass) {
        console.error("❌ Missing environment variables. Please check your .env file.");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: user,
            pass: pass,
        },
    });

    const mailOptions = {
        from: user,
        to: user, // Send to self for testing
        subject: "Readify Email Test",
        text: "If you are reading this, your email configuration is working correctly! 🚀",
    };

    try {
        console.log("📤 Attempting to send test email...");
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully!");
        console.log("Response:", info.response);
    } catch (error) {
        console.error("❌ Error sending email:", error);
        if (error.code === 'EAUTH') {
            console.error("💡 Hint: Check your email and App Password. Ensure you are using an App Password, not your login password.");
        }
    }
}

testEmail();
