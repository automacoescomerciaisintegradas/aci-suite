-- Migration: 0007_sync_users_columns.sql
-- Descricao: Completa colunas da tabela users para schema social

ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
