const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './database/dashboard.db';
const dbDir = path.dirname(dbPath);

// Garantir que o diretório existe
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Inicializar schema
function initializeDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('Database initialized');

    // Migrations - adicionar coluna discord_id se não existir
    const tables = ['estagiarios', 'suportes', 'moderadores', 'admins', 'supervisores'];
    for (const table of tables) {
        try {
            const columns = db.prepare(`PRAGMA table_info(${table})`).all();
            const hasDiscordId = columns.some(col => col.name === 'discord_id');
            if (!hasDiscordId) {
                db.exec(`ALTER TABLE ${table} ADD COLUMN discord_id TEXT DEFAULT ''`);
                console.log(`Added discord_id column to ${table}`);
            }
        } catch (err) {
            console.error(`Error adding discord_id to ${table}:`, err.message);
        }
    }

    // Migration - adicionar coluna premio em suportes se não existir
    try {
        const columns = db.prepare(`PRAGMA table_info(suportes)`).all();
        const hasPremio = columns.some(col => col.name === 'premio');
        if (!hasPremio) {
            db.exec(`ALTER TABLE suportes ADD COLUMN premio TEXT DEFAULT 'NÃO'`);
            console.log('Added premio column to suportes');
        }
    } catch (err) {
        console.error('Error adding premio to suportes:', err.message);
    }
}

// Função para inserir metas padrão se não existirem
function seedMetas() {
    const count = db.prepare('SELECT COUNT(*) as count FROM metas').get();
    if (count.count > 0) return;

    const metas = {
        EST: {
            HORAS: { promocao: 50, premiacao: 100 },
            'AT.SUPORTE': { promocao: 300, premiacao: 400 },
            'CHAT DUVIDAS': { promocao: 50, premiacao: 100 },
            'AT.CIDADE': { promocao: 300, premiacao: 400 },
            AULAS: { promocao: 1, premiacao: 4 },
            'BAN HACK': { promocao: 0, premiacao: 40 }
        },
        SUP: {
            HORAS: { promocao: 90, premiacao: 150 },
            'AT.SUPORTE': { promocao: 300, premiacao: 400 },
            'AUX.SUPORTE': { promocao: 150, premiacao: 250 },
            'AT.CIDADE': { promocao: 300, premiacao: 500 },
            'TCKT DENUNCIA': { promocao: 120, premiacao: 200 },
            AULAS: { promocao: 1, premiacao: 8 },
            'BAN HACK': { promocao: 10, premiacao: 30 }
        },
        MOD: {
            HORAS: { promocao: 100, premiacao: 180 },
            'AT.SUPORTE': { promocao: 60, premiacao: 150 },
            'AUX.SUPORTE': { promocao: 150, premiacao: 250 },
            'AT.CIDADE': { promocao: 200, premiacao: 400 },
            'TCKT DENUNCIA': { promocao: 80, premiacao: 150 },
            'TCKT REVISÃO': { promocao: 100, premiacao: 200 },
            'INSTRUÇÕES': { promocao: 5, premiacao: 10 }
        },
        ADM: {
            HORAS: { promocao: 120, premiacao: 200 },
            'AT.SUPORTE': { promocao: 60, premiacao: 150 },
            'AUX.SUPORTE': { promocao: 200, premiacao: 300 },
            'AT.CIDADE': { promocao: 100, premiacao: 200 },
            'TCKT DENUNCIA': { promocao: 80, premiacao: 150 },
            'TCKT REVISÃO': { promocao: 100, premiacao: 200 },
            'INSTRUÇÕES': { promocao: 5, premiacao: 10 }
        },
        SPV: {
            HORAS: { promocao: 50, premiacao: 100 },
            'AT.SUPORTE': { promocao: 30, premiacao: 60 },
            'AUX.SUPORTE': { promocao: 50, premiacao: 100 },
            'AT.CIDADE': { promocao: 50, premiacao: 100 },
            'TCKT DENUNCIA': { promocao: 20, premiacao: 50 },
            'TCKT REVISÃO': { promocao: 50, premiacao: 100 },
            'INSTRUÇÕES': { promocao: 0, premiacao: 5 }
        }
    };

    const insert = db.prepare('INSERT INTO metas (cargo, metrica, promocao, premiacao) VALUES (?, ?, ?, ?)');
    const insertMany = db.transaction((metas) => {
        for (const [cargo, metricas] of Object.entries(metas)) {
            for (const [metrica, valores] of Object.entries(metricas)) {
                insert.run(cargo, metrica, valores.promocao, valores.premiacao);
            }
        }
    });
    insertMany(metas);
    console.log('Default metas seeded');
}

// Função para adicionar metas SPV se não existirem
function seedMetasSPV() {
    const spvCount = db.prepare("SELECT COUNT(*) as count FROM metas WHERE cargo = 'SPV'").get();
    if (spvCount.count > 0) return;

    const metasSPV = {
        HORAS: { promocao: 50, premiacao: 100 },
        'AT.SUPORTE': { promocao: 30, premiacao: 60 },
        'AUX.SUPORTE': { promocao: 50, premiacao: 100 },
        'AT.CIDADE': { promocao: 50, premiacao: 100 },
        'TCKT DENUNCIA': { promocao: 20, premiacao: 50 },
        'TCKT REVISÃO': { promocao: 50, premiacao: 100 },
        'INSTRUÇÕES': { promocao: 0, premiacao: 5 }
    };

    const insert = db.prepare('INSERT INTO metas (cargo, metrica, promocao, premiacao) VALUES (?, ?, ?, ?)');
    for (const [metrica, valores] of Object.entries(metasSPV)) {
        insert.run('SPV', metrica, valores.promocao, valores.premiacao);
    }
    console.log('SPV metas seeded');
}

module.exports = { db, initializeDatabase, seedMetas, seedMetasSPV };
