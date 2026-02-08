require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, seedMetas, seedMetasSPV } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Servir index.html da raiz também (para manter compatibilidade)
app.use(express.static(__dirname));

// Importar rotas
const authRoutes = require('./routes/auth');
const cadastrosRoutes = require('./routes/cadastros');
const estagiariosRoutes = require('./routes/estagiarios');
const suportesRoutes = require('./routes/suportes');
const moderadoresRoutes = require('./routes/moderadores');
const adminsRoutes = require('./routes/admins');
const supervisoresRoutes = require('./routes/supervisores');
const metasRoutes = require('./routes/metas');
const exportRoutes = require('./routes/export');

// Registrar rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/cadastros', cadastrosRoutes);
app.use('/api/estagiarios', estagiariosRoutes);
app.use('/api/suportes', suportesRoutes);
app.use('/api/moderadores', moderadoresRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/supervisores', supervisoresRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/export', exportRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota fallback para SPA - servir index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicializar banco e servidor
async function startServer() {
    try {
        // Inicializar banco de dados
        initializeDatabase();
        seedMetas();
        seedMetasSPV();

        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════╗
║         COMPLEXO RJ - Dashboard Staff Backend         ║
╠═══════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}              ║
║  API Base URL:      http://localhost:${PORT}/api          ║
╚═══════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
