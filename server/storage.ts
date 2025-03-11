import { Task, InsertTask, User, PomodoroSession, InsertPomodoroSession, tasks, users, pomodoroSessions, TaskStatus } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  getUsers(): Promise<User[]>;
  createUser(user: { name: string, avatar: string }): Promise<User>;
  getPomodoroSessions(): Promise<PomodoroSession[]>;
  createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
}

export class DatabaseStorage implements IStorage {
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();

    if (!updatedTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    return updatedTask;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: { name: string, avatar: string }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getPomodoroSessions(): Promise<PomodoroSession[]> {
    return await db.select().from(pomodoroSessions);
  }

  async createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
    const [newSession] = await db.insert(pomodoroSessions).values(session).returning();
    return newSession;
  }

  // Inicializar datos de ejemplo
  async initializeSampleData() {
    // Insertar usuarios de ejemplo
    const sampleUsers = [
      { name: "John Doe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
      { name: "Jane Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" },
      { name: "Bob Wilson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" }
    ];

    const insertedUsers = await db.insert(users).values(sampleUsers).returning();

    // Insertar tareas de ejemplo
    const sampleTasks = [
      {
        title: "Design System Update",
        description: "Review reusable design elements and components for consistent branding",
        status: TaskStatus.TODO,
        progress: 0,
        dueDate: new Date("2024-04-01"),
        assignedUserIds: [insertedUsers[0].id, insertedUsers[1].id]
      },
      {
        title: "Frontend Development",
        description: "Code the visual components of the website or app using HTML, CSS, JavaScript",
        status: TaskStatus.IN_PROGRESS,
        progress: 60,
        dueDate: new Date("2024-03-25"),
        assignedUserIds: [insertedUsers[1].id, insertedUsers[2].id]
      }
    ];

    await db.insert(tasks).values(sampleTasks);
  }
}

export const storage = new DatabaseStorage();

// Inicializar datos de ejemplo si es necesario
if (process.env.NODE_ENV === "development") {
  storage.initializeSampleData().catch(console.error);
}