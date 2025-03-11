import { useState, useEffect } from 'react';

interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  pomodoroCount: number;
  startTime?: number;
}

interface PersistentPomodoroOptions {
  taskId: number;
  userId: number;
  initialTime?: number;
}

export function usePersistentPomodoro({ taskId, userId, initialTime = 30 * 60 }: PersistentPomodoroOptions) {
  // Get stored state or initialize with defaults
  const getStoredState = (): PomodoroState => {
    const stored = localStorage.getItem(`pomodoro-${taskId}-${userId}`);
    if (stored) {
      const state = JSON.parse(stored);
      // If there was a startTime, calculate remaining time
      if (state.startTime && state.isRunning) {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        state.timeLeft = Math.max(0, state.timeLeft - elapsed);
      }
      return state;
    }
    return {
      timeLeft: initialTime,
      isRunning: false,
      isBreak: false,
      pomodoroCount: 0
    };
  };

  const [state, setState] = useState<PomodoroState>(getStoredState);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      `pomodoro-${taskId}-${userId}`,
      JSON.stringify({
        ...state,
        startTime: state.isRunning ? Date.now() : undefined
      })
    );
  }, [state, taskId, userId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isRunning && state.timeLeft > 0) {
      interval = setInterval(() => {
        setState(current => ({
          ...current,
          timeLeft: Math.max(0, current.timeLeft - 1)
        }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isRunning]);

  const startTimer = () => {
    setState(current => ({
      ...current,
      isRunning: true,
      startTime: Date.now()
    }));
  };

  const pauseTimer = () => {
    setState(current => ({
      ...current,
      isRunning: false,
      startTime: undefined
    }));
  };

  const resetTimer = (duration: number) => {
    setState(current => ({
      ...current,
      timeLeft: duration,
      isRunning: false,
      startTime: undefined
    }));
  };

  const toggleBreak = (duration: number) => {
    setState(current => ({
      ...current,
      isBreak: !current.isBreak,
      timeLeft: duration,
      isRunning: false,
      startTime: undefined
    }));
  };

  const incrementPomodoroCount = () => {
    setState(current => ({
      ...current,
      pomodoroCount: current.pomodoroCount + 1
    }));
  };

  return {
    ...state,
    startTimer,
    pauseTimer,
    resetTimer,
    toggleBreak,
    incrementPomodoroCount
  };
}
