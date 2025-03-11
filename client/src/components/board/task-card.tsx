import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import type { Task, User } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  users: User[];
}

export function TaskCard({ task, users }: TaskCardProps) {
  const assignedUsers = users.filter(user => 
    task.assignedUserIds.includes(user.id)
  );

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{task.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {task.description}
        </p>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {assignedUsers.map(user => (
                <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            
            <div className="text-sm text-muted-foreground">
              {format(new Date(task.dueDate), 'MMM d')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
