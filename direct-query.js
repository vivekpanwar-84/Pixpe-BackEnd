
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT 
      photos.status, 
      photos.aoi_id, 
      aoi_areas.aoi_name, 
      count(*) 
    FROM photos 
    LEFT JOIN aoi_areas ON photos.aoi_id = aoi_areas.id 
    GROUP BY photos.status, photos.aoi_id, aoi_areas.aoi_name
  `);
  console.log('--- PHOTO DISTRIBUTION ---');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run().catch(console.error);
