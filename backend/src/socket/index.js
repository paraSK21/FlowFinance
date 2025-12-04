const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);

      // Track user's sockets
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set());
      }
      this.userSockets.get(socket.userId).add(socket.id);

      // Join user's personal room
      socket.join(`user:${socket.userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        const userSocketSet = this.userSockets.get(socket.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(socket.userId);
          }
        }
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    console.log('WebSocket server initialized');
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  // Emit to all connected clients
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Transaction events
  emitTransactionCreated(userId, transaction) {
    this.emitToUser(userId, 'transaction:created', {
      type: 'transaction:created',
      data: transaction,
      timestamp: new Date(),
    });
  }

  emitTransactionUpdated(userId, transaction) {
    this.emitToUser(userId, 'transaction:updated', {
      type: 'transaction:updated',
      data: transaction,
      timestamp: new Date(),
    });
  }

  emitTransactionsSynced(userId, count) {
    this.emitToUser(userId, 'transactions:synced', {
      type: 'transactions:synced',
      data: { count },
      timestamp: new Date(),
    });
  }

  // Invoice events
  emitInvoiceCreated(userId, invoice) {
    this.emitToUser(userId, 'invoice:created', {
      type: 'invoice:created',
      data: invoice,
      timestamp: new Date(),
    });
  }

  emitInvoiceUpdated(userId, invoice) {
    this.emitToUser(userId, 'invoice:updated', {
      type: 'invoice:updated',
      data: invoice,
      timestamp: new Date(),
    });
  }

  emitInvoicePaid(userId, invoice) {
    this.emitToUser(userId, 'invoice:paid', {
      type: 'invoice:paid',
      data: invoice,
      timestamp: new Date(),
    });
  }

  // Inventory events
  emitInventoryUpdated(userId, item) {
    this.emitToUser(userId, 'inventory:updated', {
      type: 'inventory:updated',
      data: item,
      timestamp: new Date(),
    });
  }

  emitLowStockAlert(userId, item) {
    this.emitToUser(userId, 'inventory:low-stock', {
      type: 'inventory:low-stock',
      data: item,
      timestamp: new Date(),
    });
  }

  // Notification events
  emitNotification(userId, notification) {
    this.emitToUser(userId, 'notification', {
      type: 'notification',
      data: notification,
      timestamp: new Date(),
    });
  }

  // Balance update
  emitBalanceUpdated(userId, balance) {
    this.emitToUser(userId, 'balance:updated', {
      type: 'balance:updated',
      data: balance,
      timestamp: new Date(),
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.userSockets.has(userId);
  }
}

module.exports = new SocketService();
