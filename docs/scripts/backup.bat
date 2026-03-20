@echo off

set BACKUP_DIR=backup
set DATE=%date:~-4,4%%date:~-7,2%%date:~0,2%

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

pg_dump -U your_username your_database_name > %BACKUP_DIR%\backup_%DATE%.sql
copy backend\.env %BACKUP_DIR%\.env_%DATE%

forfiles /p %BACKUP_DIR% /m *.sql /d -7 /c "cmd /c del @path" 2>nul
forfiles /p %BACKUP_DIR% /m .env_* /d -7 /c "cmd /c del @path" 2>nul

echo Backup completed: %DATE%