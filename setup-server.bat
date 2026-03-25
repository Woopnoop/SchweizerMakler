@echo off
echo ==========================================
echo  MaklerToolkit Server Setup
echo ==========================================
echo.
echo Du wirst gleich nach deinem SSH-Key Passwort gefragt.
echo.
pause

scp -i "%USERPROFILE%\.ssh\id_rsa" "%~dp0server-setup.sh" root@91.107.232.255:/tmp/server-setup.sh
ssh -i "%USERPROFILE%\.ssh\id_rsa" root@91.107.232.255 "chmod +x /tmp/server-setup.sh && bash /tmp/server-setup.sh"

echo.
echo ==========================================
echo  Setup abgeschlossen!
echo ==========================================
pause
