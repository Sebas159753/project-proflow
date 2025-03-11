import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { updateUserPointsSchema } from "@shared/schema";
import { z } from "zod";

const insertUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido")
});

const insertTaskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  status: z.string(),
  priority: z.string(),
  progress: z.number().min(0).max(100).default(0),
  dueDate: z.string(),
  assignedUserIds: z.number().array().default([]),
  pomodoroCount: z.number().min(1).max(10).default(4),
  pomodoroDuration: z.number().min(5).max(60).default(25),
  shortBreakDuration: z.number().min(1).max(30).default(5),
  longBreakDuration: z.number().min(5).max(60).default(15)
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/tasks", async (_req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const result = insertTaskSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: result.error.errors 
        });
      }

      const task = await storage.createTask({
        ...result.data,
        dueDate: new Date(result.data.dueDate)
      });

      res.json(task);
    } catch (error) {
      console.error("Error al crear la tarea:", error);
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
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    try {
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
      console.error("Error al crear el usuario:", error);
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
      const result = insertUserSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Datos inválidos",
          details: result.error.errors
        });
      }

      const user = await storage.updateUser(id, result.data);
      res.json(user);
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudo actualizar el usuario"
      });
    }
  });

  // Nuevo endpoint para actualizar puntos de usuario
  app.post("/api/users/points", async (req, res) => {
    try {
      console.log("[Points Update] Request received:", req.body);
      const result = updateUserPointsSchema.safeParse(req.body);

      if (!result.success) {
        console.log("[Points Update] Validation failed:", result.error.errors);
        return res.status(400).json({
          error: "Datos inválidos",
          details: result.error.errors
        });
      }

      const { userId, points } = result.data;
      console.log(`[Points Update] Updating points for user ${userId}: +${points} points`);

      // Obtener usuario actual para calcular nuevo total
      const currentUser = await storage.getUsers().then(users => users.find(u => u.id === userId));
      if (!currentUser) {
        throw new Error(`Usuario con ID ${userId} no encontrado`);
      }

      const newPoints = (currentUser.points || 0) + points;
      console.log(`[Points Update] New total points will be: ${newPoints}`);

      const user = await storage.updateUser(userId, { points: newPoints });
      console.log("[Points Update] Points updated successfully:", user);

      res.json(user);
    } catch (error) {
      console.error("[Points Update] Error updating points:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudieron actualizar los puntos"
      });
    }
  });

  // Nuevos endpoints para badges
  app.get("/api/users/:userId/badges", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }
    try {
      const badges = await storage.getBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error al obtener badges:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudieron obtener los badges"
      });
    }
  });

  app.post("/api/badges", async (req, res) => {
    try {
      const result = insertBadgeSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Datos inválidos",
          details: result.error.errors
        });
      }

      const badge = await storage.createBadge(result.data);
      res.json(badge);
    } catch (error) {
      console.error("Error al crear el badge:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: "No se pudo crear el badge"
      });
    }
  });

  // Rutas para pomodoro sessions
  app.get("/api/pomodoro-sessions", async (_req, res) => {
    const sessions = await storage.getPomodoroSessions();
    res.json(sessions);
  });

  app.post("/api/pomodoro-sessions", async (req, res) => {
    try {
      const result = insertPomodoroSessionSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: result.error.errors 
        });
      }

      const session = await storage.createPomodoroSession(result.data);
      res.json(session);
    } catch (error) {
      console.error("Error al crear la sesión de pomodoro:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        message: "No se pudo crear la sesión de pomodoro" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}