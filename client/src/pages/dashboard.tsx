import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/board/kanban-board";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  if (tasksLoading || usersLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header users={users} />
        <ScrollArea className="flex-1 p-6">
          <KanbanBoard tasks={tasks} users={users} />
        </ScrollArea>
      </div>
    </div>
  );
}
