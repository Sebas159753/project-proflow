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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, startOfWeek, eachDayOfInterval, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { useWebSocket } from "@/hooks/use-websocket";
import { TaskStatus, TaskPriority } from "@shared/schema";
import { useEffect } from "react";

export default function Reporting() {
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/pomodoro-sessions"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const isLoading = sessionsLoading || tasksLoading || usersLoading;

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // Estadísticas diarias de pomodoros
  const dailyStats = sessions.reduce((acc: any, session: any) => {
    const date = format(new Date(session.startTime), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = { date, completed: 0, total: 0 };
    }
    acc[date].total++;
    if (session.completed) {
      acc[date].completed++;
    }
    return acc;
  }, {});

  // Últimos 7 días
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  }).map(date => format(date, "yyyy-MM-dd"));

  // Datos para gráficos de pomodoros
  const dailyData = last7Days.map(date => ({
    date: format(new Date(date), "EEE", { locale: es }),
    completados: dailyStats[date]?.completed || 0,
    total: dailyStats[date]?.total || 0,
  }));

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        {/* Gráficos de Pomodoro */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pomodoros Diarios</CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completados" name="Completados" fill="#4ade80" />
                    <Bar dataKey="total" name="Total" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Productividad</CardTitle>
              <CardDescription>Pomodoros completados vs iniciados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="completados"
                      name="Completados"
                      stroke="#4ade80"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="#94a3b8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}