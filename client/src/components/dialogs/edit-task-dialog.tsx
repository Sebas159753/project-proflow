import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskStatus, TaskPriority, type Task, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditTaskDialogProps {
  task: Task;
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, users, open, onOpenChange }: EditTaskDialogProps) {
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: new Date(task.dueDate),
    assignedUserIds: task.assignedUserIds
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      await apiRequest("PATCH", `/api/tasks/${task.id}`, {
        ...editedTask,
        dueDate: editedTask.dueDate.toISOString()
      });

      // Invalidar y refrescar la caché
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "¡Éxito!",
        description: "Tarea actualizada correctamente",
        className: "bg-green-500 text-white"
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la tarea"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la tarea aquí
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label>Título</label>
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label>Descripción</label>
            <Textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label>Estado</label>
            <Select
              value={editedTask.status}
              onValueChange={(value) => setEditedTask(prev => ({ ...prev, status: value as typeof prev.status }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TaskStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label>Prioridad</label>
            <Select
              value={editedTask.priority}
              onValueChange={(value) => setEditedTask(prev => ({ ...prev, priority: value as typeof prev.priority }))}
            >
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-2">
            <label>Fecha de vencimiento</label>
            <Calendar
              mode="single"
              selected={editedTask.dueDate}
              onSelect={(date) => date && setEditedTask(prev => ({ ...prev, dueDate: date }))}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-2">
            <label>Asignado a</label>
            <Select
              value={editedTask.assignedUserIds[0]?.toString()}
              onValueChange={(value) => setEditedTask(prev => ({ ...prev, assignedUserIds: [parseInt(value)] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
