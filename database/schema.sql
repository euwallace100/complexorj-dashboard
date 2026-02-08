-- Schema do banco de dados COMPLEXO RJ Dashboard

-- Tabela de usuários para autenticação
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cadastros (staff geral)
CREATE TABLE IF NOT EXISTS cadastros (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cidade INTEGER NOT NULL,
    cargo TEXT NOT NULL
);

-- Tabela de estagiários
CREATE TABLE IF NOT EXISTS estagiarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT DEFAULT 'EST',
    situacao TEXT DEFAULT '✳️MANTÉM',
    discord_id TEXT DEFAULT '',
    horas INTEGER DEFAULT 0,
    atSup INTEGER DEFAULT 0,
    chat INTEGER DEFAULT 0,
    atCid INTEGER DEFAULT 0,
    aulas INTEGER DEFAULT 0,
    ban INTEGER DEFAULT 0
);

-- Tabela de suportes
CREATE TABLE IF NOT EXISTS suportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT DEFAULT 'SUP',
    situacao TEXT DEFAULT '✳️MANTÉM',
    discord_id TEXT DEFAULT '',
    premio TEXT DEFAULT 'NÃO',
    horas INTEGER DEFAULT 0,
    atSup INTEGER DEFAULT 0,
    auxSup INTEGER DEFAULT 0,
    atCid INTEGER DEFAULT 0,
    denuncia INTEGER DEFAULT 0,
    aulas INTEGER DEFAULT 0,
    ban INTEGER DEFAULT 0,
    telagem INTEGER DEFAULT 0,
    ticketSS INTEGER DEFAULT 0
);

-- Tabela de moderadores
CREATE TABLE IF NOT EXISTS moderadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT DEFAULT 'MOD',
    situacao TEXT DEFAULT '✳️MANTÉM',
    discord_id TEXT DEFAULT '',
    premio TEXT DEFAULT 'NÃO',
    horas INTEGER DEFAULT 0,
    atSup INTEGER DEFAULT 0,
    auxSup INTEGER DEFAULT 0,
    atCid INTEGER DEFAULT 0,
    denuncia INTEGER DEFAULT 0,
    revisao INTEGER DEFAULT 0,
    instrucoes INTEGER DEFAULT 0,
    entrevistas INTEGER DEFAULT 0,
    ban INTEGER DEFAULT 0,
    telagem INTEGER DEFAULT 0,
    ticketSS INTEGER DEFAULT 0
);

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT DEFAULT 'ADM',
    situacao TEXT DEFAULT '✳️MANTÉM',
    discord_id TEXT DEFAULT '',
    premio TEXT DEFAULT 'NÃO',
    horas INTEGER DEFAULT 0,
    atSup INTEGER DEFAULT 0,
    auxSup INTEGER DEFAULT 0,
    atCid INTEGER DEFAULT 0,
    denuncia INTEGER DEFAULT 0,
    revisao INTEGER DEFAULT 0,
    instrucoes INTEGER DEFAULT 0,
    entrevistas INTEGER DEFAULT 0,
    devolucoes INTEGER DEFAULT 0,
    ban INTEGER DEFAULT 0,
    telagem INTEGER DEFAULT 0,
    ticketSS INTEGER DEFAULT 0
);

-- Tabela de supervisores
CREATE TABLE IF NOT EXISTS supervisores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT DEFAULT 'SPV',
    situacao TEXT DEFAULT '✳️MANTÉM',
    discord_id TEXT DEFAULT '',
    premio TEXT DEFAULT 'NÃO',
    horas INTEGER DEFAULT 0,
    atSup INTEGER DEFAULT 0,
    auxSup INTEGER DEFAULT 0,
    atCid INTEGER DEFAULT 0,
    denuncia INTEGER DEFAULT 0,
    revisao INTEGER DEFAULT 0,
    instrucoes INTEGER DEFAULT 0,
    entrevistas INTEGER DEFAULT 0,
    devolucoes INTEGER DEFAULT 0,
    ban INTEGER DEFAULT 0,
    telagem INTEGER DEFAULT 0,
    ticketSS INTEGER DEFAULT 0
);

-- Tabela de metas
CREATE TABLE IF NOT EXISTS metas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cargo TEXT NOT NULL,
    metrica TEXT NOT NULL,
    promocao INTEGER DEFAULT 0,
    premiacao INTEGER DEFAULT 0,
    UNIQUE(cargo, metrica)
);
