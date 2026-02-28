-- ────────────────────────────────────────────────────────────────────────────
-- Faz 1 Migration — Moderasyon Derinleştirme
-- Tarih: 2026-02-28
-- Sunucuda çalıştır: psql $DATABASE_URL -f faz1_migration.sql
-- ────────────────────────────────────────────────────────────────────────────

-- 1) warnings tablosuna yeni kolonlar ekle
ALTER TABLE warnings
  ADD COLUMN IF NOT EXISTS note       TEXT,
  ADD COLUMN IF NOT EXISTS points     INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS active     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- 2) mod_cases tablosuna not kolonu ekle
ALTER TABLE mod_cases
  ADD COLUMN IF NOT EXISTS note TEXT;

-- 3) guilds tablosuna modConfig kolonu ekle
ALTER TABLE guilds
  ADD COLUMN IF NOT EXISTS mod_config JSONB DEFAULT '{}'::jsonb;

-- 4) Mevcut uyarıları aktif olarak işaretle (geriye dönük uyumluluk)
UPDATE warnings SET active = TRUE WHERE active IS NULL;

SELECT 'Faz 1 migration tamamlandi!' AS result;
