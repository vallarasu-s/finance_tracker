@echo off
echo Compiling and starting Finance Tracker Java Backend...
if not exist out mkdir out
javac -d out src\com\financetracker\FinanceServer.java
if %ERRORLEVEL% equ 0 (
    echo Starting Java Server on http://localhost:8080...
    java -cp out com.financetracker.FinanceServer
) else (
    echo Compilation failed!
)
