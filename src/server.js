const express = require('express');
const cors = require('cors');
const path = require('path');
const { getNodo } = require('./database');
const { agregarASincronizacion, obtenerEstadoNodos } = require('./sync-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
  console.log(`\n[REQUEST] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

/*GET /api - Endpoint de información de la API */
app.get('/api', (req, res) => {
  res.json({
    mensaje: 'Sistema de Carrito Distribuido - Teorema CAP',
    descripcion: 'Demostración de Consistencia Eventual con 3 nodos PostgreSQL',
    endpoints: {
      'GET /': 'Interfaz gráfica web',
      'GET /carrito/:nodo': 'Leer carrito desde un nodo específico (nodo1, nodo2, nodo3)',
      'POST /carrito/:nodo/agregar': 'Agregar productos (body: {producto, cantidad})',
      'POST /carrito/:nodo/quitar': 'Quitar productos (body: {producto, cantidad})',
      'GET /estado': 'Ver estado de todos los nodos (para detectar obsolecencia)',
    },
    nodos: ['nodo1', 'nodo2', 'nodo3'],
  });
});

/*GET /carrito/:nodo - Leer desde un nodo específico */
app.get('/carrito/:nodo', async (req, res) => {
  const { nodo } = req.params;

  if (!['nodo1', 'nodo2', 'nodo3'].includes(nodo)) {
    return res.status(400).json({ error: 'Nodo inválido. Use: nodo1, nodo2 o nodo3' });
  }

  try {
    const pool = getNodo(nodo);
    const result = await pool.query(
      'SELECT producto, cantidad, ultima_actualizacion FROM carrito ORDER BY producto'
    );

    console.log(`[LECTURA] Leyendo desde ${nodo}`);
    console.log(`   Datos: ${JSON.stringify(result.rows)}`);

    res.json({
      nodo,
      timestamp: new Date(),
      carrito: result.rows,
      advertencia: 'Los datos pueden estar obsoletos si hay sincronización pendiente',
    });
  } catch (error) {
    console.error(`[ERROR] Error en ${nodo}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/*POST /carrito/:nodo/agregar - Agregar productos (escritura) */
app.post('/carrito/:nodo/agregar', async (req, res) => {
  const { nodo } = req.params;
  const { producto, cantidad } = req.body;

  if (!['nodo1', 'nodo2', 'nodo3'].includes(nodo)) {
    return res.status(400).json({ error: 'Nodo inválido. Use: nodo1, nodo2 o nodo3' });
  }

  if (!producto || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Producto y cantidad (>0) son requeridos' });
  }

  try {
    const pool = getNodo(nodo);

    const result = await pool.query(
      `UPDATE carrito 
       SET cantidad = cantidad + $1, 
           ultima_actualizacion = CURRENT_TIMESTAMP 
       WHERE producto = $2
       RETURNING *`,
      [cantidad, producto]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    console.log(`\n[ESCRITURA] ESCRITURA en ${nodo}:`);
    console.log(`   +${cantidad} ${producto}`);
    console.log(`   [ADVERTENCIA] OTROS NODOS AHORA TIENEN DATOS OBSOLETOS`);

    agregarASincronizacion({
      nodoOrigen: nodo,
      accion: 'agregar',
      producto,
      cantidad,
    });

    res.json({
      mensaje: `OK: ${cantidad} ${producto} agregados al carrito en ${nodo}`,
      nodo,
      resultado: result.rows[0],
      advertencia: 'ADVERTENCIA: La sincronización con otros nodos tomará unos segundos (Consistencia Eventual)',
    });
  } catch (error) {
    console.error(`[ERROR] Error en ${nodo}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/* POST /carrito/:nodo/quitar - Quitar productos (escritura) */
app.post('/carrito/:nodo/quitar', async (req, res) => {
  const { nodo } = req.params;
  const { producto, cantidad } = req.body;

  if (!['nodo1', 'nodo2', 'nodo3'].includes(nodo)) {
    return res.status(400).json({ error: 'Nodo inválido. Use: nodo1, nodo2 o nodo3' });
  }

  if (!producto || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Producto y cantidad (>0) son requeridos' });
  }

  try {
    const pool = getNodo(nodo);

    const result = await pool.query(
      `UPDATE carrito 
       SET cantidad = GREATEST(cantidad - $1, 0), 
           ultima_actualizacion = CURRENT_TIMESTAMP 
       WHERE producto = $2
       RETURNING *`,
      [cantidad, producto]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    console.log(`\n[ESCRITURA] ESCRITURA en ${nodo}:`);
    console.log(`   -${cantidad} ${producto}`);
    console.log(`   [ADVERTENCIA] OTROS NODOS AHORA TIENEN DATOS OBSOLETOS`);

    agregarASincronizacion({
      nodoOrigen: nodo,
      accion: 'quitar',
      producto,
      cantidad,
    });

    res.json({
      mensaje: `OK: ${cantidad} ${producto} quitados del carrito en ${nodo}`,
      nodo,
      resultado: result.rows[0],
      advertencia: 'ADVERTENCIA: La sincronización con otros nodos tomará unos segundos (Consistencia Eventual)',
    });
  } catch (error) {
    console.error(`[ERROR] Error en ${nodo}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/*GET /estado - Ver estado de todos los nodos (detectar obsolecencia) */
app.get('/estado', async (req, res) => {
  try {
    const estados = await obtenerEstadoNodos();

    console.log('\n[ESTADO] COMPARANDO ESTADO DE TODOS LOS NODOS:');
    
    let hayInconsistencia = false;
    const productos = ['Manzanas', 'Naranjas'];
    
    for (const producto of productos) {
      const cantidades = [];
      for (const nodo of ['nodo1', 'nodo2', 'nodo3']) {
        if (estados[nodo] && Array.isArray(estados[nodo])) {
          const item = estados[nodo].find(p => p.producto === producto);
          if (item) cantidades.push(item.cantidad);
        }
      }

      if (cantidades.length > 0 && new Set(cantidades).size > 1) {
        hayInconsistencia = true;
        console.log(`   [ADVERTENCIA] ${producto}: INCONSISTENTE [${cantidades.join(', ')}]`);
      } else if (cantidades.length > 0) {
        console.log(`   [OK] ${producto}: CONSISTENTE [${cantidades[0]}]`);
      }
    }

    res.json({
      timestamp: new Date(),
      estados,
      consistente: !hayInconsistencia,
      mensaje: hayInconsistencia 
        ? 'ADVERTENCIA: DATOS OBSOLETOS DETECTADOS - Esperando sincronización...' 
        : 'OK: Todos los nodos están CONSISTENTES',
    });
  } catch (error) {
    console.error('[ERROR] Error obteniendo estado:', error.message);
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('SISTEMA DE CARRITO DISTRIBUIDO - TEOREMA CAP');
  console.log('   Demostración: Consistencia Eventual (AP System)');
  console.log('='.repeat(70));
  console.log(`\nInterfaz Gráfica: http://localhost:${PORT}`);
  console.log(`API REST: http://localhost:${PORT}/api`);
  console.log(`Delay de sincronización: ${process.env.SYNC_DELAY}ms`);
  console.log(`\nNodos disponibles:`);
  console.log(`   - nodo1 (PostgreSQL Puerto 5432)`);
  console.log(`   - nodo2 (PostgreSQL Puerto 5433)`);
  console.log(`   - nodo3 (PostgreSQL Puerto 5434)`);
  console.log('\n' + '='.repeat(70));
  console.log('Abre tu navegador en http://localhost:3000 para usar la interfaz');
  console.log('='.repeat(70) + '\n');
});
