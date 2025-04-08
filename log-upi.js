const { google } = require('googleapis');
const dotenv = require('dotenv');
const fs = require('fs');
const creds = require('./credentials.json'); // your downloaded JSON key

dotenv.config();
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID; // your Google Sheet ID
const sheet = google.sheets({ version: 'v4', auth });

async function logTransaction({ type, amount, date, ref }) {
  const row = [type, amount, date, ref, '']; // last column is for "note"

  await sheet.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:E',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row]
    }
  });

  console.log('Transaction logged to Google Sheet');
}

logTransaction({
  type: 'debit',
  amount: 169,
  date: '2025-04-08 09:55:15',
  ref: 'UPI:100322084813'
});
