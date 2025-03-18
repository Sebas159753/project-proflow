import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import type { User } from '@shared/schema';
import { useWebSocket } from '@/hooks/use-websocket';

interface PostIt {
  id: string;
  text: string;
  completed: boolean;
  creator: {
    id: number;
    name: string;
  };
  timestamp: string;
}

interface PostItPanelProps {
  currentUser: User;
}

export function PostItPanel({ currentUser }: PostItPanelProps) {
  const [notes, setNotes] = useState<PostIt[]>([]);
  const [newNote, setNewNote] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sendMessage, socket } = useWebSocket(currentUser.id, currentUser.name);

  useEffect(() => {
    // Función para manejar mensajes recibidos
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Mensaje recibido en PostItPanel:', data.type, data);

        switch (data.type) {
          case 'NOTE_UPDATE':
            console.log('Actualizando notas con:', data.payload);
            setNotes(data.payload || []);
            break;
          case 'PING':
            console.log('Ping recibido del servidor');
            break;
        }
      } catch (error) {
        console.error('Error procesando mensaje:', error);
      }
    };

    if (socket.current) {
      socket.current.addEventListener('message', handleMessage);

      // Solicitar notas existentes al conectar
      if (socket.current.readyState === WebSocket.OPEN) {
        console.log('Solicitando notas existentes');
        socket.current.send(JSON.stringify({
          type: 'USER_CONNECTED',
          sender: { id: currentUser.id, name: currentUser.name },
          timestamp: new Date().toISOString()
        }));
      }
    }

    return () => {
      if (socket.current) {
        socket.current.removeEventListener('message', handleMessage);
      }
    };
  }, [socket, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: PostIt = {
      id: crypto.randomUUID(),
      text: newNote,
      completed: false,
      creator: {
        id: currentUser.id,
        name: currentUser.name
      },
      timestamp: new Date().toISOString()
    };

    console.log('Enviando actualización de notas:', [...notes, note]);

    sendMessage({
      type: 'NOTE_UPDATE',
      payload: [...notes, note],
      sender: { id: currentUser.id, name: currentUser.name },
      timestamp: note.timestamp
    });

    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    console.log('Enviando actualización después de eliminar:', updatedNotes);

    sendMessage({
      type: 'NOTE_UPDATE',
      payload: updatedNotes,
      sender: { id: currentUser.id, name: currentUser.name },
      timestamp: new Date().toISOString()
    });
  };

  const handleToggleComplete = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, completed: !note.completed } : note
    );
    console.log('Enviando actualización después de toggle:', updatedNotes);

    sendMessage({
      type: 'NOTE_UPDATE',
      payload: updatedNotes,
      sender: { id: currentUser.id, name: currentUser.name },
      timestamp: new Date().toISOString()
    });
  };

  return (
    <Card className="w-80 h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Panel de Notas</h2>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="relative group"
            >
              <Card
                className={`p-3 transition-all ${
                  note.completed ? 'bg-gray-100 text-gray-500' : 'bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium">{note.creator.name}</p>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleToggleComplete(note.id)}
                    >
                      <Check className={`h-4 w-4 ${note.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className={`text-sm ${note.completed ? 'line-through' : ''}`}>{note.text}</p>
                <span className="text-xs text-gray-500 mt-2 block">
                  {new Date(note.timestamp).toLocaleTimeString()}
                </span>
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddNote();
          }}
          className="flex gap-2"
        >
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Escribe una nota..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}