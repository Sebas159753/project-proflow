import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/tasks", async (_req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    console.log("Creating task with data:", req.body);
    const result = insertTaskSchema.safeParse(req.body);
    if (!result.success) {
      console.error("Task validation failed:", result.error);
      return res.status(400).json({ error: result.error });
    }
    try {
      const task = await storage.createTask({
        ...result.data,
        dueDate: new Date(result.data.dueDate)
      });
      res.json(task);
    } catch (error) {
      console.error("Error creating task in storage:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid task ID" });
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

  const httpServer = createServer(app);
  return httpServer;
}