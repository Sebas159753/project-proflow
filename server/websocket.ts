import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

// Tipos de mensajes
export type WebSocketMessage = {
  type: 'TASK_UPDATE' | 'NOTE_UPDATE' | 'USER_CONNECTED';
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
  private notes: any[] = []; // Almacenar las notas en memoria

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
      // Enviar las notas existentes al nuevo cliente
      if (this.notes.length > 0) {
        ws.send(JSON.stringify({
          type: 'NOTE_UPDATE',
          payload: this.notes,
          sender: message.sender,
          timestamp: new Date().toISOString()
        }));
      }
    }
    // Manejar actualizaciones de notas
    else if (message.type === 'NOTE_UPDATE') {
      this.notes = message.payload; // Actualizar el estado de las notas
      this.broadcast(message); // Transmitir a todos los clientes
    }
    // Manejar actualizaciones de tareas
    else if (message.type === 'TASK_UPDATE') {
      this.broadcast(message);
    }
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