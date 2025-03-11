import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { TaskStatus, type Task, type User, TaskPriority } from "@shared/schema";
import { PomodoroTimer } from "../pomodoro/pomodoro-timer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Trash2, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { EditTaskDialog } from "../dialogs/edit-task-dialog";
import { usePoints } from "@/hooks/use-points";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";


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
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [progress, setProgress] = useState(task.progress);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { awardPoints } = usePoints();

  useEffect(() => {
    if (progress === 100 && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000); // Hide after 3 seconds
    }
  }, [progress]);

  const assignedUsers = users.filter(user =>
    task.assignedUserIds.includes(user.id)
  );

  const handleProgressChange = async (newValue: number[]) => {
    const progressValue = newValue[0];
    setProgress(progressValue);
    setIsUpdating(true);

    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: {
          progress: progressValue,
          status: progressValue === 100 ? TaskStatus.COMPLETED : task.status
        }
      });

      // Si la tarea se completó, otorgar puntos al usuario asignado
      if (progressValue === 100 && task.status !== TaskStatus.COMPLETED) {
        const userId = task.assignedUserIds[0]; // Por ahora usamos el primer usuario asignado
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el progreso"
      });
      setProgress(task.progress); // Revertir al valor original si hay error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      // Actualizar el caché de las tareas después de eliminar
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada correctamente",
        variant: "default",
      });
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    }
  };

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
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-colors duration-200"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors duration-200"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {task.description}
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="transition-all duration-500" />
                <Slider
                  defaultValue={[progress]}
                  max={100}
                  step={25}
                  className="cursor-pointer"
                  onValueChange={handleProgressChange}
                  disabled={isUpdating}
                />
              </div>
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
                    onComplete={handleProgressChange}
                  />
                )}
              </div>
            )}

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

      <EditTaskDialog
        task={task}
        users={users}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogHeader>
          <DialogTitle>Eliminar Tarea</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <DialogDescription>
          ¿Estás seguro de que deseas eliminar la tarea "{task.title}"? Esta acción no se puede deshacer.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDeleteTask}>
            Eliminar
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}