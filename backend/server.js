const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// 1. MONGODB BAĞLANTISI (Linkini kontrol et!)
mongoose.connect('mongodb+srv://food:mrygry4343@mith.0xx6gin.mongodb.net/?appName=Mith')
    .then(() => console.log("MongoDB Bağlantısı Başarılı!"))
    .catch(err => console.log("MongoDB Hatası:", err));

// Veritabanı Şeması (Hem email hem link için)
const SettingSchema = new mongoose.Schema({ 
    type: { type: String, required: true }, // 'email' veya 'link'
    value: { type: String, required: true } 
});
const Setting = mongoose.model('Setting', SettingSchema);

// 2. OUTLOOK MAIL AYARLARI
const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: {
        user: 'guray.ozseker@outlook.com',
        pass: 'ynmxkbevqoqmepwi'
    },
    tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
});

// --- API ENDPOINTS ---

// E-POSTA İŞLEMLERİ
app.get('/api/settings/emails', async (req, res) => {
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});

app.post('/api/settings/emails', async (req, res) => {
    if (req.body.email) {
        await new Setting({ type: 'email', value: req.body.email }).save();
    }
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});

app.delete('/api/settings/emails', async (req, res) => {
    await Setting.deleteOne({ type: 'email', value: req.body.email });
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});

// LİNK İŞLEMLERİ (BURASI EKSİKTİ)
app.get('/api/settings/links', async (req, res) => {
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});

app.post('/api/settings/links', async (req, res) => {
    if (req.body.link) {
        await new Setting({ type: 'link', value: req.body.link }).save();
    }
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});

app.delete('/api/settings/links', async (req, res) => {
    await Setting.deleteOne({ type: 'link', value: req.body.link });
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});

// EKLENTİ İÇİN CONFIG
app.get('/api/extension/config', async (req, res) => {
    const data = await Setting.find({ type: 'link' });
    res.json({ allowedLinks: data.map(d => d.value) });
});

// YENİ SİPARİŞ GELİNCE
app.post('/api/new-order', async (req, res) => {
    const order = req.body;
    io.emit('admin-new-order', order);

    const targetEmails = await Setting.find({ type: 'email' });
    if (targetEmails.length > 0) {
        const mailOptions = {
            from: '"Sipariş Sistemi" <GURAY_MAIL_ADRESIN@outlook.com>',
            to: targetEmails.map(e => e.value).join(','),
            subject: `Yeni Sipariş: ${order.customerName}`,
            text: `Müşteri: ${order.customerName}\nÜrünler: ${order.items}\nKod: ${order.orderCode}`
        };
        transporter.sendMail(mailOptions).catch(err => console.log("Mail Hatası:", err));
    }
    res.json({ status: "success" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Sistem ${PORT} portunda hazir.`));
