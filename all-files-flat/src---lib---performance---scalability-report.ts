export const SCALABILITY_REPORT = `
# AIRank Scalability Assessment

## Current Architecture
- **Database:** SQLite via better-sqlite3 (embedded, single-process)
- **Auth:** Custom session-based with argon2 hashing
- **Caching:** In-memory Map-based (TTL + tag invalidation)
- **Queue:** SQLite-backed job queue
- **Deployment:** Single-process Node.js (TanStack Start SSR)

## Capacity Tiers

### Tier 1: 100 Users (Current)
- ✅ SQLite handles this trivially
- ✅ No scaling needed
- ✅ Response times <50ms for all queries
- ✅ Memory usage <200MB

### Tier 2: 1,000 Users
- ✅ SQLite WAL mode handles concurrent reads
- ⚠️ Consider read replicas for analytics queries
- ✅ Indexes in place for all common query patterns
- ✅ Caching layer catches repeated queries
- ✅ Queue handles background emails/analytics
- **Estimated:** <100ms query times, <500ms page loads

### Tier 3: 10,000 Users
- ⚠️ SQLite becomes write-contended (sequential writes)
- ✅ Read throughput still good via WAL mode
- ⚠️ Monitoring data volume grows (~500MB/year)
- ✅ Circuit breakers prevent cascade failures
- ✅ Rate limiting prevents abuse
- **Recommended Action:** Migrate to PostgreSQL
- **Estimated:** 200-500ms queries under load

### Tier 4: 100,000 Users
- ❌ SQLite will bottleneck on writes (limited to ~1 writer)
- ❌ Single-process server cannot handle request volume
- ❌ In-memory cache resets on restart
- ⚠️ Background queue may back up
- **Required Architecture Changes:**

## Required Architecture Changes for 100K Users

### Database Migration
\`\`\`
SQLite → PostgreSQL + PgBouncer (connection pooling)
- Why: Concurrent writes, replication, point-in-time recovery
- Migration: Use pgloader or custom ETL script
- Indexes: Already designed in drizzle/0004
\`\`\`

### Horizontal Scaling
\`\`\`
Single Server → Load Balanced Cluster
- Add reverse proxy (Nginx/Caddy) for load balancing
- Stateless sessions (move to Redis)
- Shared-nothing architecture
- Horizontal pod autoscaling (K8s)
\`\`\`

### Redis/Memcached Layer
\`\`\`
Add Redis for:
- Session store (replace SQLite sessions)
- Rate limiter counters (replace in-memory)
- Cache invalidation pub/sub
- Real-time leaderboard updates
- Job queue (replace SQLite queue)
\`\`\`

### Read Replicas
\`\`\`
PostgreSQL read replicas for:
- Analytics queries
- Leaderboard queries
- Public stack listings
- Search queries
\`\`\`

### CDN
\`\`\`
Cloudflare/Fastly for:
- Static assets (JS, CSS, images)
- API caching (GET endpoints)
- DDoS protection
- Edge caching of public pages
\`\`\`

### Monitoring & Observability
\`\`\`
Dedicated observability stack:
- Prometheus + Grafana (metrics)
- Loki (log aggregation)
- Tempo (tracing)
- Sentry (error tracking)
\`\`\`

## Bottlenecks Identified

### Current
1. **SQLite single-writer** - WAL mode helps reads, writes are serialized
2. **In-memory cache** - Lost on restart, no replication
3. **In-memory rate limiter** - Reset on restart, not distributed
4. **No image optimization pipeline** - Large images served directly
5. **No CDN** - All traffic hits the origin server
6. **No compression middleware** - Response bodies not compressed
7. **Bundle size** - 420KB main JS bundle (can be split)

### Future
1. **N+1 queries** - Currently mitigated but could grow with features
2. **Analytics table growth** - 100K users × daily events = rapid growth
3. **Session table bloat** - No cleanup of expired sessions
4. **Referral table join complexity** - Multiple joins for dashboard
5. **Full-text search** - FTS5 works for SQLite but Postgres full-text would be needed after migration

## Performance Optimization Plan

### Immediate (Current sprint)
- ✅ Performance indexes on all tables
- ✅ Cursor-based pagination
- ✅ In-memory caching with tag invalidation
- ✅ Circuit breaker pattern
- ✅ Background job queue
- ✅ Rate limiting per endpoint
- ✅ Observability tracking
- ✅ Performance dashboard
- ⬜ Image optimization pipeline

### Short-term (Next 2 weeks)
- ⬜ Redis integration for sessions + caching
- ⬜ PostgreSQL migration preparation
- ⬜ Implement response compression (gzip/brotli)
- ⬜ Code splitting route-based lazy loading
- ⬜ Service worker for offline caching

### Medium-term (Next month)
- ⬜ CDN setup (Cloudflare)
- ⬜ Read replica configuration
- ⬜ Horizontal scaling deployment
- ⬜ Real-time metrics pipeline (Prometheus)
- ⬜ Automated load testing in CI/CD

## Target Metrics Feasibility

| Metric | Current | 100 Users | 1K Users | 10K Users | 100K Users |
|--------|---------|-----------|----------|-----------|------------|
| Page Load | <1s | <1s | <1.5s | <2s | <2s* |
| API Response | <100ms | <100ms | <200ms | <300ms | <500ms* |
| DB Query | <50ms | <50ms | <100ms | <200ms | <300ms* |
| Lighthouse Score | ~85 | 90+ | 90+ | 85+ | 85+* |

*Requires Redis + CDN + PostgreSQL migration

## Cost Projection for 100K Users

| Service | Estimated Monthly Cost |
|---------|----------------------|
| PostgreSQL (RDS) | $200-500 |
| Redis (ElastiCache) | $50-100 |
| Server instances | $200-400 |
| CDN (Cloudflare) | $100-200 |
| Monitoring stack | $50-100 |
| **Total** | **$600-1,300/mo** |

## Migration Path

1. Add Redis (week 1-2)
2. Migrate SQLite → PostgreSQL (week 3-4)
3. Add CDN (week 3)
4. Horizontal scaling (week 5-6)
5. Observability stack (week 6-7)
6. Performance tuning (ongoing)
`.trim();
