import { Task, InsertTask, User, PomodoroSession, InsertPomodoroSession, tasks, users, pomodoroSessions, TaskStatus, badges, Badge, InsertBadge } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  getUsers(): Promise<User[]>;
  createUser(user: { name: string }): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getPomodoroSessions(): Promise<PomodoroSession[]>;
  createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
  // Nuevos métodos para badges
  getBadges(userId: number): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
}

export class DatabaseStorage implements IStorage {
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values({
      ...task,
      dueDate: new Date(task.dueDate)
    }).returning();
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

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: { name: string }): Promise<User> {
    const currentUsers = await this.getUsers();
    if (currentUsers.length >= 3) {
      throw new Error("Límite máximo de 3 usuarios alcanzado");
    }
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }

    return updatedUser;
  }

  async getPomodoroSessions(): Promise<PomodoroSession[]> {
    return await db.select().from(pomodoroSessions);
  }

  async createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
    const [newSession] = await db.insert(pomodoroSessions).values(session).returning();
    return newSession;
  }

  // Nuevos métodos para badges
  async getBadges(userId: number): Promise<Badge[]> {
    return await db
      .select()
      .from(badges)
      .where(eq(badges.userId, userId));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db
      .insert(badges)
      .values({
        ...badge,
        awardedAt: new Date()
      })
      .returning();
    return newBadge;
  }

  async initializeSampleData() {
    // Insertar usuarios de ejemplo
    const sampleUsers = [
      { name: "John Doe" },
      { name: "Jane Smith" },
      { name: "Bob Wilson" }
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