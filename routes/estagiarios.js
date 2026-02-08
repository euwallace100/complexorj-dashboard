const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/estagiarios - Listar todos
router.get('/', (req, res) => {
    try {
        const estagiarios = db.prepare('SELECT * FROM estagiarios ORDER BY nome').all();
        res.json(estagiarios);
    } catch (error) {
        console.error('Error fetching estagiarios:', error);
        res.status(500).json({ error: 'Erro ao buscar estagiários' });
    }
});

// GET /api/estagiarios/:id - Buscar por ID
router.get('/:id', (req, res) => {
    try {
        const estagiario = db.prepare('SELECT * FROM estagiarios WHERE id = ?').get(req.params.id);
        if (!estagiario) {
            return res.status(404).json({ error: 'Estagiário não encontrado' });
        }
        res.json(estagiario);
    } catch (error) {
        console.error('Error fetching estagiario:', error);
        res.status(500).json({ error: 'Erro ao buscar estagiário' });
    }
});

// POST /api/estagiarios - Criar novo (auth)
router.post('/', authenticateToken, (req, res) => {
    try {
        const { nome, cargo, situacao, discord_id, horas, atSup, chat, atCid, aulas, ban } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Campo nome é obrigatório' });
        }

        const result = db.prepare(`
            INSERT INTO estagiarios (nome, cargo, situacao, discord_id, horas, atSup, chat, atCid, aulas, ban)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            nome,
            cargo || 'EST',
            situacao || '✳️MANTÉM',
            discord_id || '',
            horas || 0,
            atSup || 0,
            chat || 0,
            atCid || 0,
            aulas || 0,
            ban || 0
        );

        res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Estagiário criado com sucesso' });
    } catch (error) {
        console.error('Error creating estagiario:', error);
        res.status(500).json({ error: 'Erro ao criar estagiário' });
    }
});

// PATCH /api/estagiarios/:id - Atualizar campo (auth)
router.patch('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existing = db.prepare('SELECT * FROM estagiarios WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Estagiário não encontrado' });
        }

        const allowedFields = ['nome', 'cargo', 'situacao', 'discord_id', 'horas', 'atSup', 'chat', 'atCid', 'aulas', 'ban'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }

        const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => updates[field]);
        values.push(id);

        db.prepare(`UPDATE estagiarios SET ${setClause} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM estagiarios WHERE id = ?').get(id);
        res.json({ success: true, data: updated, message: 'Estagiário atualizado com sucesso' });
    } catch (error) {
        console.error('Error updating estagiario:', error);
        res.status(500).json({ error: 'Erro ao atualizar estagiário' });
    }
});

// DELETE /api/estagiarios/:id - Remover (auth)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM estagiarios WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Estagiário não encontrado' });
        }

        db.prepare('DELETE FROM estagiarios WHERE id = ?').run(id);

        res.json({ success: true, message: 'Estagiário removido com sucesso' });
    } catch (error) {
        console.error('Error deleting estagiario:', error);
        res.status(500).json({ error: 'Erro ao remover estagiário' });
    }
});

module.exports = router;
