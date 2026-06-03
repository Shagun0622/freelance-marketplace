const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');  

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gigs');
const proposalRoutes = require('./routes/proposals');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const currencyRoutes = require('./routes/currency');
const razorpayRoutes = require('./routes/razorpay');
const paymentRoutes = require('./routes/payments');  // ← ADD THIS
const passport = require('passport');
const googleAuthRoutes = require('./routes/googleAuth');
const twoFactorRoutes = require('./routes/twoFactor');
const aiMatchingRoutes = require('./routes/aiMatching');
const reviewRoutes = require('./routes/reviews');
const disputeRoutes = require('./routes/disputes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/payments', paymentRoutes);  // ← ADD THIS
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/ai', aiMatchingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);  // ← ADD THIS LINE
// Test route
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

// Initialize Passport
app.use(passport.initialize());

// Use Google auth routes
app.use('/api/auth', googleAuthRoutes);

// Socket.IO connection handling
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

// Socket.IO connection handling with better error messages
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    console.log('🔐 Socket auth - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
        console.error('❌ Socket auth failed: No token provided');
        return next(new Error('Authentication error: No token provided'));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        console.log('✅ Socket auth successful for user:', socket.userId);
        next();
    } catch (err) {
        console.error('❌ Socket auth failed:', err.message);
        next(new Error('Invalid token: ' + err.message));
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    // Join user's personal room
    socket.join(`user_${socket.userId}`);
    
    // Handle sending messages
    socket.on('send_message', async (data) => {
        try {
            const { conversationId, receiverId, message, gigId } = data;
            
            // Save message to database
            const newMessage = new Message({
                conversationId,
                senderId: socket.userId,
                receiverId,
                message,
                read: false
            });
            await newMessage.save();
            
            // Populate sender info
            await newMessage.populate('senderId', 'name email role');
            
            // Update conversation
            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: message,
                lastMessageTime: new Date(),
                updatedAt: new Date()
            });
            
            // Emit to receiver
            io.to(`user_${receiverId}`).emit('receive_message', {
                message: newMessage,
                conversationId
            });
            
            // Emit back to sender for confirmation
            socket.emit('message_sent', newMessage);
            
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
        }
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
        const { receiverId, conversationId, isTyping } = data;
        socket.to(`user_${receiverId}`).emit('user_typing', {
            conversationId,
            userId: socket.userId,
            isTyping
        });
    });
    
    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
        const { conversationId, senderId } = data;
        await Message.updateMany(
            { conversationId, senderId, receiverId: socket.userId, read: false },
            { read: true, readAt: new Date() }
        );
        io.to(`user_${senderId}`).emit('messages_read', { conversationId });
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
    });
});

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
});