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
  TASK_COMPLETION: 100,
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

// Nueva definición para los tipos de badges
export const BadgeType = {
  TASK_MASTER: "Task Master",
  EARLY_BIRD: "Early Bird",
  TEAM_PLAYER: "Team Player",
  PRODUCTIVITY_KING: "Productivity King",
  DEADLINE_CRUSHER: "Deadline Crusher"
} as const;

export type BadgeTypeKey = keyof typeof BadgeType;
export type BadgeTypeValue = typeof BadgeType[BadgeTypeKey];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  points: integer("points").notNull().default(0),
  level: text("level").notNull().$type<UserLevelType>().default("NOVICE"),
  taskStreak: integer("task_streak").notNull().default(0),
  lastTaskCompletionDate: timestamp("last_task_completion").default(null),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull().$type<BadgeTypeValue>(),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
  description: text("description").notNull(),
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
  // Nuevos campos para configuración de Pomodoro
  pomodoroCount: integer("pomodoro_count").notNull().default(4),
  pomodoroDuration: integer("pomodoro_duration").notNull().default(25), // en minutos
  shortBreakDuration: integer("short_break_duration").notNull().default(5), // en minutos
  longBreakDuration: integer("long_break_duration").notNull().default(15), // en minutos
});

// Schema para insertar tareas
export const insertTaskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.REVIEW]),
  priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT]).default(TaskPriority.MEDIUM),
  progress: z.number().min(0).max(100).default(0),
  dueDate: z.string(),
  assignedUserIds: z.number().array().default([]),
  pomodoroCount: z.number().min(1).max(10).default(4),
  pomodoroDuration: z.number().min(5).max(60).default(25),
  shortBreakDuration: z.number().min(1).max(30).default(5),
  longBreakDuration: z.number().min(5).max(60).default(15)
});

export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  type: text("type").notNull().$type<"work" | "break" | "long_break">(),
  completed: integer("completed").notNull().default(0),
});

// Schema para insertar badges
export const insertBadgeSchema = z.object({
  userId: z.number(),
  type: z.enum([
    BadgeType.TASK_MASTER,
    BadgeType.EARLY_BIRD,
    BadgeType.TEAM_PLAYER,
    BadgeType.PRODUCTIVITY_KING,
    BadgeType.DEADLINE_CRUSHER
  ]),
  description: z.string()
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type User = typeof users.$inferSelect;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;

// Schema para insertar sesiones de pomodoro
export const insertPomodoroSessionSchema = z.object({
  taskId: z.number(),
  userId: z.number(),
  startTime: z.date(),
  endTime: z.date(),
  type: z.enum(["work", "break", "long_break"]),
  completed: z.number().default(0)
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