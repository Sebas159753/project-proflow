import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NewTaskDialog } from "@/components/dialogs/new-task-dialog";
import type { Task, User } from "@shared/schema";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showNewTask, setShowNewTask] = useState(false);

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  if (tasksLoading || usersLoading) {
    return <div>Cargando...</div>;
  }

  const tasksForDate = (date: Date) => {
    return tasks.filter((task: Task) => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Calendario</h1>
          <Button onClick={() => setShowNewTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[400px,1fr] gap-8">
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                styles={{
                  head_cell: {
                    width: "100%",
                    textTransform: "capitalize",
                  },
                }}
                modifiers={{
                  withTasks: (date) => tasksForDate(date).length > 0,
                }}
                modifiersStyles={{
                  withTasks: {
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                    borderRadius: "4px",
                  },
                }}
              />
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-4">
              Tareas para {selectedDate && format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </h2>
            <div className="space-y-4">
              {selectedDate &&
                tasksForDate(selectedDate).map((task: Task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                      <div className="flex items-center mt-4">
                        <div className="flex -space-x-2">
                          {task.assignedUserIds.map((userId) => {
                            const user = users.find((u: User) => u.id === userId);
                            return user ? (
                              <img
                                key={user.id}
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full border-2 border-background"
                              />
                            ) : null;
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        <NewTaskDialog
          open={showNewTask}
          onOpenChange={setShowNewTask}
          users={users}
        />
      </div>
    </div>
  );
}
