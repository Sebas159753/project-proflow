import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Task, GamePoints, TaskStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePoints() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const awardPoints = async (task: Task, userId: number) => {
    if (task.status === TaskStatus.COMPLETED && task.progress === 100) {
      try {
        // Obtener puntos basados en la prioridad
        const points = GamePoints.TASK_COMPLETION[task.priority];
        console.log(`[Points] Awarding ${points} points to user ${userId} for task priority ${task.priority}`);

        await apiRequest('/api/users/points', 'POST', {
          userId,
          points,
          taskCompleted: true
        });

        // Invalidar queries para refrescar los datos
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });

        toast({
          title: "¡Puntos ganados!",
          description: `Has ganado ${points} puntos por completar una tarea ${task.priority}`,
          className: "bg-green-500 text-white"
        });
      } catch (error) {
        console.error('Error al actualizar puntos:', error);
        toast({
          title: "Error",
          description: "No se pudieron actualizar los puntos",
          variant: "destructive"
        });
      }
    }
  };

  return { awardPoints };
}