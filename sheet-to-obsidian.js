// sheet-to-obsidian.js

const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

// 🔧 Configs (Change These)
const vaultPath = '/data/data/com.termux/files/home/storage/documents/ObsidianVault/Expenses'; // Your Obsidian folder
const fileName = `${dayjs().format('YYYY-MM-DD')}.md`;
const filePath = path.join(vaultPath, fileName);

// 📦 Example Data (replace this with real Google Sheets data)
const transactions = [
  ['2025-04-08 09:55:15', '169.00', 'debit', 'Grocery Shopping', 'UPI:100322084813'],
  ['2025-04-08 12:10:48', '385.00', 'credit', 'Refund from Friend', 'IMPS Ref 509812952351'],
  ['2025-04-08 13:38:20', '60.00', 'debit', 'Tea & Snacks', 'UPI:546472063956']
];

// 📄 Markdown Generator
let content = `# 💸 Expenses on ${dayjs().format('YYYY-MM-DD')}\n\n`;

transactions.forEach(([datetime, amount, type, purpose, ref], i) => {
  const time = dayjs(datetime).format('HH:mm');
  content += `- ${time} → ₹${amount} (${type}) — ${purpose}  \n`;
});

// ✍️ Save to Vault
fs.mkdirSync(vaultPath, { recursive: true }); // ensures folder exists
fs.writeFileSync(filePath, content);

console.log(`✅ Written to ${filePath}`);
