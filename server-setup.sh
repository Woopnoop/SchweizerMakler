#!/bin/bash
set -e

echo "=== 1/6: Datenbank einrichten ==="
sudo -u postgres psql -c "CREATE DATABASE maklertoolkit;" 2>/dev/null || echo "DB existiert bereits"
sudo -u postgres psql -c "CREATE USER makler WITH PASSWORD 'makler2026';" 2>/dev/null || echo "User existiert bereits"
sudo -u postgres psql -c "GRANT ALL ON DATABASE maklertoolkit TO makler;" 2>/dev/null || true
sudo -u postgres psql -d maklertoolkit -c "GRANT ALL ON SCHEMA public TO makler;" 2>/dev/null || true

echo "=== 2/6: Tabellen erstellen ==="
cd /opt/SchweizerMakler/webapp
DATABASE_URL="postgresql://makler:makler2026@localhost/maklertoolkit" node -e "
const {Pool} = require('pg');
const p = new Pool({connectionString: process.env.DATABASE_URL});
p.query(\`
  CREATE TABLE IF NOT EXISTS makler(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,display_name TEXT NOT NULL,company_name TEXT,phone TEXT,logo_url TEXT,subscription_tier TEXT DEFAULT 'basis',stripe_customer_id TEXT,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,portal TEXT NOT NULL,url TEXT NOT NULL,title TEXT NOT NULL,location TEXT DEFAULT '',current_price NUMERIC NOT NULL,listing_type TEXT DEFAULT 'kauf',area_sqm NUMERIC,rooms NUMERIC,standort_score NUMERIC,price_history JSONB DEFAULT '[]',notizen TEXT DEFAULT '',received_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS objekte(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,titel TEXT NOT NULL,beschreibung TEXT,adresse TEXT,plz TEXT,stadt TEXT,location_lat NUMERIC,location_lon NUMERIC,preis NUMERIC,listing_type TEXT NOT NULL,wohnflaeche NUMERIC,grundstueck NUMERIC,zimmer NUMERIC,baujahr INTEGER,energieausweis JSONB,ausstattung JSONB,bilder TEXT[],status TEXT DEFAULT 'aktiv',created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS interessenten(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,vorname TEXT NOT NULL,nachname TEXT NOT NULL,email TEXT,telefon TEXT,notizen TEXT,suchkriterien JSONB,dsgvo_einwilligung_am TIMESTAMPTZ,created_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS termine(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),makler_id UUID REFERENCES makler(id) ON DELETE CASCADE,objekt_id UUID REFERENCES objekte(id) ON DELETE SET NULL,interessent_id UUID REFERENCES interessenten(id) ON DELETE SET NULL,termin_datum TIMESTAMPTZ NOT NULL,notizen TEXT,status TEXT DEFAULT 'geplant',created_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS stadtteile(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),name TEXT NOT NULL,stadt TEXT NOT NULL,einwohner INTEGER,infrastruktur_score NUMERIC,anbindung_score NUMERIC,nahversorgung_score NUMERIC,gruen_score NUMERIC,gesamt_score NUMERIC,datenstand DATE,quellenangabe TEXT NOT NULL);
\`).then(() => {
  const b = require('bcryptjs');
  const h = b.hashSync('gast1', 12);
  return p.query(\"INSERT INTO makler(id,email,password_hash,display_name,subscription_tier) VALUES('00000000-0000-0000-0000-000000000001','gast','\"+h+\"','Gast','pro') ON CONFLICT(email) DO NOTHING\");
}).then(() => { console.log('Tabellen + Gast-User OK'); p.end(); }).catch(e => { console.error(e); p.end(); });
"

echo "=== 3/6: Environment-Datei erstellen ==="
cat > /opt/SchweizerMakler/webapp/.env.local << 'ENVEOF'
DATABASE_URL=postgresql://makler:makler2026@localhost/maklertoolkit
JWT_SECRET=schweizermakler-jwt-secret-2026-hetzner
ENVEOF

echo "=== 4/6: Next.js bauen ==="
cd /opt/SchweizerMakler/webapp
DATABASE_URL="postgresql://makler:makler2026@localhost/maklertoolkit" JWT_SECRET="schweizermakler-jwt-secret-2026-hetzner" npx next build

echo "=== 5/6: Systemd Service erstellen ==="
cat > /etc/systemd/system/maklertoolkit.service << 'SERVICEEOF'
[Unit]
Description=MaklerToolkit Web App
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/SchweizerMakler/webapp
ExecStart=/usr/bin/node /opt/SchweizerMakler/webapp/node_modules/.bin/next start -p 3001
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://makler:makler2026@localhost/maklertoolkit
Environment=JWT_SECRET=schweizermakler-jwt-secret-2026-hetzner
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable maklertoolkit
systemctl restart maklertoolkit
sleep 3
systemctl status maklertoolkit --no-pager

echo "=== 6/6: Nginx Reverse Proxy ==="
cat > /etc/nginx/sites-available/maklertoolkit << 'NGINXEOF'
server {
    listen 80;
    server_name 91.107.232.255;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/maklertoolkit /etc/nginx/sites-enabled/maklertoolkit
nginx -t && systemctl reload nginx

echo ""
echo "=========================================="
echo "  MaklerToolkit laeuft auf:"
echo "  http://91.107.232.255"
echo "  Login: gast / gast1"
echo "=========================================="
