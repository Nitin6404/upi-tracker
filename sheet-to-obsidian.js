// sheet-to-obsidian.js

const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const readline = require('readline');
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

// 📤 Fetch Data from Google Sheets (Only today’s rows)
async function fetchSheetData(authClient) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = res.data.values || [];
  console.log(rows);

  // Only fetch today's transactions (date format: YYYY-MM-DD)
  const today = dayjs().format('YYYY-MM-DD');
  console.log(`Filtering transactions for today: ${today}`);
  const todayTransactions = rows.map(row => {
    const rowDate = dayjs(row[2]).format('YYYY-MM-DD');
    return rowDate === today;
  });

  return todayTransactions;
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

// ✍️ Append Manual Notes
async function appendManualNotes() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Add a note (e.g., Reason for spending): ', (note) => {
    const markdownNote = `\n\n### ${dayjs().format('HH:mm')} - Manual Note: ${note}\n`;
    fs.appendFileSync(filePath, markdownNote);
    console.log('✅ Manual note added!');
    rl.close();
  });
}

// 💾 Write to Obsidian
async function saveToObsidian() {
  try {
    const auth = await authorize();
    const transactions = await fetchSheetData(auth);
    console.log(`Fetched ${transactions.length} transactions for today.`);
    const markdown = toMarkdown(transactions);
    console.log('Generated Markdown:\n', markdown);

    // Create or overwrite the file
    fs.mkdirSync(vaultPath, { recursive: true });
    fs.writeFileSync(filePath, markdown);

    console.log(`✅ Saved today's transactions to: ${filePath}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

saveToObsidian();
