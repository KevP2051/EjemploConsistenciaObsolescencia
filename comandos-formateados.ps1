# 📋 Comandos Formateados - Copia y Pega Individual
# Estos comandos muestran las respuestas JSON de forma legible

# ═══════════════════════════════════════════════════════════════
# 🔍 VER ESTADO DE TODOS LOS NODOS
# ═══════════════════════════════════════════════════════════════
Invoke-RestMethod -Uri "http://localhost:3000/estado" | ConvertTo-Json -Depth 10


# ═══════════════════════════════════════════════════════════════
# ✏️  AGREGAR PRODUCTOS (Ejemplo: +10 Manzanas al Nodo1)
# ═══════════════════════════════════════════════════════════════
Invoke-RestMethod -Uri "http://localhost:3000/carrito/nodo1/agregar" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"producto": "Manzanas", "cantidad": 10}' | ConvertTo-Json -Depth 10


# ═══════════════════════════════════════════════════════════════
# 📖 LEER DESDE NODO 2 (puede estar obsoleto)
# ═══════════════════════════════════════════════════════════════
Invoke-RestMethod -Uri "http://localhost:3000/carrito/nodo2" | ConvertTo-Json -Depth 10


# ═══════════════════════════════════════════════════════════════
# 📖 LEER DESDE NODO 3 (puede estar obsoleto)
# ═══════════════════════════════════════════════════════════════
Invoke-RestMethod -Uri "http://localhost:3000/carrito/nodo3" | ConvertTo-Json -Depth 10


# ═══════════════════════════════════════════════════════════════
# ✂️  QUITAR PRODUCTOS (Ejemplo: -3 Naranjas del Nodo1)
# ═══════════════════════════════════════════════════════════════
Invoke-RestMethod -Uri "http://localhost:3000/carrito/nodo1/quitar" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"producto": "Naranjas", "cantidad": 3}' | ConvertTo-Json -Depth 10


# ═══════════════════════════════════════════════════════════════
# 🧪 DEMOSTRACIÓN COMPLETA DE OBSOLECENCIA
# ═══════════════════════════════════════════════════════════════

Write-Host "`n🔴 PASO 1: Escribiendo en Nodo1..." -ForegroundColor Red
Invoke-RestMethod -Uri "http://localhost:3000/carrito/nodo1/agregar" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"producto": "Naranjas", "cantidad": 20}' | ConvertTo-Json -Depth 10

Write-Host "`n🟡 PASO 2: Leyendo INMEDIATAMENTE desde Nodo3 (OBSOLETO)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:3000/carrito/nodo3" | ConvertTo-Json -Depth 10

Write-Host "`n⏳ PASO 3: Esperando 4 segundos para sincronización..." -ForegroundColor Cyan
Start-Sleep -Seconds 4

Write-Host "`n🟢 PASO 4: Leyendo de nuevo desde Nodo3 (SINCRONIZADO)..." -ForegroundColor Green
Invoke-RestMethod -Uri "http://localhost:3000/carrito/nodo3" | ConvertTo-Json -Depth 10

Write-Host "`n📊 PASO 5: Verificando estado de todos los nodos..." -ForegroundColor Blue
Invoke-RestMethod -Uri "http://localhost:3000/estado" | ConvertTo-Json -Depth 10
