import { TaskCard } from "./task-card";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TaskStatus, type Task, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
}

// Definir el orden específico de las columnas
const columns = [
  { id: TaskStatus.TODO, title: "To-Do", className: "bg-[#EDF6FF]" },
  { id: TaskStatus.IN_PROGRESS, title: "On Progress", className: "bg-[#CCE5FF]" },
  { id: TaskStatus.REVIEW, title: "Under Review", className: "bg-[#66B2FF]" },
  { id: TaskStatus.COMPLETED, title: "Completed", className: "bg-[#0066CC]" }
];

export function KanbanBoard({ tasks, users }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    try {
      await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        status: newStatus
      });

      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "¡Tarea actualizada!",
        description: `Tarea movida a ${columns.find(col => col.id === newStatus)?.title}`,
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea"
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div key={column.id} className={`rounded-lg p-4 ${column.className}`}>
            <h3 className={`font-semibold mb-4 flex items-center ${column.id === TaskStatus.COMPLETED ? 'text-white' : 'text-gray-800'}`}>
              {column.title}
              <span className={`ml-2 text-sm ${column.id === TaskStatus.COMPLETED ? 'text-white/70' : 'text-gray-600'}`}>
                ({getTasksByStatus(column.id).length})
              </span>
            </h3>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4 min-h-[200px]"
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable 
                      key={task.id} 
                      draggableId={task.id.toString()} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`transform transition-transform ${
                            snapshot.isDragging ? "scale-105" : ""
                          }`}
                        >
                          <TaskCard task={task} users={users} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}