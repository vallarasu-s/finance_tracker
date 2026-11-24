@echo off
cd /d "%~dp0"
echo ==================================================
echo Compiling Finance Tracker Java + MongoDB Backend...
echo ==================================================
if not exist out mkdir out
javac -cp "lib/*" -d out src\com\financetracker\*.java src\com\financetracker\app\*.java src\com\financetracker\controller\*.java src\com\financetracker\service\*.java
if %ERRORLEVEL% equ 0 (
    echo [OK] Compilation successful!
    echo Starting Java Server on http://localhost:8080...
    java -cp "lib/*;out" com.financetracker.app.FinanceApp
) else (
    echo [ERROR] Compilation failed!
    pause
)
