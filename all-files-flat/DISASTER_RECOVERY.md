# AIRank / Optima — Disaster Recovery Plan

## 1. Recovery Procedures

### 1.1 Database Restoration
```bash
# 1. Stop the application
pm2 stop optima

# 2. List available backups
curl http://localhost:8080/admin/monitoring

# 3. Restore from latest backup (via admin panel or CLI)
# Admin panel: go to /admin/monitoring and click Restore on the desired backup
# OR manual CLI restore:
cp backups/daily/backup-daily-2025-01-01.db sqlite.db

# 4. Verify database integrity
sqlite3 sqlite.db "PRAGMA integrity_check;"

# 5. Start the application
pm2 start optima
```

### 1.2 Full System Recovery
```bash
# 1. Clone fresh repository
git clone <repo-url>
cd airank_project

# 2. Install dependencies
npm install

# 3. Restore database from latest backup
cp /path/to/backup/backup-monthly-2025-01-01.db sqlite.db

# 4. Apply any pending migrations
npm run db:migrate

# 5. Restore environment variables
cp .env.production .env

# 6. Build and start
npm run build
npm run start
```

### 1.3 Deployment Rollback
```bash
# Via Git
git log --oneline -10          # Find the working commit
git revert HEAD                # Revert the last deployment
git push origin main           # Push the revert
npm run build                  # Rebuild
pm2 restart optima             # Restart

# Or direct rollback:
git checkout <previous-stable-commit>
npm run build
pm2 restart optima
```

## 2. Backup Restoration Steps

### Automated via Admin Panel
1. Navigate to `/admin/monitoring`
2. Find the backup in the Backups section
3. Click the backup you want to restore
4. Confirm the restore action

### Manual via Command Line
```bash
# Identify the backup file
ls -la backups/daily/

# Stop the app
pm2 stop optima

# Create a pre-restore snapshot (safety)
cp sqlite.db sqlite.db.pre-restore.$(date +%s).bak

# Copy the backup
cp backups/weekly/backup-weekly-2025-01-01.db sqlite.db

# Verify
sqlite3 sqlite.db "PRAGMA integrity_check;"

# Start the app
pm2 start optima
```

## 3. Rollback Procedures

### Application Rollback
```bash
# Check current and previous versions
cat .version

# Rollback to previous build
git checkout <previous-tag>
npm run build
pm2 restart optima

# Verify health
curl http://localhost:8080/api/health
```

### Database Rollback
```bash
# If a migration caused issues:
# 1. Restore from pre-migration backup
# 2. Revert the migration code
# 3. Deploy the fix

# Find pre-migration backup
ls -t backups/daily/ | head -5

# Restore
cp backups/daily/backup-daily-2024-12-31.db sqlite.db

# Verify
curl http://localhost:8080/api/health
```

## 4. Database Recovery

### From Corrupted Database
```bash
# 1. Try integrity check
sqlite3 sqlite.db "PRAGMA integrity_check;"

# 2. If corrupted, restore from latest good backup
# 3. If no backup exists, try recovery:
sqlite3 sqlite.db ".recover" | sqlite3 sqlite.recovered.db
mv sqlite.recovered.db sqlite.db
```

### From Schema Mismatch
```bash
# 1. Identify the schema version
sqlite3 sqlite.db ".schema users"

# 2. Apply missing migrations
npm run db:migrate

# 3. Or rollback to a schema-compatible backup
```

## 5. Deployment Safety

### Health Checks
```bash
# The application exposes /api/health endpoint
# Returns 200 if healthy, 503 if down
# Run before and after any deployment

curl http://localhost:8080/api/health
# Expected: {"status":"healthy","checks":[...]}
```

### Deployment Verification
```bash
# Before marking deployment successful, verify:
curl http://localhost:8080/api/health     # Health check
curl http://localhost:8080/                # Homepage loads
curl http://localhost:8080/login           # Auth works
```

### Rollback Button
- Available in the admin monitoring dashboard at `/admin/monitoring`
- One-click restore from any completed backup
- Pre-restore snapshots are automatically created

## 6. Alerting on Failure

All backup failures, health check failures, and security incidents trigger alerts via:
- **Email**: Sent to configured SMTP recipients
- **Slack**: Sent to `SLACK_WEBHOOK_URL` if configured
- **Discord**: Sent to `DISCORD_WEBHOOK_URL` if configured
- **Fallback**: All alerts are logged to console during development

## 7. Backup Schedule & Retention

| Type | Frequency | Retention | Trigger |
|------|-----------|-----------|---------|
| Daily | Every 24h | 30 backups | Cron or manual |
| Weekly | Every 7 days | 30 backups | Cron or manual |
| Monthly | Every 30 days | 30 backups | Cron or manual |

## 8. Monitoring Alerts

The system automatically detects and alerts on:
- Website/database/auth downtime (3 consecutive failures)
- Brute force attacks (5+ failed logins in 15 min)
- Suspicious login activity (10+ logins in 1 hour)
- Repeated auth failures (5+ in 5 min)
- Unauthorized access attempts
- Backup failures
- High error rates

## 9. Contacts & Escalation

- **Primary Admin**: admin@optima.app
- **System Health**: `/admin/monitoring`
- **Health API**: `GET /api/health`
