const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/suportes - Listar todos
router.get('/', (req, res) => {
    try {
        const suportes = db.prepare('SELECT * FROM suportes ORDER BY nome').all();
        res.json(suportes);
    } catch (error) {
        console.error('Error fetching suportes:', error);
        res.status(500).json({ error: 'Erro ao buscar suportes' });
    }
});

// GET /api/suportes/:id - Buscar por ID
router.get('/:id', (req, res) => {
    try {
        const suporte = db.prepare('SELECT * FROM suportes WHERE id = ?').get(req.params.id);
        if (!suporte) {
            return res.status(404).json({ error: 'Suporte não encontrado' });
        }
        res.json(suporte);
    } catch (error) {
        console.error('Error fetching suporte:', error);
        res.status(500).json({ error: 'Erro ao buscar suporte' });
    }
});

// POST /api/suportes - Criar novo (auth)
router.post('/', authenticateToken, (req, res) => {
    try {
        const { nome, cargo, situacao, discord_id, premio, horas, atSup, auxSup, atCid, denuncia, aulas, ban, telagem, ticketSS } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Campo nome é obrigatório' });
        }

        const result = db.prepare(`
            INSERT INTO suportes (nome, cargo, situacao, discord_id, premio, horas, atSup, auxSup, atCid, denuncia, aulas, ban, telagem, ticketSS)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            nome,
            cargo || 'SUP',
            situacao || '✳️MANTÉM',
            discord_id || '',
            premio || 'NÃO',
            horas || 0,
            atSup || 0,
            auxSup || 0,
            atCid || 0,
            denuncia || 0,
            aulas || 0,
            ban || 0,
            telagem || 0,
            ticketSS || 0
        );

        res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Suporte criado com sucesso' });
    } catch (error) {
        console.error('Error creating suporte:', error);
        res.status(500).json({ error: 'Erro ao criar suporte' });
    }
});

// PATCH /api/suportes/:id - Atualizar campo (auth)
router.patch('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existing = db.prepare('SELECT * FROM suportes WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Suporte não encontrado' });
        }

        const allowedFields = ['nome', 'cargo', 'situacao', 'discord_id', 'premio', 'horas', 'atSup', 'auxSup', 'atCid', 'denuncia', 'aulas', 'ban', 'telagem', 'ticketSS'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }

        const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => updates[field]);
        values.push(id);

        db.prepare(`UPDATE suportes SET ${setClause} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM suportes WHERE id = ?').get(id);
        res.json({ success: true, data: updated, message: 'Suporte atualizado com sucesso' });
    } catch (error) {
        console.error('Error updating suporte:', error);
        res.status(500).json({ error: 'Erro ao atualizar suporte' });
    }
});

// DELETE /api/suportes/:id - Remover (auth)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM suportes WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Suporte não encontrado' });
        }

        db.prepare('DELETE FROM suportes WHERE id = ?').run(id);

        res.json({ success: true, message: 'Suporte removido com sucesso' });
    } catch (error) {
        console.error('Error deleting suporte:', error);
        res.status(500).json({ error: 'Erro ao remover suporte' });
    }
});

module.exports = router;
