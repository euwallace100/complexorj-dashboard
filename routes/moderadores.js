const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/moderadores - Listar todos
router.get('/', (req, res) => {
    try {
        const moderadores = db.prepare('SELECT * FROM moderadores ORDER BY nome').all();
        res.json(moderadores);
    } catch (error) {
        console.error('Error fetching moderadores:', error);
        res.status(500).json({ error: 'Erro ao buscar moderadores' });
    }
});

// GET /api/moderadores/:id - Buscar por ID
router.get('/:id', (req, res) => {
    try {
        const moderador = db.prepare('SELECT * FROM moderadores WHERE id = ?').get(req.params.id);
        if (!moderador) {
            return res.status(404).json({ error: 'Moderador não encontrado' });
        }
        res.json(moderador);
    } catch (error) {
        console.error('Error fetching moderador:', error);
        res.status(500).json({ error: 'Erro ao buscar moderador' });
    }
});

// POST /api/moderadores - Criar novo (auth)
router.post('/', authenticateToken, (req, res) => {
    try {
        const { nome, cargo, situacao, discord_id, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, ban, telagem, ticketSS } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Campo nome é obrigatório' });
        }

        const result = db.prepare(`
            INSERT INTO moderadores (nome, cargo, situacao, discord_id, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, ban, telagem, ticketSS)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            nome,
            cargo || 'MOD',
            situacao || '✳️MANTÉM',
            discord_id || '',
            premio || 'NÃO',
            horas || 0,
            atSup || 0,
            auxSup || 0,
            atCid || 0,
            denuncia || 0,
            revisao || 0,
            instrucoes || 0,
            entrevistas || 0,
            ban || 0,
            telagem || 0,
            ticketSS || 0
        );

        res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Moderador criado com sucesso' });
    } catch (error) {
        console.error('Error creating moderador:', error);
        res.status(500).json({ error: 'Erro ao criar moderador' });
    }
});

// PATCH /api/moderadores/:id - Atualizar campo (auth)
router.patch('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existing = db.prepare('SELECT * FROM moderadores WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Moderador não encontrado' });
        }

        const allowedFields = ['nome', 'cargo', 'situacao', 'discord_id', 'premio', 'horas', 'atSup', 'auxSup', 'atCid', 'denuncia', 'revisao', 'instrucoes', 'entrevistas', 'ban', 'telagem', 'ticketSS'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }

        const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => updates[field]);
        values.push(id);

        db.prepare(`UPDATE moderadores SET ${setClause} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM moderadores WHERE id = ?').get(id);
        res.json({ success: true, data: updated, message: 'Moderador atualizado com sucesso' });
    } catch (error) {
        console.error('Error updating moderador:', error);
        res.status(500).json({ error: 'Erro ao atualizar moderador' });
    }
});

// DELETE /api/moderadores/:id - Remover (auth)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM moderadores WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Moderador não encontrado' });
        }

        db.prepare('DELETE FROM moderadores WHERE id = ?').run(id);

        res.json({ success: true, message: 'Moderador removido com sucesso' });
    } catch (error) {
        console.error('Error deleting moderador:', error);
        res.status(500).json({ error: 'Erro ao remover moderador' });
    }
});

module.exports = router;
