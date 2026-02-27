
const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres.hrdjaertvxgwhxddsyux:Vivek9826@@@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres",
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
