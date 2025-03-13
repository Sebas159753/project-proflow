import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Task, TaskPriority, TaskStatus } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface TaskEditDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskEditDialog({ task, isOpen, onClose }: TaskEditDialogProps) {
  const [editedTask, setEditedTask] = useState<Partial<Task>>({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined, // Handle undefined dueDate
    progress: task.progress // Include progress
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Si la fecha es del día corriente, ajustar para evitar problemas de zona horaria
      let adjustedDueDate = editedTask.dueDate;
      if (adjustedDueDate instanceof Date) {
        // Asegurar que la fecha se mantiene tal como se seleccionó
        const dueDate = new Date(adjustedDueDate);
        // Ajustar para compensar la zona horaria
        dueDate.setDate(dueDate.getDate());
        adjustedDueDate = dueDate;
      }

      // Preparar los datos a enviar
      const updatedTaskData = {
        title: editedTask.title,
        description: editedTask.description,
        status: editedTask.status,
        priority: editedTask.priority,
        dueDate: adjustedDueDate instanceof Date 
          ? adjustedDueDate.toISOString() 
          : adjustedDueDate,
        progress: typeof editedTask.progress === 'number' ? editedTask.progress : 0 // Asegurar valor numérico
      };

      console.log("Datos enviados al servidor:", updatedTaskData);

      // Realizar la petición
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTaskData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la tarea");
      }

      // Actualizar la caché de react-query
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "Tarea actualizada",
        description: "La tarea ha sido actualizada correctamente",
        variant: "success"
      });

      onClose();
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la tarea",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Título</label>
            <Input
              value={editedTask.title || ""} // Handle potential undefined values
              onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título de la tarea"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={editedTask.description || ""} // Handle potential undefined values
              onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción de la tarea"
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Prioridad</label>
            <Select
              value={editedTask.priority}
              onValueChange={(value) => setEditedTask(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskPriority.LOW}>Baja</SelectItem>
                <SelectItem value={TaskPriority.MEDIUM}>Media</SelectItem>
                <SelectItem value={TaskPriority.HIGH}>Alta</SelectItem>
                <SelectItem value={TaskPriority.URGENT}>Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Estado</label>
            <Select
              value={editedTask.status}
              onValueChange={(value) => setEditedTask(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskStatus.TODO}>To-Do</SelectItem>
                <SelectItem value={TaskStatus.IN_PROGRESS}>On Progress</SelectItem>
                <SelectItem value={TaskStatus.REVIEW}>Under Review</SelectItem>
                <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Progreso ({editedTask.progress || 0}%)</label>
            <Slider
              value={[editedTask.progress || 0]} 
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => {
                console.log("Nuevo valor de progreso:", value[0]);
                setEditedTask(prev => ({ ...prev, progress: value[0] }));
              }}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha de vencimiento</label>
            <div className="border rounded-md p-3">
              <Calendar
                mode="single"
                selected={editedTask.dueDate}
                onSelect={(date) => {
                  if (date) {
                    // Crear una nueva instancia para evitar problemas de referencia
                    const selectedDate = new Date(date);
                    console.log("Fecha seleccionada:", selectedDate.toISOString());
                    setEditedTask(prev => ({ ...prev, dueDate: selectedDate }));
                  }
                }}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                showOutsideDays={false}
              />
            </div>
            {editedTask.dueDate && (
              <div className="text-sm text-gray-500 mt-1">
                Fecha seleccionada: {editedTask.dueDate.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 mb-1">
          <DialogClose asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}