const { google } = require('googleapis');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("--- Get Google Refresh Token ---");

rl.question('Enter your Client ID: ', (clientId) => {
    rl.question('Enter your Client Secret: ', (clientSecret) => {

        const oauth2Client = new google.auth.OAuth2(
            clientId.trim(),
            clientSecret.trim(),
            'urn:ietf:wg:oauth:2.0:oob' // Special redirect URI for manual copy-paste
        );

        // Generate the url that the user needs to visit
        const scopes = ['https://www.googleapis.com/auth/gmail.send'];
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline', // crucial for refresh token
            scope: scopes
        });

        console.log('\nPlease visit this URL to authorize this app:');
        console.log('--------------------------------------------------');
        console.log(url);
        console.log('--------------------------------------------------');

        rl.question('\nEnter the code from that page here: ', async (code) => {
            try {
                const { tokens } = await oauth2Client.getToken(code.trim());

                console.log('\n✅ SUCCESS! Here are your credentials:\n');
                console.log('REFRESH_TOKEN:');
                console.log(tokens.refresh_token);
                console.log('\n(Copy this Refresh Token into your .env file)');

                if (!tokens.refresh_token) {
                    console.log("⚠️  No refresh token returned. Did you already authorize this app? Go to https://myaccount.google.com/permissions and remove the app, then try again to force a new refresh token.");
                }

            } catch (error) {
                console.error('\n❌ Error retrieving access token:', error.message);
            } finally {
                rl.close();
            }
        });
    });
});
