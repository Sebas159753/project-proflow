import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

// Tipos de mensajes
export type WebSocketMessage = {
  type: 'TASK_UPDATE' | 'NOTE_UPDATE' | 'USER_CONNECTED' | 'PING';
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
    this.wss = new WebSocketServer({ server, path: '/socket' });
    console.log('WebSocket Server initialized at path: /socket');
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      // Evitar múltiples conexiones del mismo cliente
      const existingClient = Array.from(this.clients.entries())
        .find(([socket, client]) => 
          client.userId === this.clients.get(ws)?.userId && socket !== ws);
      
      if (existingClient) {
        console.log('Cliente existente reconectado, cerrando conexión anterior');
        existingClient[0].close();
        this.clients.delete(existingClient[0]);
      }
      
      console.log('Nueva conexión WebSocket establecida');

      // Send immediate ping to verify connection
      ws.send(JSON.stringify({
        type: 'PING',
        payload: 'connection-test',
        sender: { id: 0, name: 'server' },
        timestamp: new Date().toISOString()
      }));

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message) as WebSocketMessage;
          console.log('Mensaje recibido:', data.type, 'de:', data.sender.name);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('Error en la conexión WebSocket:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    // Registrar el cliente si es un mensaje de conexión inicial
    if (message.type === 'USER_CONNECTED') {
      console.log('Usuario conectado:', message.sender.name);
      this.clients.set(ws, {
        userId: message.sender.id,
        userName: message.sender.name
      });

      // Enviar las notas existentes al nuevo cliente
      console.log('Enviando notas existentes al nuevo cliente:', this.notes.length, 'notas');
      ws.send(JSON.stringify({
        type: 'NOTE_UPDATE',
        payload: this.notes,
        sender: { id: 0, name: 'server' },
        timestamp: new Date().toISOString()
      }));
    }
    // Manejar actualizaciones de notas
    else if (message.type === 'NOTE_UPDATE') {
      console.log('Actualización de notas recibida de:', message.sender.name);
      // Solo actualizar y transmitir si hay cambios reales
      if (JSON.stringify(this.notes) !== JSON.stringify(message.payload)) {
        console.log('Nuevas notas:', message.payload.length, 'notas');
        this.notes = message.payload; // Actualizar el estado de las notas
        this.broadcast(message); // Transmitir a todos los clientes
      }
    }
    // Responder al ping para verificar conexión
    else if (message.type === 'PING') {
      ws.send(JSON.stringify({
        type: 'PING',
        payload: 'pong',
        sender: { id: 0, name: 'server' },
        timestamp: new Date().toISOString()
      }));
    }
    // Manejar actualizaciones de tareas
    else if (message.type === 'TASK_UPDATE') {
      this.broadcast(message);
    }
  }

  private broadcast(message: WebSocketMessage) {
    console.log('Transmitiendo mensaje a todos los clientes. Tipo:', message.type);
    let clientCount = 0;
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        clientCount++;
      }
    });
    console.log(`Mensaje transmitido a ${clientCount} clientes`);
  }
}

export default WebSocketHandler;