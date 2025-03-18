import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

// Tipos de mensajes
export type WebSocketMessage = {
  type: 'TASK_UPDATE' | 'CHAT_MESSAGE' | 'USER_CONNECTED';
  payload: any;
  sender: {
    id: number;
    name: string;
  };
  timestamp: string;
};

class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, { userId: number, userName: string }> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message) as WebSocketMessage;
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    // Registrar el cliente si es un mensaje de conexión inicial
    if (message.type === 'USER_CONNECTED') {
      this.clients.set(ws, {
        userId: message.sender.id,
        userName: message.sender.name
      });
    }

    // Broadcast el mensaje a todos los clientes excepto al remitente
    this.broadcast(message, ws);
  }

  private broadcast(message: WebSocketMessage, sender?: WebSocket) {
    this.wss.clients.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  public notifyTaskUpdate(taskData: any, sender: { id: number; name: string }) {
    const message: WebSocketMessage = {
      type: 'TASK_UPDATE',
      payload: taskData,
      sender,
      timestamp: new Date().toISOString()
    };
    this.broadcast(message);
  }
}

export default WebSocketHandler;