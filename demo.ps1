
$ColorRojo = "Red"
$ColorVerde = "Green"
$ColorAmarillo = "Yellow"
$ColorCyan = "Cyan"
$ColorAzul = "Blue"

function Invoke-ApiRequest {
    param(
        [string]$Method = "GET",
        [string]$Uri,
        [string]$Body = $null,
        [string]$Descripcion
    )
    
    Write-Host "`n$('='*70)" -ForegroundColor White
    Write-Host $Descripcion -ForegroundColor Cyan
    Write-Host $('='*70) -ForegroundColor White
    Write-Host "Método: $Method | Endpoint: $Uri" -ForegroundColor Gray
    
    if ($Body) {
        Write-Host "Body: $Body" -ForegroundColor Gray
    }
    
    Write-Host "`nRespuesta:" -ForegroundColor Yellow
    
    try {
        if ($Method -eq "POST") {
            $response = Invoke-RestMethod -Uri $Uri -Method Post -ContentType "application/json" -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Uri -Method Get
        }
        
        $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║    DEMOSTRACIÓN: TEOREMA CAP - CONSISTENCIA EVENTUAL       ║" -ForegroundColor Magenta
Write-Host "║         Sistema de Carrito Distribuido (3 Nodos)              ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta

Write-Host "`n¿Qué demostración deseas ejecutar?" -ForegroundColor Cyan
Write-Host "1. Demo Completa: Obsolecencia + Sincronización"
Write-Host "2. Solo Escritura en Nodo1"
Write-Host "3. Solo Lectura desde un Nodo"
Write-Host "4. Ver Estado de Todos los Nodos"
Write-Host "5. Salir"

$opcion = Read-Host "`nSelecciona una opción (1-5)"

switch ($opcion) {
    "1" {
        Write-Host "`nniciando demostración completa..." -ForegroundColor Magenta
        
        Invoke-ApiRequest -Method GET -Uri "http://localhost:3000/estado" `
            -Descripcion "PASO 1: Estado inicial de todos los nodos"
        
        Start-Sleep -Seconds 2
        
        $producto = Read-Host "`n¿Qué producto deseas agregar? (Manzanas/Naranjas)"
        $cantidad = Read-Host "¿Cuántos deseas agregar?"
        
        $body = @{
            producto = $producto
            cantidad = [int]$cantidad
        } | ConvertTo-Json
        
        Invoke-ApiRequest -Method POST -Uri "http://localhost:3000/carrito/nodo1/agregar" `
            -Body $body `
            -Descripcion "PASO 2: ESCRITURA en Nodo1 (+$cantidad $producto)"
        
        Write-Host "`nLEYENDO INMEDIATAMENTE desde Nodo3 (debería estar OBSOLETO)..." -ForegroundColor Yellow
        Start-Sleep -Milliseconds 100
        
        Invoke-ApiRequest -Method GET -Uri "http://localhost:3000/carrito/nodo3" `
            -Descripcion "PASO 3: Lectura INMEDIATA desde Nodo3 (OBSOLETO)"
        
        Invoke-ApiRequest -Method GET -Uri "http://localhost:3000/estado" `
            -Descripcion "PASO 4: Estado de nodos (INCONSISTENTE)"
        
        Write-Host "`nEsperando sincronización (3 segundos)..." -ForegroundColor Cyan
        for ($i = 3; $i -gt 0; $i--) {
            Write-Host "   $i..." -ForegroundColor Yellow
            Start-Sleep -Seconds 1
        }
        
        Invoke-ApiRequest -Method GET -Uri "http://localhost:3000/carrito/nodo3" `
            -Descripcion "PASO 5: Lectura desde Nodo3 (SINCRONIZADO)"
        
        Invoke-ApiRequest -Method GET -Uri "http://localhost:3000/estado" `
            -Descripcion "PASO 6: Estado final (TODOS CONSISTENTES)"
        
        Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                DEMOSTRACIÓN COMPLETADA                       ║" -ForegroundColor Green
        Write-Host "║                                                                ║" -ForegroundColor Green
        Write-Host "║  Has visto cómo funciona la CONSISTENCIA EVENTUAL:            ║" -ForegroundColor Green
        Write-Host "║  1. Escritura inmediata en un nodo ✓                          ║" -ForegroundColor Green
        Write-Host "║  2. Datos obsoletos en otros nodos (3 seg) ⚠                  ║" -ForegroundColor Green
        Write-Host "║  3. Sincronización automática ✓                               ║" -ForegroundColor Green
        Write-Host "║  4. Todos los nodos eventualmente consistentes ✓              ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    }
    
    "2" {
        $nodo = Read-Host "`n¿En qué nodo deseas escribir? (nodo1/nodo2/nodo3)"
        $producto = Read-Host "¿Qué producto? (Manzanas/Naranjas)"
        $cantidad = Read-Host "¿Cuántos?"
        
        $body = @{
            producto = $producto
            cantidad = [int]$cantidad
        } | ConvertTo-Json
        
        Invoke-ApiRequest -Method POST -Uri "http://localhost:3000/carrito/$nodo/agregar" `
            -Body $body `
            -Descripcion "Agregando $cantidad $producto al $nodo"
    }
    
    "3" {
        $nodo = Read-Host "`n¿De qué nodo deseas leer? (nodo1/nodo2/nodo3)"
        
        Invoke-ApiRequest -Method GET -Uri "http://localhost:3000/carrito/$nodo" `
            -Descripcion "Leyendo carrito desde $nodo"
    }
    
    "4" {
        Invoke-ApiRequest -Method GET -Uri "http://localhost:3000/estado" `
            -Descripcion "Estado de todos los nodos"
    }
    
    "5" {
        Write-Host "`n¡Hasta luego!" -ForegroundColor Cyan
        exit
    }
    
    default {
        Write-Host "`nOpción inválida" -ForegroundColor Red
    }
}

Write-Host "`n"
