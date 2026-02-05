@echo off
echo ================================
echo DNS Browser - VPN Setup
echo ================================
echo.

echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Removing old build...
call npx expo prebuild --clean

echo.
echo Step 3: Building Android app...
call npx expo run:android

echo.
echo ================================
echo VPN功能已启用!
echo ================================
echo.
echo 现在用户可以在app内:
echo 1. Settings -^> Security -^> DNS Settings
echo 2. 开启 DNS Bypass
echo 3. 允许 VPN 权限
echo 4. 选择 DNS (1.1.1.1 或 8.8.8.8)
echo 5. 访问被封锁的网站！
echo.
pause
