const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/export - Exportar todos os dados como JSON
router.get('/', (req, res) => {
    try {
        const estagiarios = db.prepare('SELECT * FROM estagiarios ORDER BY nome').all();
        const suportes = db.prepare('SELECT * FROM suportes ORDER BY nome').all();
        const moderadores = db.prepare('SELECT * FROM moderadores ORDER BY nome').all();
        const admins = db.prepare('SELECT * FROM admins ORDER BY nome').all();
        const supervisores = db.prepare('SELECT * FROM supervisores ORDER BY nome').all();
        const cadastros = db.prepare('SELECT * FROM cadastros ORDER BY nome').all();

        // Metas em formato objeto
        const metasRows = db.prepare('SELECT * FROM metas ORDER BY cargo, metrica').all();
        const metas = {};
        metasRows.forEach(row => {
            if (!metas[row.cargo]) {
                metas[row.cargo] = {};
            }
            metas[row.cargo][row.metrica] = {
                promocao: row.promocao,
                premiacao: row.premiacao
            };
        });

        const data = {
            estagiarios,
            suportes,
            moderadores,
            admins,
            supervisores,
            cadastros,
            metas,
            exportedAt: new Date().toISOString()
        };

        res.json(data);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Erro ao exportar dados' });
    }
});

// POST /api/import - Importar dados de JSON (auth)
router.post('/import', authenticateToken, (req, res) => {
    try {
        const { estagiarios, suportes, moderadores, admins, supervisores, cadastros, metas } = req.body;

        const importData = db.transaction(() => {
            // Importar cadastros
            if (cadastros && Array.isArray(cadastros)) {
                const insertCadastro = db.prepare(`
                    INSERT OR REPLACE INTO cadastros (id, nome, cidade, cargo)
                    VALUES (?, ?, ?, ?)
                `);
                cadastros.forEach(c => {
                    insertCadastro.run(c.id, c.nome, c.cidade, c.cargo);
                });
            }

            // Importar estagiarios
            if (estagiarios && Array.isArray(estagiarios)) {
                db.prepare('DELETE FROM estagiarios').run();
                const insertEst = db.prepare(`
                    INSERT INTO estagiarios (nome, cargo, situacao, horas, atSup, chat, atCid, aulas, ban)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                estagiarios.forEach(e => {
                    insertEst.run(e.nome, e.cargo, e.situacao, e.horas, e.atSup, e.chat, e.atCid, e.aulas, e.ban);
                });
            }

            // Importar suportes
            if (suportes && Array.isArray(suportes)) {
                db.prepare('DELETE FROM suportes').run();
                const insertSup = db.prepare(`
                    INSERT INTO suportes (nome, cargo, situacao, premio, horas, atSup, auxSup, atCid, denuncia, aulas, ban, telagem, ticketSS)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                suportes.forEach(s => {
                    insertSup.run(s.nome, s.cargo, s.situacao, s.premio || 'NÃO', s.horas, s.atSup, s.auxSup, s.atCid, s.denuncia, s.aulas, s.ban, s.telagem, s.ticketSS);
                });
            }

            // Importar moderadores
            if (moderadores && Array.isArray(moderadores)) {
                db.prepare('DELETE FROM moderadores').run();
                const insertMod = db.prepare(`
                    INSERT INTO moderadores (nome, cargo, situacao, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, ban, telagem, ticketSS)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                moderadores.forEach(m => {
                    insertMod.run(m.nome, m.cargo, m.situacao, m.premio, m.horas, m.atSup, m.auxSup, m.atCid, m.denuncia, m.revisao, m.instrucoes, m.entrevistas, m.ban, m.telagem, m.ticketSS);
                });
            }

            // Importar admins
            if (admins && Array.isArray(admins)) {
                db.prepare('DELETE FROM admins').run();
                const insertAdm = db.prepare(`
                    INSERT INTO admins (nome, cargo, situacao, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, devolucoes, ban, telagem, ticketSS)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                admins.forEach(a => {
                    insertAdm.run(a.nome, a.cargo, a.situacao, a.premio, a.horas, a.atSup, a.auxSup, a.atCid, a.denuncia, a.revisao, a.instrucoes, a.entrevistas, a.devolucoes, a.ban, a.telagem, a.ticketSS);
                });
            }

            // Importar supervisores
            if (supervisores && Array.isArray(supervisores)) {
                db.prepare('DELETE FROM supervisores').run();
                const insertSpv = db.prepare(`
                    INSERT INTO supervisores (nome, cargo, situacao, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, devolucoes, ban, telagem, ticketSS)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                supervisores.forEach(s => {
                    insertSpv.run(s.nome, s.cargo, s.situacao, s.premio, s.horas, s.atSup, s.auxSup, s.atCid, s.denuncia, s.revisao, s.instrucoes, s.entrevistas, s.devolucoes, s.ban, s.telagem, s.ticketSS);
                });
            }

            // Importar metas
            if (metas && typeof metas === 'object') {
                const upsertMeta = db.prepare(`
                    INSERT INTO metas (cargo, metrica, promocao, premiacao)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(cargo, metrica)
                    DO UPDATE SET promocao = excluded.promocao, premiacao = excluded.premiacao
                `);
                for (const [cargo, metricas] of Object.entries(metas)) {
                    for (const [metrica, valores] of Object.entries(metricas)) {
                        upsertMeta.run(cargo, metrica, valores.promocao || 0, valores.premiacao || 0);
                    }
                }
            }
        });

        importData();

        res.json({ success: true, message: 'Dados importados com sucesso' });
    } catch (error) {
        console.error('Error importing data:', error);
        res.status(500).json({ error: 'Erro ao importar dados' });
    }
});

module.exports = router;
