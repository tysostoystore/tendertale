@echo off
echo Getting your computer's IP address...
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    echo Your IP address is: !ip!
    echo.
    echo Use this IP in the Telegram Web App URL: http://!ip!:5173
    echo.
    pause
) 