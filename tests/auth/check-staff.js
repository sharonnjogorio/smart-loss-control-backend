require('dotenv').config();
const { pool } = require('../../src/config/db');

async function checkStaff() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking staff users...\n');

    const result = await client.query(`
      SELECT 
        u.id,
        u.full_name,
        u.role,
        u.shop_id,
        u.is_active,
        u.created_at,
        s.shop_name
      FROM users u
      LEFT JOIN shops s ON u.shop_id = s.id
      WHERE u.role = 'STAFF'
      ORDER BY u.created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('❌ No staff users found!');
      console.log('\nTo create a staff user, you need to:');
      console.log('1. Login as an owner');
      console.log('2. Generate a QR code: POST /auth/generate-qr');
      console.log('3. Use the QR token to link staff: POST /auth/staff/link');
      return;
    }

    console.log(`✅ Found ${result.rows.length} staff user(s):\n`);

    result.rows.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.full_name}`);
      console.log(`   Shop: ${staff.shop_name}`);
      console.log(`   Active: ${staff.is_active ? 'Yes' : 'No'}`);
      console.log(`   Created: ${staff.created_at}`);
      console.log(`   ID: ${staff.id}`);
      console.log('');
    });

    // Test login with first staff
    if (result.rows.length > 0) {
      const firstStaff = result.rows[0];
      console.log(`\n🧪 Testing login with staff: ${firstStaff.full_name}`);
      console.log('Note: We don\'t know their PIN, so this might fail');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkStaff();