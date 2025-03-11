import { Task, InsertTask, User, TaskStatus } from "@shared/schema";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  getUsers(): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private tasks: Map<number, Task>;
  private users: Map<number, User>;
  private taskId: number;

  constructor() {
    this.tasks = new Map();
    this.users = new Map();
    this.taskId = 1;

    // Add sample users
    const sampleUsers: User[] = [
      { id: 1, name: "John Doe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
      { id: 2, name: "Jane Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" },
      { id: 3, name: "Bob Wilson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));

    // Add sample tasks
    const sampleTasks: InsertTask[] = [
      {
        title: "Design System Update",
        description: "Review reusable design elements and components for consistent branding",
        status: TaskStatus.TODO,
        progress: 0,
        dueDate: new Date("2024-04-01"),
        assignedUserIds: [1, 2]
      },
      {
        title: "Frontend Development",
        description: "Code the visual components of the website or app using HTML, CSS, JavaScript",
        status: TaskStatus.IN_PROGRESS,
        progress: 60,
        dueDate: new Date("2024-03-25"),
        assignedUserIds: [2, 3]
      }
    ];

    sampleTasks.forEach(task => this.createTask(task));
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async createTask(task: InsertTask): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: this.taskId++
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const storage = new MemStorage();
