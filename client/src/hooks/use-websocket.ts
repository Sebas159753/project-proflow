import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { WebSocketMessage } from '@server/websocket';

export function useWebSocket(userId: number, userName: string) {
  const socket = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket.current = new WebSocket(wsUrl);

    socket.current.onopen = () => {
      // Enviar mensaje de conexión inicial
      if (socket.current?.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({
          type: 'USER_CONNECTED',
          sender: { id: userId, name: userName },
          timestamp: new Date().toISOString()
        }));
      }
    };

    socket.current.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'TASK_UPDATE':
          // Refrescar los datos de las tareas
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          toast({
            title: 'Actualización de tarea',
            description: `${message.sender.name} ha actualizado una tarea`,
          });
          break;
        case 'CHAT_MESSAGE':
          // Manejar mensajes de chat (se implementará después)
          break;
      }
    };

    socket.current.onclose = () => {
      // Intentar reconectar después de un tiempo
      setTimeout(connect, 3000);
    };
  }, [userId, userName, queryClient, toast]);

  useEffect(() => {
    connect();
    return () => {
      socket.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(message));
    }
  }, []);

  return { sendMessage };
}
