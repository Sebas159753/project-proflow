import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import type { User } from '@shared/schema';
import { useWebSocket } from '@/hooks/use-websocket';

interface ChatMessage {
  id: string;
  text: string;
  sender: {
    id: number;
    name: string;
  };
  timestamp: string;
}

interface ChatPanelProps {
  currentUser: User;
}

export function ChatPanel({ currentUser }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sendMessage, socket } = useWebSocket(currentUser.id, currentUser.name);

  useEffect(() => {
    // Función para manejar mensajes recibidos
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.type === 'CHAT_MESSAGE') {
        setMessages(prev => [...prev, message.payload]);
      }
    };

    if (socket.current) {
      socket.current.addEventListener('message', handleMessage);
    }

    return () => {
      if (socket.current) {
        socket.current.removeEventListener('message', handleMessage);
      }
    };
  }, [socket]);

  useEffect(() => {
    // Scroll al último mensaje
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      text: newMessage,
      sender: {
        id: currentUser.id,
        name: currentUser.name
      },
      timestamp: new Date().toISOString()
    };

    sendMessage({
      type: 'CHAT_MESSAGE',
      payload: message,
      sender: { id: currentUser.id, name: currentUser.name },
      timestamp: message.timestamp
    });

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  return (
    <Card className="w-80 h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chat de Equipo</h2>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.sender.id === currentUser.id ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender.id === currentUser.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <p className="text-sm font-medium mb-1">{message.sender.name}</p>
                <p className="text-sm">{message.text}</p>
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}