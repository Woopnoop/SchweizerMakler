#!/bin/bash
echo "=== Letzte App Logs ==="
journalctl -u maklertoolkit --no-pager -n 20 2>&1

echo ""
echo "=== Env Variablen prüfen ==="
cat /opt/SchweizerMakler/webapp/.env.local 2>/dev/null

echo ""
echo "=== DB Test ==="
PGPASSWORD=makler2026 psql -U makler -d maklertoolkit -h localhost -c "SELECT id, email, substring(password_hash,1,20) as hash_start FROM makler;" 2>&1

echo ""
echo "=== Login Test mit Debug ==="
cd /opt/SchweizerMakler/webapp
DATABASE_URL="postgresql://makler:makler2026@localhost/maklertoolkit" JWT_SECRET="schweizermakler-jwt-secret-2026-hetzner" node -e "
const bcrypt = require('bcryptjs');
const {Pool} = require('pg');
const p = new Pool({connectionString: process.env.DATABASE_URL});
p.query(\"SELECT * FROM makler WHERE email='gast'\").then(r => {
  if (r.rows.length === 0) { console.log('USER NICHT GEFUNDEN'); return p.end(); }
  const user = r.rows[0];
  console.log('User gefunden:', user.email, user.display_name);
  console.log('Hash:', user.password_hash.substring(0,20));
  const valid = bcrypt.compareSync('gast1', user.password_hash);
  console.log('Passwort korrekt:', valid);
  p.end();
}).catch(e => { console.error('DB ERROR:', e.message); p.end(); });
"
