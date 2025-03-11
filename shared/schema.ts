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

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
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
});

// Schema para insertar tareas
export const insertTaskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.REVIEW]),
  priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT]).default(TaskPriority.MEDIUM),
  progress: z.number().min(0).max(100).default(0),
  dueDate: z.string(),
  assignedUserIds: z.number().array().default([])
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

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type User = typeof users.$inferSelect;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
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