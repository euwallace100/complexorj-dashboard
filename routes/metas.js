const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/metas - Listar todas as metas (formato objeto)
router.get('/', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM metas ORDER BY cargo, metrica').all();

        // Converter para formato de objeto aninhado
        const metas = {};
        rows.forEach(row => {
            if (!metas[row.cargo]) {
                metas[row.cargo] = {};
            }
            metas[row.cargo][row.metrica] = {
                promocao: row.promocao,
                premiacao: row.premiacao
            };
        });

        res.json(metas);
    } catch (error) {
        console.error('Error fetching metas:', error);
        res.status(500).json({ error: 'Erro ao buscar metas' });
    }
});

// GET /api/metas/:cargo - Buscar metas por cargo
router.get('/:cargo', (req, res) => {
    try {
        const { cargo } = req.params;
        const rows = db.prepare('SELECT * FROM metas WHERE cargo = ? ORDER BY metrica').all(cargo);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Metas não encontradas para este cargo' });
        }

        const metas = {};
        rows.forEach(row => {
            metas[row.metrica] = {
                promocao: row.promocao,
                premiacao: row.premiacao
            };
        });

        res.json(metas);
    } catch (error) {
        console.error('Error fetching metas:', error);
        res.status(500).json({ error: 'Erro ao buscar metas' });
    }
});

// POST /api/metas - Criar/atualizar meta (auth)
router.post('/', authenticateToken, (req, res) => {
    try {
        const { cargo, metrica, promocao, premiacao } = req.body;

        if (!cargo || !metrica) {
            return res.status(400).json({ error: 'Campos cargo e metrica são obrigatórios' });
        }

        // Upsert: inserir ou atualizar
        db.prepare(`
            INSERT INTO metas (cargo, metrica, promocao, premiacao)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(cargo, metrica)
            DO UPDATE SET promocao = excluded.promocao, premiacao = excluded.premiacao
        `).run(cargo, metrica, promocao || 0, premiacao || 0);

        res.status(201).json({ success: true, message: 'Meta salva com sucesso' });
    } catch (error) {
        console.error('Error creating meta:', error);
        res.status(500).json({ error: 'Erro ao criar meta' });
    }
});

// PATCH /api/metas/:cargo/:metrica - Atualizar meta específica (auth)
router.patch('/:cargo/:metrica', authenticateToken, (req, res) => {
    try {
        const { cargo, metrica } = req.params;
        const { promocao, premiacao } = req.body;

        const existing = db.prepare('SELECT * FROM metas WHERE cargo = ? AND metrica = ?').get(cargo, metrica);
        if (!existing) {
            return res.status(404).json({ error: 'Meta não encontrada' });
        }

        const updates = [];
        const values = [];

        if (promocao !== undefined) {
            updates.push('promocao = ?');
            values.push(promocao);
        }
        if (premiacao !== undefined) {
            updates.push('premiacao = ?');
            values.push(premiacao);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }

        values.push(cargo, metrica);
        db.prepare(`UPDATE metas SET ${updates.join(', ')} WHERE cargo = ? AND metrica = ?`).run(...values);

        res.json({ success: true, message: 'Meta atualizada com sucesso' });
    } catch (error) {
        console.error('Error updating meta:', error);
        res.status(500).json({ error: 'Erro ao atualizar meta' });
    }
});

// PUT /api/metas - Atualizar todas as metas de uma vez (auth)
router.put('/', authenticateToken, (req, res) => {
    try {
        const metas = req.body;

        if (!metas || typeof metas !== 'object') {
            return res.status(400).json({ error: 'Formato inválido de metas' });
        }

        const upsert = db.prepare(`
            INSERT INTO metas (cargo, metrica, promocao, premiacao)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(cargo, metrica)
            DO UPDATE SET promocao = excluded.promocao, premiacao = excluded.premiacao
        `);

        const updateMany = db.transaction((metas) => {
            for (const [cargo, metricas] of Object.entries(metas)) {
                for (const [metrica, valores] of Object.entries(metricas)) {
                    upsert.run(cargo, metrica, valores.promocao || 0, valores.premiacao || 0);
                }
            }
        });

        updateMany(metas);
        res.json({ success: true, message: 'Metas atualizadas com sucesso' });
    } catch (error) {
        console.error('Error updating metas:', error);
        res.status(500).json({ error: 'Erro ao atualizar metas' });
    }
});

// DELETE /api/metas/:cargo/:metrica - Remover meta (auth)
router.delete('/:cargo/:metrica', authenticateToken, (req, res) => {
    try {
        const { cargo, metrica } = req.params;

        const existing = db.prepare('SELECT * FROM metas WHERE cargo = ? AND metrica = ?').get(cargo, metrica);
        if (!existing) {
            return res.status(404).json({ error: 'Meta não encontrada' });
        }

        db.prepare('DELETE FROM metas WHERE cargo = ? AND metrica = ?').run(cargo, metrica);

        res.json({ success: true, message: 'Meta removida com sucesso' });
    } catch (error) {
        console.error('Error deleting meta:', error);
        res.status(500).json({ error: 'Erro ao remover meta' });
    }
});

module.exports = router;
