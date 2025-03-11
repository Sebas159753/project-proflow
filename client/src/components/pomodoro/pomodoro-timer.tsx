import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Timer, Pause, Play, Coffee } from "lucide-react";

interface PomodoroTimerProps {
  onComplete?: () => void;
}

export function PomodoroTimer({ onComplete }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        // Pomodoro completado
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
      } else {
        // Descanso completado
        toast({
          title: "¡Descanso terminado!",
          description: "¿Listo para otro pomodoro?",
          className: "bg-blue-500 text-white"
        });

        setTimeLeft(30 * 60);
        setIsBreak(false);
      }
      setIsRunning(false);
      if (onComplete) onComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, pomodoroCount, onComplete, toast]);

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
