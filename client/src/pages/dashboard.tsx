import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/board/kanban-board";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    initialData: [], // Proporcionar un array vacío como valor inicial
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    initialData: [], // Proporcionar un array vacío como valor inicial
  });

  if (tasksLoading || usersLoading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Cargando datos...</p>
      </div>
    </div>;
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
