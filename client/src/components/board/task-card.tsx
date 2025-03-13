import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { TaskStatus, type Task, type User, TaskPriority } from "@shared/schema";
import { PomodoroTimer } from "../pomodoro/pomodoro-timer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Trash2, Edit, Save, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
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

export function TaskCard({ task, users }: TaskCardProps) {
  const [showTimer, setShowTimer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addPointsForTaskCompletion } = usePoints();

  const [editedTask, setEditedTask] = useState<Task>({
    ...task,
  });

  // Usuarios asignados a la tarea actual
  const assignedUsers = users.filter((user) =>
    task.assignedUserIds.includes(user.id)
  );

  // Formatear la fecha de vencimiento
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "dd/MM/yyyy")
    : "Sin fecha";

  const handleTimerClick = () => {
    setShowTimer(!showTimer);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedTask({ ...task });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      setIsUpdating(true);

      // Preparar los datos para enviar al servidor
      const dataToUpdate = {
        title: editedTask.title,
        description: editedTask.description,
        progress: editedTask.progress,
        status: editedTask.status,
        priority: editedTask.priority
      };

      // Asegurarse que la fecha se procesa correctamente
      // Si es string, asegurar que está en formato ISO
      if (editedTask.dueDate) {
        let formattedDate;
        if (editedTask.dueDate instanceof Date) {
          formattedDate = editedTask.dueDate.toISOString();
        } else if (typeof editedTask.dueDate === 'string') {
          // Si ya es string, intentar convertirlo a fecha y luego a ISO
          formattedDate = new Date(editedTask.dueDate).toISOString();
        }
        dataToUpdate.dueDate = formattedDate;
      }

      // Mostrar en consola los datos que se envían
      console.log("Datos enviados al servidor:", dataToUpdate);

      // Realizar la solicitud API
      await apiRequest(`/api/tasks/${task.id}`, {
        method: "PATCH",
        data: dataToUpdate,
      });

      // Actualizar la caché de consultas
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      // Mostrar notificación de éxito
      toast({
        title: "¡Tarea actualizada!",
        description: "La tarea se ha actualizado correctamente.",
        className: "bg-green-500 text-white",
      });

      // Salir del modo de edición
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la tarea. Inténtalo de nuevo.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
      try {
        setIsDeleting(true);
        await apiRequest(`/api/tasks/${task.id}`, {
          method: "DELETE",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        toast({
          title: "Tarea eliminada",
          description: "La tarea ha sido eliminada correctamente.",
          className: "bg-green-500 text-white",
        });
      } catch (error) {
        console.error("Error al eliminar la tarea:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la tarea. Inténtalo de nuevo.",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCompleteTask = async () => {
    if (task.status !== TaskStatus.DONE) {
      try {
        await apiRequest(`/api/tasks/${task.id}`, {
          method: "PATCH",
          data: {
            status: TaskStatus.DONE,
            progress: 100,
          },
        });

        // Agregar puntos por completar la tarea
        addPointsForTaskCompletion(task.priority);

        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        toast({
          title: "¡Tarea completada!",
          description: "La tarea ha sido marcada como completada.",
          className: "bg-green-500 text-white",
        });
      } catch (error) {
        console.error("Error al completar la tarea:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo completar la tarea. Inténtalo de nuevo.",
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          {isEditing ? (
            // Modo de edición
            <div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-1 block">Título</label>
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="mb-2"
                  maxLength={50}
                />
                <label className="text-sm text-muted-foreground mb-1 block">Descripción</label>
                <Input
                  value={editedTask.description || ""}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  className="mb-2"
                  maxLength={100}
                />
              </div>

              {/* Due Date field */}
              <div className="mb-2">
                <label className="text-sm text-muted-foreground mb-1 block">Fecha de vencimiento</label>
                <Input
                  type="date"
                  value={
                    editedTask.dueDate
                      ? new Date(editedTask.dueDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setEditedTask({ ...editedTask, dueDate: date });
                  }}
                />
              </div>

              {/* Progress Slider */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">Progreso: {editedTask.progress}%</label>
                </div>
                <Slider
                  value={[editedTask.progress]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => setEditedTask({ ...editedTask, progress: value[0] })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" /> Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" /> Guardar
                </Button>
              </div>
            </div>
          ) : (
            // Modo de visualización
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-ellipsis overflow-hidden truncate max-w-[180px]" title={task.title}>{task.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1" title={task.description}>
                    {task.description}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleEditClick}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className={cn(getPriorityColor(task.priority))}>
                  {task.priority}
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-800">
                  {formattedDueDate}
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Progreso</span>
                  <span>{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>

              {assignedUsers.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground mb-1">Asignado a:</div>
                  <div className="flex flex-wrap gap-1">
                    {assignedUsers.map((user) => (
                      <Badge key={user.id} variant="secondary" className="text-xs">
                        {user.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTimerClick}
                  className="flex items-center gap-1"
                >
                  <Timer className="h-4 w-4" /> Pomodoro
                </Button>
                <Button
                  size="sm"
                  onClick={handleCompleteTask}
                  disabled={task.status === TaskStatus.DONE}
                  className="flex items-center gap-1"
                >
                  Completar
                </Button>
              </div>

              {showTimer && (
                <div className="mt-4 bg-slate-50 p-3 rounded-md">
                  <PomodoroTimer
                    taskId={task.id}
                    count={task.pomodoroCount || 4}
                    duration={task.pomodoroDuration || 25}
                    shortBreak={task.shortBreakDuration || 5}
                    longBreak={task.longBreakDuration || 15}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}