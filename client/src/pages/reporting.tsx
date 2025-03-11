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
} from "recharts";
import { format, startOfWeek, eachDayOfInterval, subDays } from "date-fns";
import { es } from "date-fns/locale";

export default function Reporting() {
  // Obtener las sesiones de pomodoro
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/pomodoro-sessions"],
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // Calcular estadísticas diarias
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

  // Obtener los últimos 7 días
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  }).map(date => format(date, "yyyy-MM-dd"));

  // Preparar datos para los gráficos
  const dailyData = last7Days.map(date => ({
    date: format(new Date(date), "EEE", { locale: es }),
    completados: dailyStats[date]?.completed || 0,
    total: dailyStats[date]?.total || 0,
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Reporte de Pomodoros</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Estadísticas generales de pomodoros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-2xl font-bold">
                    {sessions.filter((s: any) => s.completed).length}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    Pomodoros completados
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-bold">
                    {Math.round(
                      (sessions.filter((s: any) => s.completed).length /
                        sessions.length) *
                        100
                    )}%
                  </span>
                  <span className="text-muted-foreground ml-2">
                    Tasa de finalización
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Esta Semana</CardTitle>
              <CardDescription>
                Desde {format(startOfWeek(new Date()), "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-2xl font-bold">
                    {sessions.filter(
                      (s: any) =>
                        new Date(s.startTime) > startOfWeek(new Date()) &&
                        s.completed
                    ).length}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    Pomodoros esta semana
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-bold">
                    {Math.round(
                      sessions
                        .filter(
                          (s: any) => new Date(s.startTime) > startOfWeek(new Date())
                        )
                        .reduce((acc: number, s: any) => acc + (s.type === "work" ? 25 : 0), 0) / 60
                    )}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    Horas enfocadas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pomodoros Diarios</CardTitle>
              <CardDescription>
                Últimos 7 días
              </CardDescription>
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
              <CardDescription>
                Pomodoros completados vs iniciados
              </CardDescription>
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
