-- Migration: 0005_create_users_table.sql
-- Descricao: Tabela users para compatibilidade com fluxos que usam users em vez de profiles

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  provider TEXT NOT NULL,
  providerId TEXT,
  emailVerified INTEGER DEFAULT 0,
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
