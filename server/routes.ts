import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TaskStatus, TaskPriority, type TaskStatusType, type TaskPriorityType } from "@shared/schema";
import { z } from "zod";

const insertUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido")
});

const insertTaskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  progress: z.number().min(0).max(100).default(0),
  dueDate: z.string(),
  assignedUserIds: z.number().array().default([]),
  pomodoroCount: z.number().min(1).max(10).default(4),
  pomodoroDuration: z.number().min(5).max(60).default(25),
  shortBreakDuration: z.number().min(1).max(30).default(5),
  longBreakDuration: z.number().min(5).max(60).default(15)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint de prueba
  app.get("/ping", (_req, res) => {
    console.log("[Debug] Ping endpoint called");
    res.json({ message: "pong" });
  });

  app.get("/api/tasks", async (_req, res) => {
    console.log("[Debug] Getting all tasks");
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      console.log("[Debug] Creating new task:", req.body);
      const result = insertTaskSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: result.error.errors 
        });
      }

      const task = await storage.createTask({
        ...result.data,
        status: result.data.status as TaskStatusType,
        priority: result.data.priority as TaskPriorityType,
        dueDate: new Date(result.data.dueDate)
      });

      res.json(task);
    } catch (error) {
      console.error("[Debug] Error creating task:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        message: "No se pudo crear la tarea" 
      });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de tarea inválido" });
    }
    try {
      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ 
        error: "Error interno del servidor",
        message: "No se pudo eliminar la tarea" 
      });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de tarea inválido" });
    }
    try {
      const task = await storage.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  app.get("/api/users", async (_req, res) => {
    console.log("[Debug] Getting all users");
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    try {
      console.log("[Debug] Creating new user:", req.body);
      const result = insertUserSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Datos inválidos",
          details: result.error.errors
        });
      }

      const user = await storage.createUser(result.data);
      res.json(user);
    } catch (error) {
      console.error("[Debug] Error creating user:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudo crear el usuario"
      });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }
    try {
      const user = await storage.updateUser(id, req.body);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  app.post("/api/users/points", async (req, res) => {
    try {
      console.log("[Points Update] Request received:", req.body);

      const { userId, points } = req.body;
      console.log(`[Points Update] Processing points update for user ${userId}: +${points} points`);

      // Obtener usuario actual
      const users = await storage.getUsers();
      const currentUser = users.find(u => u.id === userId);

      if (!currentUser) {
        console.log(`[Points Update] User ${userId} not found`);
        return res.status(404).json({
          error: "Usuario no encontrado",
          message: `No se encontró el usuario con ID ${userId}`
        });
      }

      const newPoints = (currentUser.points || 0) + points;
      console.log(`[Points Update] Calculating new points total: ${currentUser.points} + ${points} = ${newPoints}`);

      const updatedUser = await storage.updateUser(userId, { 
        points: newPoints,
        lastTaskCompletionDate: new Date()
      });

      console.log("[Points Update] User updated successfully:", updatedUser);
      res.json(updatedUser);
    } catch (error) {
      console.error("[Points Update] Error updating points:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudieron actualizar los puntos"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}