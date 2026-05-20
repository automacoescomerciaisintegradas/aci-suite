-- Migration: 0006_social_core_schema.sql
-- Descricao: Schema social (usuarios, posts, comentarios, chat, grupos, reacoes e pagamentos)

PRAGMA foreign_keys = ON;

-- USUARIOS
CREATE TABLE IF NOT EXISTS users (
  id TEXT DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  provider TEXT DEFAULT 'local',
  providerId TEXT,
  emailVerified INTEGER DEFAULT 0,
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- GRUPOS
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT DEFAULT (lower(hex(randomblob(16)))) NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','private','hidden')),
  members_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- POSTS
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT DEFAULT (lower(hex(randomblob(16)))) NOT NULL UNIQUE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','friends','group')),
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- COMENTARIOS
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT DEFAULT (lower(hex(randomblob(16)))) NOT NULL UNIQUE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- CONVERSAS
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT DEFAULT (lower(hex(randomblob(16)))) NOT NULL UNIQUE,
  title TEXT,
  is_group INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- PARTICIPANTES DE CONVERSA
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member','admin')),
  joined_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (conversation_id, user_id)
);

-- MENSAGENS
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  attachments TEXT,
  read_by TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- MEMBROS DE GRUPO
CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member','moderator','owner')),
  joined_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, user_id)
);

-- REACOES
CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment','message')),
  target_id INTEGER NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (user_id, target_type, target_id, reaction_type)
);

-- CARTEIRAS
CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- PAGAMENTOS PIX
CREATE TABLE IF NOT EXISTS pix_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT DEFAULT (lower(hex(randomblob(16)))) NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  gateway_payment_id TEXT,
  pix_key TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','expired','failed')),
  expires_at TEXT,
  paid_at TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- TRANSACOES
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_user_id TEXT NOT NULL REFERENCES wallets(user_id) ON DELETE CASCADE,
  pix_payment_id INTEGER REFERENCES pix_payments(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('credit','debit','refund','fee')),
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2),
  balance_after NUMERIC(12,2),
  description TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- WEBHOOK LOGS (aproveita tabela existente se ja criada em migration anterior)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_source TEXT NOT NULL,
  event_type TEXT,
  payload TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- INDICES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_user_id ON pix_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_user_id ON transactions(wallet_user_id, created_at);
