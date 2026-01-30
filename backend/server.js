const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, { cors: { origin: "*" } });

// MongoDB Bağlantısı
mongoose.connect('mongodb+srv://food:mrygry4343@mith.0xx6gin.mongodb.net/?appName=Mith')
    .then(() => console.log("MongoDB Bağlantısı Başarılı!"))
    .catch(err => console.log("MongoDB Hatası:", err));

const SettingSchema = new mongoose.Schema({ type: String, value: String });
const Setting = mongoose.model('Setting', SettingSchema);

// Outlook Mail Ayarları
const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
        user: 'guray.ozseker@outlook.com',
        pass: 'njtovqqvjtfdtqjy' // 16 haneli App Password
    },
    tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
});

// API Endpoints
app.get('/api/settings/emails', async (req, res) => {
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});
app.post('/api/settings/emails', async (req, res) => {
    if(req.body.email) await new Setting({ type: 'email', value: req.body.email }).save();
    const data = await Setting.find({ type: 'email' });
    res.json(data.map(d => d.value));
});
app.delete('/api/settings/emails', async (req, res) => {
    await Setting.deleteOne({ type: 'email', value: req.body.email });
    res.json({ status: "ok" });
});

app.get('/api/settings/links', async (req, res) => {
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});
app.post('/api/settings/links', async (req, res) => {
    if(req.body.link) await new Setting({ type: 'link', value: req.body.link }).save();
    const data = await Setting.find({ type: 'link' });
    res.json(data.map(d => d.value));
});
app.delete('/api/settings/links', async (req, res) => {
    await Setting.deleteOne({ type: 'link', value: req.body.link });
    res.json({ status: "ok" });
});

app.get('/api/extension/config', async (req, res) => {
    const data = await Setting.find({ type: 'link' });
    res.json({ allowedLinks: data.map(d => d.value) });
});

// Sipariş Alma ve Mail Tetikleme
app.post('/api/new-order', async (req, res) => {
    try {
        const order = req.body;
        console.log("Yeni sipariş geldi:", order.customerName);

        // 1. Panele anında gönder (Burası zaten çalışıyor)
        io.emit('admin-new-order', order);

        // 2. Mail Gönderimi (Hata korumalı)
        const emails = await Setting.find({ type: 'email' });
        if (emails.length > 0) {
            const mailList = emails.map(e => e.value).join(',');
            
            transporter.sendMail({
                from: '"Food Hub" <GURAY_MAIL_ADRESIN@outlook.com>',
                to: mailList,
                subject: `Sipariş Geldi: ${order.customerName}`,
                html: `
                    <h3>Yeni Sipariş Detayı</h3>
                    <p><b>Müşteri:</b> ${order.customerName}</p>
                    <p><b>Ürünler:</b> ${order.items}</p>
                    <p><b>Platform:</b> ${order.platform}</p>
                    <hr>
                    <p>Bu mail otomatik olarak gönderilmiştir.</p>
                `
            }, (error, info) => {
                if (error) console.log("Mail Hatası (Log):", error.message);
                else console.log("Mail Gönderildi (Log):", info.response);
            });
        }

        res.status(200).json({ status: "success" });
    } catch (err) {
        console.error("Genel Hata:", err);
        res.status(500).json({ error: "Sistem hatası" });
    }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Sistem aktif: ${PORT}`));

