import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertPomodoroSessionSchema } from "@shared/schema";
import { z } from "zod";

const insertUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  avatar: z.string().url("La URL del avatar es inválida")
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