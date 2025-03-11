import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const TaskStatus = {
  TODO: "To-Do",
  IN_PROGRESS: "On Progress", 
  COMPLETED: "Completed",
  REVIEW: "Under Review"
} as const;

export const TaskPriority = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente"
} as const;

// Puntos por acción
export const GamePoints = {
  TASK_COMPLETION: {
    [TaskPriority.URGENT]: 5,
    [TaskPriority.HIGH]: 4,
    [TaskPriority.MEDIUM]: 3,
    [TaskPriority.LOW]: 1
  },
  POMODORO_COMPLETION: 20,
  EARLY_COMPLETION: 50,  // Completar antes de la fecha límite
  STREAK_BONUS: 30,      // Bonus por completar tareas varios días seguidos
} as const;

// Niveles de usuario
export const UserLevels = {
  NOVICE: { name: "Novato", minPoints: 0 },
  APPRENTICE: { name: "Aprendiz", minPoints: 500 },
  EXPERT: { name: "Experto", minPoints: 1000 },
  MASTER: { name: "Maestro", minPoints: 2000 },
  LEGEND: { name: "Leyenda", minPoints: 5000 }
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];
export type UserLevelType = keyof typeof UserLevels;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  points: integer("points").notNull().default(0),
  level: text("level").notNull().$type<UserLevelType>().default("NOVICE"),
  taskStreak: integer("task_streak").notNull().default(0),
  lastTaskCompletionDate: timestamp("last_task_completion").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().$type<TaskStatusType>(),
  priority: text("priority").notNull().$type<TaskPriorityType>().default(TaskPriority.MEDIUM),
  progress: integer("progress").notNull().default(0),
  dueDate: timestamp("due_date").notNull(),
  assignedUserIds: integer("assigned_user_ids").array().notNull().default([]),
  pomodoroCount: integer("pomodoro_count").notNull().default(4),
  pomodoroDuration: integer("pomodoro_duration").notNull().default(25),
  shortBreakDuration: integer("short_break_duration").notNull().default(5),
  longBreakDuration: integer("long_break_duration").notNull().default(15),
});

// Schema para actualizar puntos de usuario
export const updateUserPointsSchema = z.object({
  userId: z.number(),
  points: z.number(),
  taskCompleted: z.boolean().optional(),
  pomodoroCompleted: z.boolean().optional(),
  earlyCompletion: z.boolean().optional(),
});

export type UpdateUserPoints = z.infer<typeof updateUserPointsSchema>;
export type Task = typeof tasks.$inferSelect;
export type User = typeof users.$inferSelect;