#!/bin/bash
echo "=== Service Status ==="
systemctl status maklertoolkit --no-pager -l 2>&1 | tail -20

echo ""
echo "=== App Logs ==="
journalctl -u maklertoolkit --no-pager -n 30 2>&1

echo ""
echo "=== Test Login API ==="
curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gast","password":"gast1"}' 2>&1

echo ""
echo ""
echo "=== Test DB Connection ==="
PGPASSWORD=makler2026 psql -U makler -d maklertoolkit -h localhost -c "SELECT email, display_name, subscription_tier FROM makler LIMIT 5;" 2>&1

echo ""
echo "=== Nginx Config Test ==="
nginx -t 2>&1
