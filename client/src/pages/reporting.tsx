import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TaskStatus, TaskPriority } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Reporting() {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const isLoading = tasksLoading || usersLoading;

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // Estadísticas de tareas por estado
  const tasksByStatus = tasks.reduce((acc: any, task: any) => {
    if (!acc[task.status]) {
      acc[task.status] = 0;
    }
    acc[task.status]++;
    return acc;
  }, {});

  const taskStatusData = Object.entries(tasksByStatus).map(([status, count]) => ({
    name: status,
    value: count as number,
  }));

  // Colores para el gráfico de pastel
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Estadísticas de equipo
  const teamStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t: any) => t.status === TaskStatus.COMPLETED).length,
    inProgressTasks: tasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS).length,
    highPriorityTasks: tasks.filter((t: any) => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT).length,
  };

  // Productividad por usuario
  const userProductivity = users.map((user: any) => ({
    name: user.name,
    completedTasks: tasks.filter((t: any) => 
      t.status === TaskStatus.COMPLETED && 
      t.assignedUserIds.includes(user.id)
    ).length,
    inProgressTasks: tasks.filter((t: any) => 
      t.status === TaskStatus.IN_PROGRESS && 
      t.assignedUserIds.includes(user.id)
    ).length,
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard de Colaboración</h1>

        {/* Estadísticas del Equipo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.totalTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{teamStats.completedTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{teamStats.inProgressTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{teamStats.highPriorityTasks}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribución de Tareas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Tareas</CardTitle>
              <CardDescription>Por estado actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Productividad por Usuario */}
          <Card>
            <CardHeader>
              <CardTitle>Productividad por Usuario</CardTitle>
              <CardDescription>Tareas completadas y en progreso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userProductivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completedTasks" name="Completadas" fill="#4ade80" />
                    <Bar dataKey="inProgressTasks" name="En Progreso" fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}