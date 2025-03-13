
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

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedTask({...task});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);

    try {
      // Crear objeto solo con los campos que queremos actualizar
      const updatedTaskData = {
        title: editedTask.title,
        description: editedTask.description,
        status: editedTask.status,
        priority: editedTask.priority,
        progress: editedTask.progress,
        dueDate: editedTask.dueDate instanceof Date 
          ? editedTask.dueDate.toISOString() 
          : typeof editedTask.dueDate === 'string'
            ? new Date(editedTask.dueDate).toISOString()
            : null
      };

      console.log("Enviando actualización de tarea:", updatedTaskData);
      
      // Enviar la solicitud de actualización
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTaskData),
      });

      // Mostrar notificación de éxito
      toast({
        title: "Tarea actualizada",
        description: "La tarea se ha actualizado con éxito",
      });

      // Actualizar la cache de consultas
      queryClient.invalidateQueries(['tasks']);
      
      // Salir del modo de edición
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      queryClient.invalidateQueries(['tasks']);
      toast({
        title: "Tarea eliminada",
        description: "La tarea se ha eliminado con éxito",
      });
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      addPointsForTaskCompletion(1, task.priority);
    }

    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      queryClient.invalidateQueries(['tasks']);
      toast({
        title: "Estado actualizado",
        description: `Tarea movida a "${newStatus}"`,
      });
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleProgressChange = async (newProgress: number[]) => {
    const progress = newProgress[0];
    
    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });

      queryClient.invalidateQueries(['tasks']);
    } catch (error) {
      console.error("Error al actualizar el progreso:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el progreso",
        variant: "destructive",
      });
    }
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
                onValueChange={(value) => setEditedTask({ ...editedTask, status: value as TaskStatusType })}
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
                onValueChange={(value) => setEditedTask({ ...editedTask, priority: value as TaskPriorityType })}
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
                    ? new Date(editedTask.dueDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setEditedTask({ 
                    ...editedTask, 
                    dueDate: date 
                  });
                }}
                className="w-full"
              />
            </div>
            
            {/* Progreso */}
            <div className="space-y-2">
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
            
            {/* Botones de acción */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveEdit}
                disabled={isUpdating}
              >
                {isUpdating ? "Guardando..." : (
                  <>
                    <Save className="h-4 w-4 mr-1" /> Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Modo de visualización
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold truncate">{task.title}</h3>
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

            <div className="flex justify-between items-center">
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowTimer(!showTimer)}
                >
                  <Timer className="h-3 w-3 mr-1" />
                  {showTimer ? "Ocultar" : "Pomodoro"}
                </Button>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex space-x-1"
              >
                {task.status !== TaskStatus.COMPLETED && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-green-50 text-green-700 hover:bg-green-100"
                    onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
                  >
                    Completar
                  </Button>
                )}
              </motion.div>
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
