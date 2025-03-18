import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { TaskStatus, type Task, type User, TaskPriority } from "@shared/schema";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { usePoints } from "@/hooks/use-points";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const EMOJIS = ["🎉", "🎊", "✨", "🌟", "💫", "🎯"];

export function TaskCard({ task, users }: TaskCardProps) {
  const [progress, setProgress] = useState(task.progress);
  const [status, setStatus] = useState(task.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { awardPoints } = usePoints();
  const { sendMessage } = useWebSocket();

  useEffect(() => {
    if (progress === 100 && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [progress]);

  const assignedUsers = users.filter(user =>
    task.assignedUserIds.includes(user.id)
  );

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: {
          status: newStatus,
          progress: newStatus === TaskStatus.COMPLETED ? 100 : progress
        }
      });

      const updatedTask = await response.json();
      setStatus(newStatus);
      if (newStatus === TaskStatus.COMPLETED) {
        setProgress(100);
      }

      // Notificar a otros usuarios sobre el cambio
      sendMessage({
        type: 'TASK_UPDATE',
        payload: updatedTask,
        sender: {
          id: task.assignedUserIds[0],
          name: assignedUsers[0]?.name || 'Usuario'
        },
        timestamp: new Date().toISOString()
      });

      // Si la tarea se completó, otorgar puntos
      if (newStatus === TaskStatus.COMPLETED) {
        const userId = task.assignedUserIds[0];
        if (userId) {
          await awardPoints(task, userId);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "¡Éxito!",
        description: "Estado actualizado correctamente",
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado"
      });
      setStatus(task.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProgressChange = async (newValue: number[]) => {
    const progressValue = newValue[0];
    setIsUpdating(true);

    try {
      const response = await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: {
          progress: progressValue,
          status: progressValue === 100 ? TaskStatus.COMPLETED : status
        }
      });

      const updatedTask = await response.json();
      setProgress(progressValue);

      // Notificar a otros usuarios sobre el cambio
      sendMessage({
        type: 'TASK_UPDATE',
        payload: updatedTask,
        sender: { 
          id: task.assignedUserIds[0], 
          name: assignedUsers[0]?.name || 'Usuario' 
        },
        timestamp: new Date().toISOString()
      });

      // Si el progreso llegó al 100%, otorgar puntos
      if (progressValue === 100) {
        const userId = task.assignedUserIds[0];
        if (userId) {
          await awardPoints(task, userId);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "¡Éxito!",
        description: "Progreso actualizado correctamente",
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el progreso"
      });
      setProgress(task.progress);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "¡Éxito!",
        description: "Tarea eliminada correctamente",
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      console.error('Error al eliminar la tarea:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la tarea"
      });
    }
  };

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
                <span>Estado</span>
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus).map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {statusOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="transition-all duration-500" />
                <Slider
                  value={[progress]}
                  max={100}
                  step={25}
                  className="cursor-pointer"
                  onValueChange={handleProgressChange}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Asignado a: {assignedUsers.map(user => user.name).join(', ')}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(task.dueDate), 'MMM d')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
            {EMOJIS.map((emoji, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  scale: 0,
                  y: 100,
                  x: Math.random() * 200 - 100
                }}
                animate={{
                  opacity: 1,
                  scale: [1, 1.5, 1],
                  y: [-20, -40, -60],
                  x: [Math.random() * 200 - 100, Math.random() * 300 - 150]
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  y: -100
                }}
                transition={{
                  duration: 2,
                  delay: index * 0.2,
                  ease: "easeOut"
                }}
                className="absolute text-4xl"
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}