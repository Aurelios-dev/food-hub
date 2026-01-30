const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

/* =======================
   APP & SOCKET
======================= */
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

/* =======================
   MONGODB CONNECTION
   (Node 22 uyumlu)
======================= */
mongoose.connect(
    'mongodb+srv://food:mrygry4343@mith.0xx6gin.mongodb.net/?appName=Mith'
)
.then(() => console.log("✅ MongoDB bağlantısı başarılı"))
.catch(err => console.error("❌ MongoDB bağlantı hatası:", err));

/* =======================
   SCHEMA
======================= */
const SettingSchema = new mongoose.Schema({
    type: { type: String, required: true },
    value: { type: String, required: true }
});

const Setting = mongoose.model('Setting', SettingSchema);

/* =======================
   GMAIL SMTP
   (APP PASSWORD)
======================= */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
        user: 'guray9307@gmail.com',
        pass: 'ulludglwkoyiroah'
    }
});

/* =======================
   SOCKET EVENTS
======================= */
io.on('connection', (socket) => {
    console.log('🟢 Socket bağlandı:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔴 Socket ayrıldı:', socket.id);
    });
});

/* =======================
   EMAIL ENDPOINTS
======================= */

// Email listele
app.get('/api/settings/emails', async (req, res) => {
    try {
        const emails = await Setting.find({ type: 'email' });
        res.json(emails.map(e => e.value));
    } catch {
        res.status(500).json([]);
    }
});

// Email ekle
app.post('/api/settings/emails', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json([]);

        await new Setting({ type: 'email', value: email }).save();
        const emails = await Setting.find({ type: 'email' });
        res.json(emails.map(e => e.value));
    } catch {
        res.status(500).json([]);
    }
});

// Email sil
app.delete('/api/settings/emails', async (req, res) => {
    try {
        const { email } = req.body;

        await Setting.deleteOne({ type: 'email', value: email });
        const emails = await Setting.find({ type: 'email' });
        res.json(emails.map(e => e.value));
    } catch {
        res.status(500).json([]);
    }
});

/* =======================
   LINK ENDPOINTS
======================= */

// Link listele
app.get('/api/settings/links', async (req, res) => {
    try {
        const links = await Setting.find({ type: 'link' });
        res.json(links.map(l => l.value));
    } catch {
        res.status(500).json([]);
    }
});

// Link ekle
app.post('/api/settings/links', async (req, res) => {
    try {
        const { link } = req.body;
        if (!link) return res.status(400).json([]);

        await new Setting({ type: 'link', value: link }).save();
        const links = await Setting.find({ type: 'link' });
        res.json(links.map(l => l.value));
    } catch (err) {
        console.error("Link ekleme hatası:", err);
        res.status(500).json([]);
    }
});

// Link sil
app.delete('/api/settings/links', async (req, res) => {
    try {
        const { link } = req.body;

        await Setting.deleteOne({ type: 'link', value: link });
        const links = await Setting.find({ type: 'link' });
        res.json(links.map(l => l.value));
    } catch {
        res.status(500).json([]);
    }
});

/* =======================
   NEW ORDER
======================= */
app.post('/api/new-order', async (req, res) => {
    try {
        const order = req.body;

        // Socket ile admin panel
        io.emit('admin-new-order', order);

        // Mail gönder
        const emails = await Setting.find({ type: 'email' });

        if (emails.length > 0) {
            const mailOptions = {
                from: `"Sipariş Botu" <seninmail@gmail.com>`,
                to: emails.map(e => e.value).join(','),
                subject: `🛒 YENİ SİPARİŞ - ${order.customerName}`,
                text: `
Platform     : ${order.platform}
Müşteri      : ${order.customerName}
Ürünler      : ${order.items}
Sipariş Kodu : ${order.orderCode}
                `
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) console.error("❌ Mail hatası:", err);
                else console.log("✅ Mail gönderildi");
            });
        }

        res.json({ status: "success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error" });
    }
});

/* =======================
   SERVER START
======================= */
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
});

