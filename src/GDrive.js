const fs = require('fs');
const util = require('util');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(__dirname, '../token.json');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

class GDrive {
  constructor() {
    this.oAuth2Client;
    this.drive;
  }

  async init() {
    // Load client secrets from a local file.
    try {
      const content = await readFile(
        path.join(__dirname, '../credentials.json'),
        (err, content) => {}
      );
      // Authorize a client with credentials.
      await this.authorize(JSON.parse(content));
      return;
    } catch (e) {
      console.log('Error loading client secret file:', e);
      return;
    }
  }

  /**
   * Create an OAuth2 client with the given credentials.
   * @param {Object} credentials The authorization client credentials.
   */
  async authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    if (fs.existsSync(TOKEN_PATH)) {
      try {
        const token = await readFile(TOKEN_PATH);
        this.setCredentials(JSON.parse(token));
      } catch (e) {
        console.log(e);
        return await this.getAccessToken();
      }
    } else {
      return await this.getAccessToken();
    }
  }

  /**
   * Get and store new token after prompting for user authorization.
   */
  async getAccessToken() {
    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    return new Promise((resolve, reject) => {
      rl.question('Enter the code from that page here: ', code => {
        rl.close();
        this.oAuth2Client.getToken(code, async (err, token) => {
          if (err) return console.error('Error retrieving access token', err);
          this.setCredentials(token);
          // Store the token to disk for later program executions
          try {
            await writeFile(TOKEN_PATH, JSON.stringify(token));
            console.log('Token stored to', TOKEN_PATH);
            resolve();
          } catch (e) {
            console.error(e);
            reject();
          }
        });
      });
    });
  }

  setCredentials(token) {
    this.oAuth2Client.setCredentials(token);
    this.drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
  }

  async runSample(query) {
    const params = { pageSize: 3, fields: 'files(id, name)', q: `name='${query}'` };
    const res = await this.drive.files.list(params);
    return res.data.files;
  }
}

module.exports = GDrive;
