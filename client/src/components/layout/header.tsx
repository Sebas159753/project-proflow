import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { NewTaskDialog } from "@/components/dialogs/new-task-dialog";
import type { User } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HeaderProps {
  users: User[];
}

export function Header({ users }: HeaderProps) {
  const [showNewTask, setShowNewTask] = useState(false);

  // Obtener el ID del usuario actual del localStorage
  const currentUserId = Number(localStorage.getItem("currentUserId"));
  const currentUser = users.find(user => user.id === currentUserId) || users[0];

  return (
    <div className="border-b px-6 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">¡Bienvenido {currentUser.name}!</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Button onClick={() => setShowNewTask(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Crear Tarea
          </Button>
        </div>
      </div>
      <NewTaskDialog 
        open={showNewTask} 
        onOpenChange={setShowNewTask}
        users={users}
      />
    </div>
  );
}