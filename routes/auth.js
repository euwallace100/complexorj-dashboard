const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { db } = require('../database/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'complexorjmagic2026@#$';

// POST /api/auth/login - Login com senha
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Senha requerida' });
        }

        // Verificar senha admin simples (como no sistema original)
        if (password === ADMIN_PASSWORD) {
            const token = generateToken({ role: 'admin', username: 'admin' });
            return res.json({
                success: true,
                token,
                message: 'Autenticado com sucesso'
            });
        }

        // Verificar contra usuários no banco (para futuras expansões)
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
        if (user) {
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (validPassword) {
                const token = generateToken({ role: 'admin', username: user.username, userId: user.id });
                return res.json({
                    success: true,
                    token,
                    message: 'Autenticado com sucesso'
                });
            }
        }

        return res.status(401).json({ error: 'Senha incorreta' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// POST /api/auth/register - Registrar novo usuário (protegido)
router.post('/register', authenticateToken, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password requeridos' });
        }

        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Usuário já existe' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);

        res.status(201).json({
            success: true,
            userId: result.lastInsertRowid,
            message: 'Usuário criado com sucesso'
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
