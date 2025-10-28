const { getAllNodos, getNodo } = require('./database');
require('dotenv').config();

const syncQueue = [];
let isSyncing = false;

/*Agrega una operación a la cola de sincronización*/
const agregarASincronizacion = (operacion) => {
  syncQueue.push({
    ...operacion,
    timestamp: new Date(),
  });
  
  console.log(`\n[SYNC] Operación agregada a cola de sincronización:`);
  console.log(`   Nodo origen: ${operacion.nodoOrigen}`);
  console.log(`   Acción: ${operacion.accion}`);
  console.log(`   Producto: ${operacion.producto}`);
  console.log(`   Sincronización en ${process.env.SYNC_DELAY}ms...\n`);
  
  if (!isSyncing) {
    iniciarSincronizacion();
  }
};

/*Procesa la cola de sincronización con delay*/
const iniciarSincronizacion = async () => {
  if (syncQueue.length === 0) {
    isSyncing = false;
    return;
  }

  isSyncing = true;
  const operacion = syncQueue.shift();


  setTimeout(async () => {
    await sincronizarNodos(operacion);
    iniciarSincronizacion();
  }, parseInt(process.env.SYNC_DELAY));
};

/*Sincroniza la operación en todos los nodos excepto el origen*/
const sincronizarNodos = async (operacion) => {
  const nodos = getAllNodos();
  const { nodoOrigen, accion, producto, cantidad } = operacion;

  console.log(`\n[SYNC] SINCRONIZANDO nodos...`);
  console.log(`   Propagando cambios desde ${nodoOrigen}`);

  for (const [nodoId, pool] of Object.entries(nodos)) {

    if (nodoId === nodoOrigen) continue;

    try {
      if (accion === 'agregar') {
        await pool.query(
          `UPDATE carrito 
           SET cantidad = cantidad + $1, 
               ultima_actualizacion = CURRENT_TIMESTAMP 
           WHERE producto = $2`,
          [cantidad, producto]
        );
        console.log(`   [OK] ${nodoId} sincronizado (+${cantidad} ${producto})`);
      } else if (accion === 'quitar') {
        await pool.query(
          `UPDATE carrito 
           SET cantidad = GREATEST(cantidad - $1, 0), 
               ultima_actualizacion = CURRENT_TIMESTAMP 
           WHERE producto = $2`,
          [cantidad, producto]
        );
        console.log(`   [OK] ${nodoId} sincronizado (-${cantidad} ${producto})`);
      }
    } catch (error) {
      console.error(`   [ERROR] Error sincronizando ${nodoId}:`, error.message);
    }
  }

  console.log(`\n[SYNC] SINCRONIZACIÓN COMPLETADA - Todos los nodos consistentes\n`);
};

/*Obtiene el estado de todos los nodos para comparación */
const obtenerEstadoNodos = async () => {
  const nodos = getAllNodos();
  const estados = {};

  for (const [nodoId, pool] of Object.entries(nodos)) {
    try {
      const result = await pool.query(
        'SELECT producto, cantidad, ultima_actualizacion FROM carrito ORDER BY producto'
      );
      estados[nodoId] = result.rows;
    } catch (error) {
      estados[nodoId] = { error: error.message };
    }
  }

  return estados;
};

module.exports = {
  agregarASincronizacion,
  obtenerEstadoNodos,
};
