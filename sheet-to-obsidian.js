// sheet-to-obsidian.js

const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

// 🔧 Configs
const vaultPath = process.env.OBSIDIAN_VAULT_PATH; // Your Obsidian folder path
const fileName = `${dayjs().format('YYYY-MM-DD')}.md`;
const filePath = path.join(vaultPath, fileName);

const SHEET_ID = process.env.GOOGLE_SHEET_ID; // 🔁 Replace with your actual Google Sheet ID
const SHEET_RANGE = 'Sheet1!A2:E';      // Adjust range if needed

// 🔐 Auth setup
async function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return await auth.getClient();
}

// 📤 Fetch Data from Google Sheets
async function fetchSheetData(authClient) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });
  return res.data.values || [];
}

// 📝 Generate Markdown
function toMarkdown(transactions) {
  let content = `# 💸 Expenses on ${dayjs().format('YYYY-MM-DD')}\n\n`;
  transactions.forEach(([type, amount, datetime, purpose, ref]) => {
    const time = dayjs(datetime).format('HH:mm');
    content += `- ${time} → ₹${amount} (${type}) — ${purpose}  \n`;
  });
  return content;
}

// 💾 Write to Obsidian
async function saveToObsidian() {
  try {
    const auth = await authorize();
    const transactions = await fetchSheetData(auth);
    const markdown = toMarkdown(transactions);
    
    fs.mkdirSync(vaultPath, { recursive: true });
    fs.writeFileSync(filePath, markdown);

    console.log(`✅ Saved to: ${filePath}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

saveToObsidian();
