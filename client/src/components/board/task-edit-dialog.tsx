
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Task, TaskStatus, TaskPriority } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TaskEditDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskEditDialog({ task, isOpen, onClose }: TaskEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    progress: task.progress,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Preparar la fecha para el envío
      let formattedDate = null;
      if (editedTask.dueDate) {
        formattedDate = (editedTask.dueDate instanceof Date) 
          ? editedTask.dueDate.toISOString() 
          : new Date(editedTask.dueDate).toISOString();
      }
      
      // Datos a enviar
      const updateData = {
        title: editedTask.title,
        description: editedTask.description,
        status: editedTask.status,
        priority: editedTask.priority,
        progress: editedTask.progress,
        dueDate: formattedDate
      };
      
      console.log("Datos a actualizar:", updateData);
      
      // Hacer la petición directamente con fetch
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      // Actualizar la caché y mostrar mensaje
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarea actualizada",
        description: "La tarea se ha actualizado correctamente",
      });
      
      // Cerrar el diálogo
      onClose();
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="font-medium">Título</label>
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título de la tarea"
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium">Descripción</label>
            <Textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción de la tarea"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-medium">Estado</label>
              <Select
                value={editedTask.status}
                onValueChange={(value) => setEditedTask(prev => ({ ...prev, status: value as TaskStatus }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
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
              <label className="font-medium">Prioridad</label>
              <Select
                value={editedTask.priority}
                onValueChange={(value) => setEditedTask(prev => ({ ...prev, priority: value as TaskPriority }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar prioridad" />
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
          </div>

          <div className="space-y-2">
            <label className="font-medium">Progreso: {editedTask.progress}%</label>
            <Slider
              value={[editedTask.progress || 0]}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => setEditedTask(prev => ({ ...prev, progress: value[0] }))}
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium">Fecha de vencimiento</label>
            <div className="border rounded-md p-3">
              <Calendar
                mode="single"
                selected={editedTask.dueDate instanceof Date ? editedTask.dueDate : editedTask.dueDate ? new Date(editedTask.dueDate) : undefined}
                onSelect={(date) => setEditedTask(prev => ({ ...prev, dueDate: date || undefined }))}
                initialFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
