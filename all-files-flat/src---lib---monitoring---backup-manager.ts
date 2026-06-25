import { db } from "../db";
import { backupLogs } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendAlert } from "./alert-manager";

const generateId = () => crypto.randomUUID();

const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";

type BackupType = "daily" | "weekly" | "monthly";

export async function runBackup(type: BackupType): Promise<boolean> {
  const backupId = generateId();
  const startTime = Date.now();

  try {
    // Ensure backup directory exists
    const fs = await import("fs");
    const path = await import("path");
    const backupPath = path.join(BACKUP_DIR, type);
    fs.mkdirSync(backupPath, { recursive: true });

    // Read the SQLite database and create a dump
    const dbPath = process.env.DATABASE_URL || "sqlite.db";
    const fileName = `backup-${type}-${new Date().toISOString().split("T")[0]}-${backupId.slice(0, 8)}.db`;
    const filePath = path.join(backupPath, fileName);

    // Copy the database file
    const sourcePath = path.resolve(dbPath);
    fs.copyFileSync(sourcePath, filePath);

    const fileSize = fs.statSync(filePath).size;
    const duration = Date.now() - startTime;

    // Log success
    await db.insert(backupLogs).values({
      id: backupId,
      backup_type: type,
      status: "completed",
      file_path: filePath,
      file_size_bytes: fileSize,
      started_at: new Date(startTime),
      completed_at: new Date(),
    });

    // Enforce retention: keep only last 30 backups of this type
    await enforceRetention(type, 30);

    console.log(`[backup] ${type} backup completed: ${filePath} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
    return true;
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error(`[backup] ${type} backup FAILED:`, errorMsg);

    await db.insert(backupLogs).values({
      id: backupId,
      backup_type: type,
      status: "failed",
      error_message: errorMsg,
      started_at: new Date(startTime),
    });

    await sendAlert({
      alert_type: "backup_failure",
      severity: "critical",
      title: `Database backup FAILED (${type})`,
      description: `The ${type} backup failed: ${errorMsg}`,
      metadata: { backup_type: type, backup_id: backupId },
    });

    return false;
  }
}

async function enforceRetention(type: BackupType, maxCount: number) {
  const { desc } = await import("drizzle-orm");
  const existing = await db.select()
    .from(backupLogs)
    .where(eq(backupLogs.backup_type, type))
    .orderBy(desc(backupLogs.started_at));

  const fs = await import("fs");
  for (let i = maxCount; i < existing.length; i++) {
    try {
      if (existing[i]?.file_path) {
        fs.unlinkSync(existing[i].file_path!);
      }
      await db.delete(backupLogs).where(eq(backupLogs.id, existing[i]!.id));
    } catch { /* ignore cleanup errors */ }
  }
}

export async function getBackupHistory(limit = 30) {
  const { desc } = await import("drizzle-orm");
  return db.select().from(backupLogs).orderBy(desc(backupLogs.started_at)).limit(limit);
}

export async function getLatestBackup() {
  const { desc } = await import("drizzle-orm");
  const result = await db.select().from(backupLogs).where(eq(backupLogs.status, "completed")).orderBy(desc(backupLogs.started_at)).limit(1);
  return result[0] || null;
}

export async function restoreBackup(backupId: string): Promise<boolean> {
  try {
    const result = await db.select().from(backupLogs).where(eq(backupLogs.id, backupId)).limit(1);
    if (result.length === 0) throw new Error("Backup not found");
    const backup = result[0]!;
    if (backup.status !== "completed" || !backup.file_path) throw new Error("Backup not usable");

    const fs = await import("fs");
    const dbPath = process.env.DATABASE_URL || "sqlite.db";
    const sourcePath = fs.realpathSync(backup.file_path);
    const destPath = fs.realpathSync(dbPath);

    // Take a pre-restore snapshot
    const preRestorePath = dbPath + ".pre-restore." + Date.now() + ".db";
    fs.copyFileSync(destPath, preRestorePath);

    // Restore
    fs.copyFileSync(sourcePath, destPath);

    console.log(`[backup] Restored from ${backup.file_path}. Pre-restore snapshot: ${preRestorePath}`);
    return true;
  } catch (err) {
    console.error("[backup] Restore FAILED:", err);
    return false;
  }
}
