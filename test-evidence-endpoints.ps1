# Script para probar los endpoints de evidencias
Write-Host "Probando endpoints de evidencias..." -ForegroundColor Green

# Esperar a que el backend esté listo
Write-Host "Esperando a que el backend esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# URL base
$baseUrl = "http://localhost:5266"

# Probar endpoint de verificación de permisos (sin autenticación primero)
Write-Host "`n1. Probando endpoint de verificación de permisos..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/securefile/check-permissions" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Probar endpoint de preview con archivo de prueba
Write-Host "`n2. Probando endpoint de preview con archivo de prueba..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/securefile/preview/evidence/test.txt" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`nPruebas completadas." -ForegroundColor Green
