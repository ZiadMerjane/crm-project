const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ✅ تخزين socket لكل مستخدم بالإيميل
const userSockets = new Map();
io.on('connection', (socket) => {
  console.log('🟢 New client connected');

  socket.on('register', (email) => {
    userSockets.set(email, socket.id);
    console.log(`✅ Registered ${email} → ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected');
    for (const [email, id] of userSockets.entries()) {
      if (id === socket.id) {
        userSockets.delete(email);
        break;
      }
    }
  });
});

// ✅ نضيف io & userSockets إلى app
io._userSockets = userSockets;
app.set('io', io);

// ✅ Middlewares
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ✅ Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/messages', require('./routes/messagesRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ✅ MongoDB + Server start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
