@echo off
cd /d "%~dp0"
echo ==================================================
echo Compiling Finance Tracker Java 21 + MongoDB Backend...
echo ==================================================
if not exist out mkdir out
xcopy /E /Y /I /Q "src\main\resources\*" "out\" >nul 2>&1
javac -cp "lib/*" -d out src\main\java\com\finance\*.java src\main\java\com\finance\config\*.java src\main\java\com\finance\model\*.java src\main\java\com\finance\dto\*.java src\main\java\com\finance\exception\*.java src\main\java\com\finance\repository\*.java src\main\java\com\finance\service\*.java src\main\java\com\finance\controller\*.java
if %ERRORLEVEL% equ 0 (
    echo [OK] Compilation successful!
    echo Starting Java Server on http://localhost:8080...
    java -cp "lib/*;out" com.finance.FinanceApplication
) else (
    echo [ERROR] Compilation failed!
    pause
)
