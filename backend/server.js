const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);

// CORS Ayarları - Tarayıcı engellerini kaldırmak için
app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, { cors: { origin: "*" } });

// 1. MONGODB BAĞLANTISI
// BURAYA KENDİ MONGODB ATLAS LİNKİNİ YAPIŞTIR
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
        user: 'guray.ozseker@outlook.com', // Kendi mailin
        pass: 'njtovqqvjtfdtqjy' // 16 haneli Uygulama Şifresi
    },
    tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
});

// --- API ENDPOINTS ---

// E-postaları Getir/Ekle
app.get('/api/settings/emails', async (req, res) => {
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});
app.post('/api/settings/emails', async (req, res) => {
    if(req.body.email) await new Setting({ type: 'email', value: req.body.email }).save();
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});

// Linkleri Getir/Ekle
app.get('/api/settings/links', async (req, res) => {
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});
app.post('/api/settings/links', async (req, res) => {
    if(req.body.link) await new Setting({ type: 'link', value: req.body.link }).save();
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});

// Eklenti İçin Ayarlar
app.get('/api/extension/config', async (req, res) => {
    const data = await Setting.find({ type: 'link' });
    res.json({ allowedLinks: data.map(d => d.value) });
});

// YENİ SİPARİŞ ALMA (EN ÖNEMLİ KISIM)
app.post('/api/new-order', async (req, res) => {
    try {
        const order = req.body;
        console.log("Yeni sipariş alındı:", order.customerName);

        // 1. Panele (Socket.io) Gönder
        io.emit('admin-new-order', order);

        // 2. Kayıtlı Maillere Gönder
        const targetEmails = await Setting.find({ type: 'email' });
        if (targetEmails.length > 0) {
            const mailOptions = {
                from: '"Sipariş Sistemi" <GURAY_MAIL_ADRESIN@outlook.com>',
                to: targetEmails.map(e => e.value).join(','),
                subject: `SİPARİŞ GELDİ: ${order.customerName}`,
                text: `Platform: ${order.platform}\nMüşteri: ${order.customerName}\nKod: ${order.orderCode}\nÜrünler: ${order.items}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.log("Mail Hatası:", error.message);
                else console.log("Mail Gönderildi: " + info.response);
            });
        }

        res.status(200).json({ status: "success" });
    } catch (err) {
        console.error("Sipariş işleme hatası:", err);
        res.status(500).json({ error: "Sistem hatası" });
    }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Backend ${PORT} portunda aktif.`));
