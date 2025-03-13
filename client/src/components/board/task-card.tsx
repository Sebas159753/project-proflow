import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { TaskStatus, type Task, type User, TaskPriority } from "@shared/schema";
import { PomodoroTimer } from "../pomodoro/pomodoro-timer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Trash2, Edit, Save, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePoints } from "@/hooks/use-points";
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { awardPoints } = usePoints();

  useEffect(() => {
    if (progress === 100 && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000); // Hide after 3 seconds
    }
  }, [progress]);

  // Asegurarnos de que task.assignedUserIds es un array
  const assignedUsers = Array.isArray(users) && Array.isArray(task.assignedUserIds)
    ? users.filter(user => task.assignedUserIds.includes(user.id))
    : [];

  // Log para depuración
  useEffect(() => {
    console.log("TaskCard - ID de tarea:", task.id);
    console.log("TaskCard - Usuarios disponibles:", users);
    console.log("TaskCard - IDs de usuarios asignados:", task.assignedUserIds);
    console.log("TaskCard - Usuarios asignados filtrados:", assignedUsers);
  }, [task, users]);

  const handleProgressChange = async (value: number[]) => {
    const progressValue = value[0];
    if (progressValue === progress) return;

    setProgress(progressValue);
    setIsUpdating(true);

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: progressValue,
          status: progressValue === 100 ? TaskStatus.COMPLETED : task.status
        }),
        credentials: 'include'
      });

      // Si la tarea se completó, otorgar puntos al usuario asignado
      if (progressValue === 100 && task.status !== TaskStatus.COMPLETED) {
        awardPoints(10, 'Tarea completada');
      }

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error al actualizar el progreso:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el progreso de la tarea",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      await apiRequest('DELETE', `/api/tasks/${task.id}`);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });

      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada correctamente",
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

  // Iniciar edición
  const handleEditClick = () => {
    setEditedTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority
    });
    setIsEditing(true);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    setIsUpdating(true);

    try {
      // Preparar los datos
      const taskData = {
        ...editedTask,
        progress: progress
      };

      // Enviar al servidor
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
        credentials: 'include'
      });

      // Invalidar y refrescar la caché
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });

      toast({
        title: "Tarea actualizada",
        description: "Los cambios han sido guardados.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar la tarea:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al actualizar la tarea.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
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
              <div className="w-full">
                {!isEditing ? (
                  <h3 className="font-semibold">{task.title}</h3>
                ) : (
                  <Input
                    value={editedTask.title}
                    onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
                    className="mb-2"
                    placeholder="Título de la tarea"
                  />
                )}
              </div>
              <Badge
                variant="secondary"
                className={`${getPriorityColor(task.priority)} transition-colors duration-200`}
              >
                {task.priority}
              </Badge>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-all duration-200 transform hover:scale-105"
                  onClick={handleEditClick}
                  title="Editar tarea"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-500 hover:text-green-700 hover:bg-green-100"
                    onClick={handleSaveEdit}
                    disabled={isUpdating}
                    title="Guardar cambios"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={handleCancelEdit}
                    title="Cancelar edición"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors duration-200"
                onClick={handleDeleteTask}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              {!isEditing ? (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              ) : (
                <Input
                  value={editedTask.description}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
                  className="mb-2"
                  placeholder="Descripción de la tarea"
                />
              )}
            </div>


            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span>Progreso: {progress}%</span>
              </div>
              <Slider
                defaultValue={[progress]}
                max={100}
                step={10}
                onValueChange={handleProgressChange}
                className={cn(
                  "cursor-pointer transition-opacity duration-200",
                  isUpdating ? "opacity-50 pointer-events-none" : ""
                )}
                disabled={isUpdating}
              />
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
            {!isEditing ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Asignado a: {assignedUsers.map(user => user.name).join(', ')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(task.dueDate), 'MMM d')}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Status Select */}
                <Select
                  value={editedTask.status}
                  onValueChange={(value) => setEditedTask(prev => ({ ...prev, status: value as TaskStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority Select */}
                <Select
                  value={editedTask.priority}
                  onValueChange={(value) => setEditedTask(prev => ({ ...prev, priority: value as TaskPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Due Date field */}
              <div className="mb-2">
                <label className="text-sm text-muted-foreground mb-1 block">Fecha de vencimiento</label>
                <Input
                  type="date"
                  value={editedTask.dueDate instanceof Date 
                    ? editedTask.dueDate.toISOString().split('T')[0] 
                    : new Date(editedTask.dueDate).toISOString().split('T')[0]}
                  onChange={(e) => setEditedTask(prev => ({ 
                    ...prev, 
                    dueDate: new Date(e.target.value) 
                  }))}
                  className="w-full"
                />
              </div>
            )}
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