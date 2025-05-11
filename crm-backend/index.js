require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URL, {
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ✅ Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/messages', require('./routes/messagesRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard/revenue', require('./routes/revenueRoutes'));



// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
io._userSockets = new Map(); // email => [socketId, ...]

io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('register', (email) => {
    const existing = io._userSockets.get(email) || [];
    const updated = [...new Set([...existing, socket.id])]; // unique socket ids
    io._userSockets.set(email, updated);
    console.log(`📡 Registered ${email} with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
    for (const [email, socketList] of io._userSockets.entries()) {
      const filtered = socketList.filter((id) => id !== socket.id);
      if (filtered.length > 0) {
        io._userSockets.set(email, filtered);
      } else {
        io._userSockets.delete(email);
      }
    }
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
