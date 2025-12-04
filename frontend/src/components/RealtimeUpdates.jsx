import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socket from '../services/socket';

export default function RealtimeUpdates() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect to WebSocket
    socket.connect();

    // Listen for real-time events
    socket.on('transaction:new', (transaction) => {
      console.log('New transaction:', transaction);
      dispatch({ type: 'transactions/addTransaction', payload: transaction });
    });

    socket.on('invoice:updated', (invoice) => {
      console.log('Invoice updated:', invoice);
      dispatch({ type: 'invoices/updateInvoice', payload: invoice });
    });

    socket.on('balance:updated', (balance) => {
      console.log('Balance updated:', balance);
      dispatch({ type: 'accounts/updateBalance', payload: balance });
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  return null; // This is a background component
}
