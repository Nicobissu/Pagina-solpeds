@echo off
echo ========================================
echo Reiniciando el Backend...
echo ========================================
echo.

echo [1/3] Deteniendo procesos de Node.js...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo    OK - Procesos detenidos
) else (
    echo    INFO - No habia procesos corriendo
)
echo.

echo [2/3] Esperando 2 segundos...
timeout /t 2 /nobreak >nul
echo    OK - Listo
echo.

echo [3/3] Iniciando backend en puerto 3001...
cd backend
start cmd /k "npm run dev"
echo    OK - Backend iniciado en nueva ventana
echo.

echo ========================================
echo Esperando que el backend este listo...
echo ========================================
timeout /t 5 /nobreak >nul

curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    EXITO! Backend funcionando
    echo    Puerto: 3001
    echo    Rutas disponibles:
    echo      - /api/auth
    echo      - /api/pedidos
    echo      - /api/compras
    echo      - /api/notificaciones
    echo      - /api/centros-costo
    echo      - /api/usuarios  ^<-- NUEVA!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo    ADVERTENCIA: No se pudo verificar
    echo    Revisa la ventana del backend
    echo ========================================
)

echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
