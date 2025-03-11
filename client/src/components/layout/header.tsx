import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useState } from "react";
import { NewTaskDialog } from "@/components/dialogs/new-task-dialog";
import type { User } from "@shared/schema";

interface HeaderProps {
  users: User[];
}

export function Header({ users }: HeaderProps) {
  const [showNewTask, setShowNewTask] = useState(false);

  return (
    <div className="border-b px-6 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Welcome Back Sajibur..!</h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowNewTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
          <Avatar>
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sajibur" />
            <AvatarFallback>SJ</AvatarFallback>
          </Avatar>
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
