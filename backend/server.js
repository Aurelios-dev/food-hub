const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);

// CORS Ayarları - En geniş kapsamlı hali
app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, { cors: { origin: "*" } });

// 1. MONGODB BAĞLANTISI (Linkini buraya yapıştır)
const mongoURI = 'mongodb+srv://food:mrygry4343@mith.0xx6gin.mongodb.net/?appName=Mith';
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Bağlantısı Başarılı!"))
    .catch(err => console.log("MongoDB Hatası:", err));

const SettingSchema = new mongoose.Schema({ type: String, value: String });
const Setting = mongoose.model('Setting', SettingSchema);

// 2. OUTLOOK MAIL AYARLARI
const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
        user: 'guray.ozseker@outlook.com',
        pass: 'flkwytmjhydxjgnj' // Normal şifre değil, App Password!
    },
    tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
});

// API ENDPOINTS
app.get('/api/settings/emails', async (req, res) => {
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});

app.post('/api/settings/emails', async (req, res) => {
    await new Setting({ type: 'email', value: req.body.email }).save();
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});

app.get('/api/settings/links', async (req, res) => {
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});

app.post('/api/settings/links', async (req, res) => {
    await new Setting({ type: 'link', value: req.body.link }).save();
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});

app.get('/api/extension/config', async (req, res) => {
    const data = await Setting.find({ type: 'link' });
    res.json({ allowedLinks: data.map(d => d.value) });
});

// YENİ SİPARİŞ GELİNCE
app.post('/api/new-order', async (req, res) => {
    const order = req.body;
    console.log("Sipariş alındı:", order.customerName);
    
    // Önce Panele Gönder (Socket.io)
    io.emit('admin-new-order', order);

    // Sonra Mail Gönder
    try {
        const emails = await Setting.find({ type: 'email' });
        if (emails.length > 0) {
            await transporter.sendMail({
                from: '"Sipariş Sistemi" <GURAY_MAIL_ADRESIN@outlook.com>',
                to: emails.map(e => e.value).join(','),
                subject: `YENİ SİPARİŞ: ${order.customerName}`,
                text: `Müşteri: ${order.customerName}\nÜrünler: ${order.items}\nKod: ${order.orderCode}`
            });
            console.log("Mail başarıyla gönderildi.");
        }
    } catch (error) {
        console.log("Mail gönderim hatası (İşleme devam ediliyor):", error.message);
    }
    
    res.json({ status: "success" });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Backend ${PORT} portunda aktif.`));
