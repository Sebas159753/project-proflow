import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TaskStatus, TaskPriority, insertTaskSchema, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/ui/multi-select";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
}

export function NewTaskDialog({ open, onOpenChange, users }: NewTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      progress: 0,
      dueDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0],
      assignedUserIds: [],
      pomodoroCount: 4,
      pomodoroDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15
    }
  });

  async function onSubmit(data: any) {
    try {
      const response = await apiRequest('/api/tasks', {
        method: 'POST',
        body: data
      });

      const newTask = await response.json();

      // Actualizar la caché de react-query
      queryClient.setQueryData(['/api/tasks'], (oldData: any) => {
        return oldData ? [...oldData, newTask] : [newTask];
      });

      // Invalidar la consulta para asegurarnos de tener los datos más recientes
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });

      toast({
        title: "¡Éxito!",
        description: "Tarea creada correctamente",
        className: "bg-green-500 text-white"
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error al crear la tarea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la tarea. Por favor, intenta de nuevo."
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
          <DialogDescription>
            Ingresa los detalles de la nueva tarea
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingresa el título" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la tarea"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TaskPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de vencimiento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedUserIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsables</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={users.map(user => ({
                        value: user.id.toString(),
                        label: user.name
                      }))}
                      selected={field.value.map(String)}
                      onChange={values => field.onChange(values.map(Number))}
                      placeholder="Selecciona responsables"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Crear Tarea
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}