const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

let verifiedEmails = []; 
let activeLinks = [];    

app.get('/api/settings/emails', (req, res) => res.json(verifiedEmails));
app.post('/api/settings/emails', (req, res) => {
    const { email } = req.body;
    if (email && !verifiedEmails.includes(email)) verifiedEmails.push(email);
    res.json(verifiedEmails);
});
app.delete('/api/settings/emails', (req, res) => {
    const { email } = req.body;
    verifiedEmails = verifiedEmails.filter(e => e !== email);
    res.json(verifiedEmails);
});

app.get('/api/settings/links', (req, res) => res.json(activeLinks));
app.post('/api/settings/links', (req, res) => {
    const { link } = req.body;
    if (link && !activeLinks.includes(link)) activeLinks.push(link);
    res.json(activeLinks);
});
app.delete('/api/settings/links', (req, res) => {
    const { link } = req.body;
    activeLinks = activeLinks.filter(l => l !== link);
    res.json(activeLinks);
});

app.get('/api/extension/config', (req, res) => res.json({ allowedLinks: activeLinks }));

app.post('/api/new-order', (req, res) => {
    io.emit('admin-new-order', req.body);
    res.json({ status: "success" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend ${PORT} portunda hazir!`));