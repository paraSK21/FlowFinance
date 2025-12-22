import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    this.socket = io('http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Transaction events
    this.socket.on('transaction:created', (data) => {
      console.log('New transaction:', data);
      toast.success('New transaction synced!');
      this.emit('transaction:created', data);
    });

    this.socket.on('transaction:updated', (data) => {
      console.log('Transaction updated:', data);
      this.emit('transaction:updated', data);
    });

    this.socket.on('transactions:synced', (data) => {
      console.log('Transactions synced:', data);
      toast.success(`${data.data.count} transactions synced!`);
      this.emit('transactions:synced', data);
    });

    // Invoice events
    this.socket.on('invoice:created', (data) => {
      console.log('Invoice created:', data);
      toast.success('Invoice created!');
      this.emit('invoice:created', data);
    });

    this.socket.on('invoice:updated', (data) => {
      console.log('Invoice updated:', data);
      this.emit('invoice:updated', data);
    });

    this.socket.on('invoice:paid', (data) => {
      console.log('Invoice paid:', data);
      toast.success(`Invoice ${data.data.invoiceNumber} paid!`, {
        icon: '💰',
        duration: 5000,
      });
      this.emit('invoice:paid', data);
    });

    // Balance updates
    this.socket.on('balance:updated', (data) => {
      console.log('Balance updated:', data);
      this.emit('balance:updated', data);
    });

    // Generic notifications
    this.socket.on('notification', (data) => {
      console.log('Notification:', data);
      toast(data.data.message, {
        icon: data.data.icon || '🔔',
        duration: 4000,
      });
      this.emit('notification', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event emitter for React components
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Send events to server
  send(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  // Check connection status
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

export default new SocketService();
