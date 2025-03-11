import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { TaskStatus, type Task, type User, TaskPriority } from "@shared/schema";
import { PomodoroTimer } from "../pomodoro/pomodoro-timer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface TaskCardProps {
  task: Task;
  users: User[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case TaskPriority.URGENT:
      return "bg-red-100 text-red-800 hover:bg-red-100/80";
    case TaskPriority.HIGH:
      return "bg-orange-100 text-orange-800 hover:bg-orange-100/80";
    case TaskPriority.MEDIUM:
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
    case TaskPriority.LOW:
      return "bg-green-100 text-green-800 hover:bg-green-100/80";
    default:
      return "";
  }
};

export function TaskCard({ task, users }: TaskCardProps) {
  const [showPomodoro, setShowPomodoro] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const assignedUsers = users.filter(user => 
    task.assignedUserIds.includes(user.id)
  );

  const handlePomodoroComplete = () => {
    // Actualizar el progreso de la tarea aquí si lo deseas
  };

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/tasks/${task.id}`);

      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "¡Éxito!",
        description: "Tarea eliminada correctamente",
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la tarea"
      });
    }
  };

  // Por ahora usaremos el primer usuario asignado como el usuario activo
  const activeUserId = task.assignedUserIds[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="transform transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{task.title}</h3>
              <Badge 
                variant="secondary" 
                className={`${getPriorityColor(task.priority)} transition-colors duration-200`}
              >
                {task.priority}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors duration-200"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {task.description}
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progreso</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="transition-all duration-500" />
            </div>

            {task.status === TaskStatus.IN_PROGRESS && (
              <div className="space-y-2">
                {!showPomodoro ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full transition-colors duration-200"
                    onClick={() => setShowPomodoro(true)}
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Iniciar Pomodoro
                  </Button>
                ) : (
                  <PomodoroTimer 
                    taskId={task.id} 
                    userId={activeUserId}
                    onComplete={handlePomodoroComplete} 
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {assignedUsers.map(user => (
                  <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(task.dueDate), 'MMM d')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}