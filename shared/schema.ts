import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

// Mejorar el schema de inserción con validaciones más específicas
export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.REVIEW]),
  progress: z.number().min(0).max(100).default(0),
  dueDate: z.date(),
  assignedUserIds: z.number().array().default([])
}).omit({ id: true });

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type User = typeof users.$inferSelect;