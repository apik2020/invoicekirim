/**
 * Lightweight migration runner using @prisma/client.
 * Avoids needing the full Prisma CLI (and its deps) in the standalone container.
 */
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

async function runMigrations() {
  const prisma = new PrismaClient()

  try {
    // Ensure _prisma_migrations tracking table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT PRIMARY KEY,
        "checksum" TEXT NOT NULL DEFAULT '',
        "finished_at" TIMESTAMP(3),
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP(3),
        "started_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `)

    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations')

    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migrate] No migrations directory found, skipping.')
      return
    }

    // Read migration directories sorted by name (timestamp order)
    const dirs = fs
      .readdirSync(migrationsDir)
      .filter((d) => {
        const fullPath = path.join(migrationsDir, d)
        return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'migration.sql'))
      })
      .sort()

    if (dirs.length === 0) {
      console.log('[Migrate] No migration files found.')
      return
    }

    for (const dir of dirs) {
      // Check if already applied
      const rows = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "_prisma_migrations" WHERE "migration_name" = ${dir}
      `

      if (rows[0].count > 0) {
        console.log(`[Migrate] Already applied: ${dir}`)
        continue
      }

      const sqlFile = path.join(migrationsDir, dir, 'migration.sql')
      const sql = fs.readFileSync(sqlFile, 'utf8')
      const checksum = crypto.createHash('sha256').update(sql).digest('hex')

      console.log(`[Migrate] Running: ${dir} ...`)

      // Split by semicolons but handle multi-statement properly
      // Use $executeRawUnsafe for each statement
      const statements = sql
        .split('\n')
        .filter((line) => line.trim() && !line.trim().startsWith('--'))
        .join('\n')
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt)
      }

      // Record migration
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
         VALUES ('${crypto.randomUUID()}', '${checksum}', '${dir}', now(), 1)`
      )

      console.log(`[Migrate] Applied: ${dir}`)
    }

    console.log('[Migrate] All migrations applied successfully!')
  } catch (error) {
    console.error('[Migrate] Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigrations().catch((err) => {
  console.error('[Migrate] Fatal:', err.message)
  process.exit(1)
})
