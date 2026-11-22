require('dotenv').config();
// Some networks block SRV DNS lookups; optional override for local dev
if (process.env.DNS_SERVERS) {
  require('node:dns').setServers(process.env.DNS_SERVERS.split(','));
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));

// http server (not app.listen) so Socket.IO can attach later
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`API on port ${PORT}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });


