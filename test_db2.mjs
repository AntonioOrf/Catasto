import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend-catasto/.env' });

async function test() {
  const c = await mysql.createConnection({ 
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: Number(process.env.DB_PORT) || 3306, ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined 
  });
  
  const [rows] = await c.query("SELECT GROUP_CONCAT(id_piviere) as id, TRIM(REGEXP_REPLACE(nome_piviere, ' \\\\([IVX]+\\\\)$', '')) as label FROM t_pivieri WHERE nome_piviere LIKE '%Signa%' GROUP BY label");
  console.log(rows);
  c.end();
}
test().catch(console.error);
