import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export const DEMO_CREDENTIALS = {
  email: "demo@shady.app",
  password: "demo123",
} as const;

const usersById = new Map<string, DemoUser>();
const usersByEmail = new Map<string, DemoUser>();

let seeded = false;

async function seedDemoUser() {
  if (seeded) return;
  const passwordHash = await bcrypt.hash(DEMO_CREDENTIALS.password, 10);
  const demoUser: DemoUser = {
    id: "demo-user-001",
    email: DEMO_CREDENTIALS.email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  usersById.set(demoUser.id, demoUser);
  usersByEmail.set(demoUser.email, demoUser);
  seeded = true;
}

export async function ensureDemoUsers() {
  await seedDemoUser();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long" };
  }
  return { valid: true };
}

export async function createDemoUser(email: string, password: string): Promise<DemoUser> {
  await ensureDemoUsers();
  const normalizedEmail = email.toLowerCase();
  if (usersByEmail.has(normalizedEmail)) {
    throw new Error("USER_EXISTS");
  }
  const user: DemoUser = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  usersById.set(user.id, user);
  usersByEmail.set(user.email, user);
  return user;
}

export async function authenticateDemoUser(
  email: string,
  password: string,
): Promise<DemoUser | null> {
  await ensureDemoUsers();
  const user = usersByEmail.get(email.toLowerCase());
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export function getDemoUserById(id: string): DemoUser | undefined {
  return usersById.get(id);
}

export function toPublicUser(user: DemoUser) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}
