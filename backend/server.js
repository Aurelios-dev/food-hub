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

// 1. MONGODB BAĞLANTISI (Kendi linkini buraya yapıştır)
mongoose.connect('mongodb+srv://food:mrygry4343@mith.0xx6gin.mongodb.net/?appName=Mith')
    .then(() => console.log("MongoDB Bağlantısı Başarılı!"))
    .catch(err => console.log("Bağlantı Hatası:", err));

// Veritabanı Şemaları
const SettingSchema = new mongoose.Schema({ type: String, value: String });
const Setting = mongoose.model('Setting', SettingSchema);

// 2. MAIL AYARLARI (Gmail kullanıyorsan "App Password" almalısın)
const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // Outlook SMTP sunucusu
    port: 587, // Güvenli bağlantı portu
    secure: false, // TLS kullanımı için false olmalı
    auth: {
        user: 'guray.ozseker@outlook.com', // Outlook adresin
        pass: 'mrygry4343' // Şifren
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false // Bağlantı reddini önlemek için
    }
});

// API Endpoints
app.get('/api/settings/emails', async (req, res) => {
    const emails = await Setting.find({ type: 'email' });
    res.json(emails.map(e => e.value));
});

app.post('/api/settings/emails', async (req, res) => {
    await new Setting({ type: 'email', value: req.body.email }).save();
    const emails = await Setting.find({ type: 'email' });
    res.json(emails.map(e => e.value));
});

app.post('/api/new-order', async (req, res) => {
    const order = req.body;
    io.emit('admin-new-order', order);

    // Gerçek Mail Gönderimi
    const targetEmails = await Setting.find({ type: 'email' });
    if (targetEmails.length > 0) {
        const mailOptions = {
            from: 'Sipariş Botu <SENIN_GMAIL_ADRESIN@gmail.com>',
            to: targetEmails.map(e => e.value).join(','),
            subject: `YENİ SİPARİŞ: ${order.customerName}`,
            text: `Platform: ${order.platform}\nMüşteri: ${order.customerName}\nÜrünler: ${order.items}\nKod: ${order.orderCode}`
        };
        transporter.sendMail(mailOptions, (err) => {
            if (err) console.log("Mail Hatası:", err);
            else console.log("Mail başarıyla gönderildi!");
        });
    }
    res.json({ status: "success" });
});

// Diğer endpoint'ler (links vb.) aynı mantıkla Schema'ya bağlanabilir.
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Sistem ${PORT} portunda yayında!`));
