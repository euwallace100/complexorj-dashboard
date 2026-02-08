# Deploy no VPS Ubuntu - Hostinger

## 1. Conectar ao VPS via SSH

```bash
ssh root@SEU_IP_DO_VPS
```

---

## 2. Atualizar o sistema e instalar dependências

```bash
apt update && apt upgrade -y
apt install -y curl git build-essential
```

---

## 3. Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Deve mostrar v20.x.x
```

---

## 4. Instalar PM2 (gerenciador de processos)

```bash
npm install -g pm2
```

---

## 5. Criar pasta do projeto

```bash
mkdir -p /var/www/complexorj
cd /var/www/complexorj
```

---

## 6. Fazer upload dos arquivos

**Opção A - Via Git (recomendado):**
Se tiver no GitHub:
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPO.git .
```

**Opção B - Via SFTP:**
Use FileZilla ou WinSCP para enviar os arquivos para `/var/www/complexorj`

Arquivos necessarios:
- server.js
- package.json
- index.html
- /routes (pasta)
- /database (pasta, sem o arquivo .db)
- /middleware (pasta)

---

## 7. Instalar dependencias do projeto

```bash
cd /var/www/complexorj
npm install
```

---

## 8. Criar arquivo .env

```bash
nano .env
```

Cole o conteudo:
```
PORT=3000
DB_PATH=./database/dashboard.db
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
ADMIN_PASSWORD="complexorjmagic2026@#$"
```

Salvar: `Ctrl+X`, depois `Y`, depois `Enter`

---

## 9. Iniciar o servidor com PM2

```bash
pm2 start server.js --name complexorj
pm2 save
pm2 startup  # Seguir instrucoes para iniciar automaticamente
```

Verificar se esta rodando:
```bash
pm2 status
pm2 logs complexorj
```

---

## 10. Instalar e configurar Nginx

```bash
apt install -y nginx
```

Criar configuracao:
```bash
nano /etc/nginx/sites-available/complexorj
```

Cole:
```nginx
server {
    listen 80;
    server_name SEU_IP_OU_DOMINIO;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar o site:
```bash
ln -s /etc/nginx/sites-available/complexorj /etc/nginx/sites-enabled/
nginx -t  # Testar configuracao
systemctl restart nginx
```

---

## 11. Configurar Firewall

```bash
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS (para futuro)
ufw enable
```

---

## 12. Acessar o site

Abra no navegador:
```
http://SEU_IP_DO_VPS
```

---

## Comandos uteis PM2

```bash
pm2 status          # Ver status
pm2 logs complexorj # Ver logs
pm2 restart complexorj  # Reiniciar
pm2 stop complexorj     # Parar
```

---

## Futuro: Adicionar HTTPS com Let's Encrypt

Quando tiver dominio configurado:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seudominio.com
```
