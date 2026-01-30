const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

/* =======================
   APP & SOCKET SETUP
======================= */
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

/* =======================
   MONGODB CONNECTION
======================= */
mongoose.connect(
    'mongodb+srv://food:mrygry4343@mith.0xx6gin.mongodb.net/?appName=Mith',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)
.then(() => {
    console.log("✅ MongoDB bağlantısı başarılı");
})
.catch((err) => {
    console.error("❌ MongoDB bağlantı hatası:", err);
});

/* =======================
   DATABASE SCHEMAS
======================= */
const SettingSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    }
});

const Setting = mongoose.model('Setting', SettingSchema);

/* =======================
   GMAIL SMTP SETUP
   (APP PASSWORD ŞART)
======================= */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'guray9307@gmail.com',     // GMAIL ADRESİN
        pass: 'ulludglwkoyiroah'       // 16 HANELİ APP PASSWORD
    }
});

/* =======================
   SOCKET.IO EVENTS
======================= */
io.on('connection', (socket) => {
    console.log('🟢 Admin bağlandı:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔴 Admin ayrıldı:', socket.id);
    });
});

/* =======================
   API ROUTES
======================= */

// Kayıtlı email listesi
app.get('/api/settings/emails', async (req, res) => {
    try {
        const emails = await Setting.find({ type: 'email' });
        res.json(emails.map(e => e.value));
    } catch (err) {
        res.status(500).json({ error: 'Email listesi alınamadı' });
    }
});

// Yeni email ekleme
app.post('/api/settings/emails', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email gerekli' });
        }

        await new Setting({
            type: 'email',
            value: email
        }).save();

        const emails = await Setting.find({ type: 'email' });
        res.json(emails.map(e => e.value));
    } catch (err) {
        res.status(500).json({ error: 'Email eklenemedi' });
    }
});

// Yeni sipariş
app.post('/api/new-order', async (req, res) => {
    try {
        const order = req.body;

        // Socket ile admin paneline gönder
        io.emit('admin-new-order', order);

        // Email gönderilecek adresler
        const targetEmails = await Setting.find({ type: 'email' });

        if (targetEmails.length > 0) {
            const mailOptions = {
                from: `"Sipariş Botu" <seninmail@gmail.com>`,
                to: targetEmails.map(e => e.value).join(','),
                subject: `🛒 YENİ SİPARİŞ - ${order.customerName}`,
                text: `
YENİ SİPARİŞ ALINDI

Platform     : ${order.platform}
Müşteri      : ${order.customerName}
Ürünler      : ${order.items}
Sipariş Kodu : ${order.orderCode}
                `
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    console.error("❌ Mail gönderme hatası:", err);
                } else {
                    console.log("✅ Mail başarıyla gönderildi");
                }
            });
        }

        res.json({ status: "success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sipariş işlenemedi' });
    }
});

/* =======================
   SERVER START
======================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
});
