'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    // Now we use the same URL for both Next.js and Socket.IO
    const socketUrl = window.location.origin;
    console.log('Connecting to socket server at:', socketUrl);

    let socketInstance: Socket | null = null;
    
    const connectSocket = () => {
      // Clean up previous instance if exists
      if (socketInstance) {
        socketInstance.disconnect();
      }
      
      // Create socket connection with optimized configuration
      socketInstance = io(socketUrl, {
        auth: {
          userId: session.user.id,
        },
        // Use only websocket transport to avoid polling errors
        transports: ['websocket'],
        // Don't force new connection on reconnect
        forceNew: false,
        // Increase timeout
        timeout: 10000,
        // Reconnection settings
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        // Path must match the server configuration
        path: '/socket.io/',
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected successfully with ID:', socketInstance?.id);
        setIsConnected(true);
        setRetryCount(0); // Reset retry count on successful connection
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
        
        // Manual retry logic
        if (retryCount < 3) {
          console.log(`Retrying connection (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            connectSocket();
          }, 2000); // Wait 2 seconds before retrying
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        socketInstance.disconnect();
      }
    };
  }, [session, retryCount]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}