import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { WebSocketMessage } from '@server/websocket';

export function useWebSocket(userId?: number, userName?: string) {
  const socket = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/socket`;

    console.log('Intentando conectar al WebSocket:', wsUrl);
    socket.current = new WebSocket(wsUrl);

    socket.current.onopen = () => {
      console.log('Conexión WebSocket establecida');
      // Enviar mensaje de conexión inicial si tenemos información del usuario
      if (userId && userName && socket.current?.readyState === WebSocket.OPEN) {
        const initialMessage = {
          type: 'USER_CONNECTED',
          sender: { id: userId, name: userName },
          timestamp: new Date().toISOString()
        };
        console.log('Enviando mensaje de conexión inicial:', initialMessage);
        socket.current.send(JSON.stringify(initialMessage));

        // Send ping to verify connection - Now with a longer interval
        const pingInterval = setInterval(() => {
          if (socket.current?.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({
              type: 'PING',
              payload: 'ping',
              sender: { id: userId, name: userName },
              timestamp: new Date().toISOString()
            }));
          }
        }, 120000); // Ping every 2 minutes

        //Clean up interval on close
        socket.current.onclose = () => {clearInterval(pingInterval)};

      }
    };

    socket.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('Mensaje WebSocket recibido:', message.type);

        switch (message.type) {
          case 'PING':
            console.log('Ping-pong message received:', message.payload);
            break;
          case 'NOTE_UPDATE':
            console.log('Actualización de notas recibida:', message.payload?.length, 'notas');
            // La actualización real se maneja en el componente PostItPanel
            if (message.sender.id !== userId) {
              toast({
                title: 'Actualización de notas',
                description: `${message.sender.name} ha actualizado el panel de notas`,
              });
            }
            break;
          case 'TASK_UPDATE':
            console.log('Actualización de tarea recibida');
            queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            if (message.sender.id !== userId) {
              toast({
                title: 'Actualización de tarea',
                description: `${message.sender.name} ha actualizado una tarea`,
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    socket.current.onclose = (event) => {
      console.log('Conexión WebSocket cerrada:', event.code, event.reason);
      // Intentar reconectar después de un tiempo
      setTimeout(() => {
        console.log('Intentando reconexión...');
        connect();
      }, 3000);
    };

    socket.current.onerror = (error) => {
      console.error('Error en la conexión WebSocket:', error);
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo establecer la conexión en tiempo real"
      });
    };
  }, [userId, userName, queryClient, toast]);

  useEffect(() => {
    connect();
    return () => {
      if (socket.current) {
        console.log('Cerrando conexión WebSocket...');
        socket.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (message: WebSocketMessage) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (socket.current?.readyState === WebSocket.OPEN) {
            console.log('Enviando mensaje WebSocket:', message.type, 'payload:', message.payload);
            socket.current.send(JSON.stringify(message));
          } else {
            console.warn('WebSocket no está conectado, intentando reconectar...');
            connect();
          }
        }, 300);
      };
    })(),
    [connect]
  );

  return { sendMessage, socket };
}