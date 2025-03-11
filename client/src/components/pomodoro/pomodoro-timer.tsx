import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Timer, Pause, Play, Coffee } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PomodoroTimerProps {
  taskId: number;
  userId: number;
  onComplete?: () => void;
}

export function PomodoroTimer({ taskId, userId, onComplete }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handlePomodoroComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handlePomodoroComplete = async () => {
    if (!isBreak) {
      // Pomodoro de trabajo completado
      try {
        await apiRequest("POST", "/api/pomodoro-sessions", {
          taskId,
          userId,
          startTime: new Date(Date.now() - 30 * 60 * 1000),
          endTime: new Date(),
          type: "work",
          completed: 1
        });

        queryClient.invalidateQueries({ queryKey: ["/api/pomodoro-sessions"] });

        setPomodoroCount((count) => count + 1);
        const isLongBreak = (pomodoroCount + 1) % 4 === 0;

        toast({
          title: "¡Pomodoro completado!",
          description: isLongBreak 
            ? "Toma un descanso largo de 15 minutos" 
            : "Toma un descanso de 5 minutos",
          className: "bg-green-500 text-white"
        });

        setTimeLeft(isLongBreak ? 15 * 60 : 5 * 60);
        setIsBreak(true);
      } catch (error) {
        console.error("Error al guardar la sesión de pomodoro:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la sesión de pomodoro"
        });
      }
    } else {
      // Descanso completado
      try {
        await apiRequest("POST", "/api/pomodoro-sessions", {
          taskId,
          userId,
          startTime: new Date(Date.now() - (timeLeft === 15 * 60 ? 15 : 5) * 60 * 1000),
          endTime: new Date(),
          type: (timeLeft === 15 * 60 ? "long_break" : "break"),
          completed: 1
        });

        queryClient.invalidateQueries({ queryKey: ["/api/pomodoro-sessions"] });

        toast({
          title: "¡Descanso terminado!",
          description: "¿Listo para otro pomodoro?",
          className: "bg-blue-500 text-white"
        });

        setTimeLeft(30 * 60);
        setIsBreak(false);
      } catch (error) {
        console.error("Error al guardar la sesión de descanso:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la sesión de descanso"
        });
      }
    }

    setIsRunning(false);
    if (onComplete) onComplete();
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          {isBreak ? <Coffee className="h-5 w-5 text-blue-500" /> : <Timer className="h-5 w-5 text-primary" />}
          <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={toggleTimer}
            variant="outline"
            size="sm"
            className="w-24"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {timeLeft === 30 * 60 ? 'Iniciar' : 'Continuar'}
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Pomodoros completados: {pomodoroCount}
        </div>
      </div>
    </Card>
  );
}