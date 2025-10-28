const { Pool } = require('pg');
require('dotenv').config();

const nodos = {
  nodo1: new Pool({
    host: process.env.DB_HOST,
    port: process.env.NODO1_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
  nodo2: new Pool({
    host: process.env.DB_HOST,
    port: process.env.NODO2_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
  nodo3: new Pool({
    host: process.env.DB_HOST,
    port: process.env.NODO3_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
};

const getNodo = (nodoId) => {
  return nodos[nodoId];
};

const getAllNodos = () => {
  return nodos;
};

module.exports = {
  getNodo,
  getAllNodos,
  nodos,
};
