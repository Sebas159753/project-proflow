import { TaskCard } from "./task-card";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TaskStatus, type Task, type User } from "@shared/schema";

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
}

const columns = [
  { id: TaskStatus.TODO, title: "To-Do" },
  { id: TaskStatus.IN_PROGRESS, title: "On Progress" },
  { id: TaskStatus.COMPLETED, title: "Completed" },
  { id: TaskStatus.REVIEW, title: "Under Review" }
];

export function KanbanBoard({ tasks, users }: KanbanBoardProps) {
  const queryClient = useQueryClient();

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
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div key={column.id} className="bg-card rounded-lg p-4">
            <h3 className="font-semibold mb-4">{column.title}</h3>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4"
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable 
                      key={task.id} 
                      draggableId={task.id.toString()} 
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
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
