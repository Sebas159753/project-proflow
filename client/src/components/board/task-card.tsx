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

  console.log("TaskCard - ID de tarea:", task.id);
  console.log("TaskCard - IDs de usuarios asignados:", task.assignedUserIds);
  console.log("TaskCard - Usuarios disponibles:", users);
  console.log("TaskCard - Usuarios asignados filtrados:", assignedUsers);

  // Formatear la fecha de vencimiento
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "dd/MM/yyyy")
    : "Sin fecha";

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      await apiRequest(`/api/tasks/${task.id}`, "PATCH", editedTask);
      queryClient.invalidateQueries(["tasks"]);
      toast({
        title: "Tarea actualizada",
        description: "La tarea se ha actualizado correctamente.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedTask({
      ...task,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      setIsDeleting(true);
      try {
        await apiRequest(`/api/tasks/${task.id}`, "DELETE");
        queryClient.invalidateQueries(["tasks"]);
        toast({
          title: "Tarea eliminada",
          description: "La tarea se ha eliminado correctamente.",
        });
      } catch (error) {
        console.error("Error al eliminar la tarea:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la tarea.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleTimer = () => {
    setShowTimer(!showTimer);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4">
        {isEditing ? (
          // Modo de edición
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Título</label>
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                placeholder="Título de la tarea"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Descripción</label>
              <Input
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                placeholder="Descripción"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Status Select */}
              <Select
                value={editedTask.status}
                onValueChange={(value) => setEditedTask({ ...editedTask, status: value as TaskStatus })}
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
                onValueChange={(value) => setEditedTask({ ...editedTask, priority: value as TaskPriority })}
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
                <h3 className="font-semibold truncate max-w-[200px]">{task.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
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
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDelete}
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

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleTimer}
                className="flex items-center gap-1"
              >
                <Timer className="h-4 w-4" />
                {showTimer ? "Ocultar timer" : "Mostrar timer"}
              </Button>
            </div>

            {showTimer && (
              <div className="mt-4 border-t pt-4">
                <PomodoroTimer
                  taskId={task.id}
                  pomodoroCount={task.pomodoroCount}
                  pomodoroDuration={task.pomodoroDuration}
                  shortBreakDuration={task.shortBreakDuration}
                  longBreakDuration={task.longBreakDuration}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}