import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const TaskStatus = {
  TODO: "To-Do",
  IN_PROGRESS: "On Progress", 
  COMPLETED: "Completed",
  REVIEW: "Under Review"
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().$type<TaskStatusType>(),
  progress: integer("progress").notNull().default(0),
  dueDate: timestamp("due_date").notNull(),
  assignedUserIds: integer("assigned_user_ids").array().notNull().default([]),
});

// Simplificar el schema de inserción
export const insertTaskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.REVIEW]),
  progress: z.number().min(0).max(100).default(0),
  dueDate: z.string(),
  assignedUserIds: z.number().array().default([])
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type User = typeof users.$inferSelect;