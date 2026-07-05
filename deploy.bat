@echo off
cd /d "C:\Users\Administrator\Desktop\claude test\loznik"
echo === Building Loznik ===
call npm run build
if errorlevel 1 (
  echo BUILD FAILED
  pause
  exit /b 1
)
echo === Deploying to Firebase ===
call firebase deploy --only hosting
echo === Done ===
pause
