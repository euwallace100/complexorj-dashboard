const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/admins - Listar todos
router.get('/', (req, res) => {
    try {
        const admins = db.prepare('SELECT * FROM admins ORDER BY nome').all();
        res.json(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ error: 'Erro ao buscar administradores' });
    }
});

// GET /api/admins/:id - Buscar por ID
router.get('/:id', (req, res) => {
    try {
        const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.params.id);
        if (!admin) {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }
        res.json(admin);
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ error: 'Erro ao buscar administrador' });
    }
});

// POST /api/admins - Criar novo (auth)
router.post('/', authenticateToken, (req, res) => {
    try {
        const { nome, cargo, situacao, discord_id, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, devolucoes, ban, telagem, ticketSS } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Campo nome é obrigatório' });
        }

        const result = db.prepare(`
            INSERT INTO admins (nome, cargo, situacao, discord_id, premio, horas, atSup, auxSup, atCid, denuncia, revisao, instrucoes, entrevistas, devolucoes, ban, telagem, ticketSS)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            nome,
            cargo || 'ADM',
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

        res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Administrador criado com sucesso' });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ error: 'Erro ao criar administrador' });
    }
});

// PATCH /api/admins/:id - Atualizar campo (auth)
router.patch('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existing = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }

        const allowedFields = ['nome', 'cargo', 'situacao', 'discord_id', 'premio', 'horas', 'atSup', 'auxSup', 'atCid', 'denuncia', 'revisao', 'instrucoes', 'entrevistas', 'devolucoes', 'ban', 'telagem', 'ticketSS'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }

        const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => updates[field]);
        values.push(id);

        db.prepare(`UPDATE admins SET ${setClause} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
        res.json({ success: true, data: updated, message: 'Administrador atualizado com sucesso' });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({ error: 'Erro ao atualizar administrador' });
    }
});

// DELETE /api/admins/:id - Remover (auth)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM admins WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }

        db.prepare('DELETE FROM admins WHERE id = ?').run(id);

        res.json({ success: true, message: 'Administrador removido com sucesso' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ error: 'Erro ao remover administrador' });
    }
});

module.exports = router;
