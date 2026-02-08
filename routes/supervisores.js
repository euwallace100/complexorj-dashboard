const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/supervisores - Listar todos
router.get('/', (req, res) => {
    try {
        const supervisores = db.prepare('SELECT * FROM supervisores ORDER BY nome').all();
        res.json(supervisores);
    } catch (error) {
        console.error('Error fetching supervisores:', error);
        res.status(500).json({ error: 'Erro ao buscar supervisores' });
    }
});

// GET /api/supervisores/:id - Buscar por ID
router.get('/:id', (req, res) => {
    try {
        const supervisor = db.prepare('SELECT * FROM supervisores WHERE id = ?').get(req.params.id);
        if (!supervisor) {
            return res.status(404).json({ error: 'Supervisor não encontrado' });
        }
        res.json(supervisor);
    } catch (error) {
        console.error('Error fetching supervisor:', error);
        res.status(500).json({ error: 'Erro ao buscar supervisor' });
    }
});

// POST /api/supervisores - Criar novo (auth)
router.post('/', authenticateToken, (req, res) => {
    try {
        const { nome, cargo, situacao, discord_id, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, devolucoes, ban, telagem, ticketSS } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Campo nome é obrigatório' });
        }

        const result = db.prepare(`
            INSERT INTO supervisores (nome, cargo, situacao, discord_id, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, devolucoes, ban, telagem, ticketSS)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            nome,
            cargo || 'SPV',
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
            devolucoes || 0,
            ban || 0,
            telagem || 0,
            ticketSS || 0
        );

        res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Supervisor criado com sucesso' });
    } catch (error) {
        console.error('Error creating supervisor:', error);
        res.status(500).json({ error: 'Erro ao criar supervisor' });
    }
});

// PATCH /api/supervisores/:id - Atualizar campo (auth)
router.patch('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existing = db.prepare('SELECT * FROM supervisores WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Supervisor não encontrado' });
        }

        const allowedFields = ['nome', 'cargo', 'situacao', 'discord_id', 'premio', 'horas', 'atSup', 'auxSup', 'atCid', 'denuncia', 'revisao', 'instrucoes', 'entrevistas', 'devolucoes', 'ban', 'telagem', 'ticketSS'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }

        const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => updates[field]);
        values.push(id);

        db.prepare(`UPDATE supervisores SET ${setClause} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM supervisores WHERE id = ?').get(id);
        res.json({ success: true, data: updated, message: 'Supervisor atualizado com sucesso' });
    } catch (error) {
        console.error('Error updating supervisor:', error);
        res.status(500).json({ error: 'Erro ao atualizar supervisor' });
    }
});

// DELETE /api/supervisores/:id - Remover (auth)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM supervisores WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Supervisor não encontrado' });
        }

        db.prepare('DELETE FROM supervisores WHERE id = ?').run(id);

        res.json({ success: true, message: 'Supervisor removido com sucesso' });
    } catch (error) {
        console.error('Error deleting supervisor:', error);
        res.status(500).json({ error: 'Erro ao remover supervisor' });
    }
});

module.exports = router;
