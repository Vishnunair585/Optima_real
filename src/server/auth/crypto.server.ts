import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    return false;
  }
}

export function generateId(): string {
  return uuidv4();
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
