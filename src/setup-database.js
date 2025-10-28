const { getAllNodos } = require('./database');

const setupDatabase = async () => {
  const nodos = getAllNodos();

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS carrito (
      id SERIAL PRIMARY KEY,
      producto VARCHAR(100) NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 0,
      ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const insertInitialData = `
    INSERT INTO carrito (producto, cantidad) 
    VALUES 
      ('Manzanas', 0),
      ('Naranjas', 0)
    ON CONFLICT DO NOTHING;
  `;

  console.log('Configurando bases de datos en los 3 nodos...\n');

  for (const [nodoId, pool] of Object.entries(nodos)) {
    try {
      console.log(`[SETUP] Configurando ${nodoId}...`);
      
      await pool.query(createTableQuery);
      console.log(`   [OK] Tabla creada en ${nodoId}`);
      
      await pool.query(insertInitialData);
      console.log(`   [OK] Datos iniciales insertados en ${nodoId}`);
      
    } catch (error) {
      console.error(`   [ERROR] Error en ${nodoId}:`, error.message);
    }
  }

  console.log('\n[SETUP] Configuración completada!\n');
  process.exit(0);
};

setupDatabase();
