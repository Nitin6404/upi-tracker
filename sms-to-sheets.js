const { execSync } = require('child_process');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const dayjs = require('dayjs');
const creds = require('./credentials.json');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

dotenv.config();

const LOG_FILE = path.join(__dirname, '.sms-log.json');
let loggedHashes = [];

if (fs.existsSync(LOG_FILE)) {
  loggedHashes = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
}

const getHash = (text) => crypto.createHash('sha256').update(text).digest('hex');

// Setup Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID; // your Google Sheet ID
const sheet = google.sheets({ version: 'v4', auth });

// UPI Regex Parsers
const parseSMS = (msg) => {
  const debit = msg.match(/debited INR ([\d.]+).*?Dt (\d{2}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}).*?UPI[:\s](\d+)/i);
  if (debit) {
    return {
      type: 'debit',
      amount: parseFloat(debit[1]),
      date: `${debit[2].replace(/-/g, '/')} ${debit[3]}`,
      ref: `UPI:${debit[4]}`
    };
  }

  const credit = msg.match(/credited (?:by|for) (?:Rs|INR)[\s]?([\d.]+).*?on (\d{2}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}).*?(IMPS|UPI)?\s?(Ref no|Ref ID)?[:\s]?(\d+)/i);
  if (credit) {
    return {
      type: 'credit',
      amount: parseFloat(credit[1]),
      date: `${credit[2].replace(/-/g, '/')} ${credit[3]}`,
      ref: `${credit[4] || ''}:${credit[6]}`
    };
  }

  return null;
};

async function logToSheet(txn) {
  await sheet.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:E',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[txn.type, txn.amount, txn.date, txn.ref, '']]
    }
  });

  console.log(`✅ Logged: ₹${txn.amount} (${txn.type})`);
}

async function main() {
  const raw = execSync('termux-sms-list -l 50').toString();
  const messages = JSON.parse(raw);

  for (const msg of messages) {
    const hash = getHash(msg.body);
    if (loggedHashes.includes(hash)) continue;
  
    const parsed = parseSMS(msg.body);
    if (parsed) {
      await logToSheet(parsed);
      loggedHashes.push(hash);
    }
  }
  
  fs.writeFileSync(LOG_FILE, JSON.stringify(loggedHashes, null, 2));
}

main();
