import { TaskCard } from "./task-card";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TaskStatus, TaskPriority, type Task, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Fuse from 'fuse.js';
import { useWebSocket } from "@/hooks/use-websocket";

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
}

// Definir el orden específico de las columnas
const columns = [
  { id: TaskStatus.TODO, title: "To-Do", className: "bg-blue-25 text-white" },
  { id: TaskStatus.IN_PROGRESS, title: "On Progress", className: "bg-blue-25 text-white" },
  { id: TaskStatus.REVIEW, title: "Under Review", className: "bg-blue-25 text-white" },
  { id: TaskStatus.COMPLETED, title: "Completed", className: "bg-blue-900 text-white" }
];

// Orden de prioridades para el ordenamiento
const priorityOrder = {
  [TaskPriority.URGENT]: 0,
  [TaskPriority.HIGH]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.LOW]: 3,
};

export function KanbanBoard({ tasks, users }: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { sendMessage } = useWebSocket();

  // Configurar Fuse.js para búsqueda difusa
  const fuse = useMemo(() => new Fuse(tasks, {
    keys: ['title', 'description'],
    threshold: 0.4,
    shouldSort: true
  }), [tasks]);

  // Filtrar tareas basado en la búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, tasks, fuse]);

  const getTasksByStatus = (status: string) => {
    // Filtrar tareas por estado y ordenar por prioridad
    return filteredTasks
      .filter(task => task.status === status)
      .sort((a, b) => {
        // Ordenar primero por prioridad
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Si tienen la misma prioridad, ordenar por fecha de vencimiento
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    try {
      const response = await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: {
          status: newStatus,
          progress: newStatus === TaskStatus.COMPLETED ? 100 : 0
        }
      });

      const updatedTask = await response.json();

      // Notificar a otros usuarios del cambio
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        sendMessage({
          type: 'TASK_UPDATE',
          payload: updatedTask,
          sender: {
            id: task.assignedUserIds[0],
            name: users.find(u => u.id === task.assignedUserIds[0])?.name || 'Usuario'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Actualizar la caché local
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "¡Tarea actualizada!",
        description: `Tarea movida a ${columns.find(col => col.id === newStatus)?.title}`,
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500"
        />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column, index) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`rounded-lg p-4 transition-all duration-300 hover:shadow-lg border-2 border-black ${column.className}`}
            >
              <h3 className={`font-semibold mb-4 flex items-center ${column.id === TaskStatus.COMPLETED ? 'text-white' : 'text-gray-800'}`}>
                {column.title}
                <span className={`ml-2 text-sm ${column.id === TaskStatus.COMPLETED ? 'text-white/70' : 'text-gray-600'}`}>
                  ({getTasksByStatus(column.id).length})
                </span>
              </h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-4 min-h-[200px]"
                  >
                    {getTasksByStatus(column.id).map((task, index) => (
                      <Draggable 
                        key={task.id} 
                        draggableId={task.id.toString()} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transform transition-transform ${
                              snapshot.isDragging ? "scale-105" : ""
                            }`}
                          >
                            <TaskCard task={task} users={users} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </motion.div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}