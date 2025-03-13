
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { TaskStatus, type Task, type User, TaskPriority } from "@shared/schema";
import { PomodoroTimer } from "../pomodoro/pomodoro-timer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Trash2, Edit, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TaskEditDialog } from "./task-edit-dialog";

interface TaskCardProps {
  task: Task;
  users: User[];
}

export function TaskCard({ task, users }: TaskCardProps) {
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Log para depuración
  console.log("TaskCard - ID de tarea:", task.id);
  console.log("TaskCard - Usuarios disponibles:", users);
  console.log("TaskCard - IDs de usuarios asignados:", task.assignedUserIds);

  // Filtrar usuarios asignados
  const assignedUsers = users.filter(user => 
    task.assignedUserIds.includes(user.id)
  );
  console.log("TaskCard - Usuarios asignados filtrados:", assignedUsers);

  // Función para eliminar tarea
  const handleDeleteTask = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la tarea");
      }

      // Actualizar caché
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada correctamente",
        variant: "default"
      });
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive"
      });
    }
  };

  // Función para marcar tarea como completada
  const handleCompleteTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: TaskStatus.COMPLETED,
          progress: 100
        }),
      });

      if (!response.ok) {
        throw new Error("Error al completar la tarea");
      }

      // Actualizar caché
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "¡Tarea completada!",
        description: "La tarea ha sido marcada como completada",
        variant: "success"
      });
    } catch (error) {
      console.error("Error al completar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la tarea",
        variant: "destructive"
      });
    }
  };

  // Determinar color para la badge de prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return "bg-red-500 hover:bg-red-600";
      case TaskPriority.HIGH:
        return "bg-orange-500 hover:bg-orange-600";
      case TaskPriority.MEDIUM:
        return "bg-blue-500 hover:bg-blue-600";
      case TaskPriority.LOW:
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-slate-500 hover:bg-slate-600";
    }
  };

  // Formatear fecha
  const formattedDate = task.dueDate 
    ? format(new Date(task.dueDate), "dd/MM/yyyy")
    : "Sin fecha";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300",
        task.status === TaskStatus.COMPLETED ? "bg-gray-100" : "bg-white"
      )}>
        <CardContent className="p-4">
          {/* Título y estado */}
          <div className="mb-2">
            <h3 className="font-semibold text-base truncate">{task.title}</h3>
          </div>
          
          {/* Descripción */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
          
          {/* Prioridad y Fecha */}
          <div className="flex justify-between items-center mb-3">
            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            <span className="text-xs text-gray-500 flex items-center">
              {formattedDate}
            </span>
          </div>
          
          {/* Barra de progreso */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Progreso</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
          
          {/* Acciones */}
          <div className="flex justify-between mt-4">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center"
                onClick={() => setShowPomodoro(!showPomodoro)}
              >
                <Timer className="h-4 w-4 mr-1" />
                <span className="text-xs">Pomodoro</span>
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50"
                onClick={handleCompleteTask}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleDeleteTask}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Pomodoro Timer */}
          {showPomodoro && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <PomodoroTimer 
                taskId={task.id}
                pomodoroDuration={task.pomodoroDuration} 
                shortBreakDuration={task.shortBreakDuration}
                longBreakDuration={task.longBreakDuration}
              />
            </div>
          )}
          
          {/* Diálogo para editar la tarea */}
          {showEditDialog && (
            <TaskEditDialog
              task={task}
              isOpen={showEditDialog}
              onClose={() => setShowEditDialog(false)}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
