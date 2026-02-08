const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/cadastros - Listar todos
router.get('/', (req, res) => {
    try {
        const cadastros = db.prepare('SELECT * FROM cadastros ORDER BY nome').all();
        res.json(cadastros);
    } catch (error) {
        console.error('Error fetching cadastros:', error);
        res.status(500).json({ error: 'Erro ao buscar cadastros' });
    }
});

// GET /api/cadastros/:id - Buscar por ID
router.get('/:id', (req, res) => {
    try {
        const cadastro = db.prepare('SELECT * FROM cadastros WHERE id = ?').get(req.params.id);
        if (!cadastro) {
            return res.status(404).json({ error: 'Cadastro não encontrado' });
        }
        res.json(cadastro);
    } catch (error) {
        console.error('Error fetching cadastro:', error);
        res.status(500).json({ error: 'Erro ao buscar cadastro' });
    }
});

// POST /api/cadastros - Criar novo (auth)
router.post('/', authenticateToken, (req, res) => {
    try {
        const { id, nome, cidade, cargo } = req.body;

        if (!id || !nome || cidade === undefined || !cargo) {
            return res.status(400).json({ error: 'Campos id, nome, cidade e cargo são obrigatórios' });
        }

        const existing = db.prepare('SELECT id FROM cadastros WHERE id = ?').get(id);
        if (existing) {
            return res.status(409).json({ error: 'Já existe um cadastro com esse ID' });
        }

        db.prepare('INSERT INTO cadastros (id, nome, cidade, cargo) VALUES (?, ?, ?, ?)').run(id, nome, cidade, cargo);

        res.status(201).json({ success: true, id, message: 'Cadastro criado com sucesso' });
    } catch (error) {
        console.error('Error creating cadastro:', error);
        res.status(500).json({ error: 'Erro ao criar cadastro' });
    }
});

// PATCH /api/cadastros/:id - Atualizar campo (auth)
router.patch('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existing = db.prepare('SELECT * FROM cadastros WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Cadastro não encontrado' });
        }

        const allowedFields = ['nome', 'cidade', 'cargo'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }

        const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => updates[field]);
        values.push(id);

        db.prepare(`UPDATE cadastros SET ${setClause} WHERE id = ?`).run(...values);

        res.json({ success: true, message: 'Cadastro atualizado com sucesso' });
    } catch (error) {
        console.error('Error updating cadastro:', error);
        res.status(500).json({ error: 'Erro ao atualizar cadastro' });
    }
});

// DELETE /api/cadastros/:id - Remover (auth)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const existing = db.prepare('SELECT id FROM cadastros WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Cadastro não encontrado' });
        }

        db.prepare('DELETE FROM cadastros WHERE id = ?').run(id);

        res.json({ success: true, message: 'Cadastro removido com sucesso' });
    } catch (error) {
        console.error('Error deleting cadastro:', error);
        res.status(500).json({ error: 'Erro ao remover cadastro' });
    }
});

module.exports = router;
