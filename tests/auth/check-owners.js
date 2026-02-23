require('dotenv').config();
const { pool } = require('../../src/config/db');

async function checkOwners() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Checking registered owners...\n');

    // Get all owners
    const ownersResult = await client.query(
      `SELECT 
        u.id, 
        u.full_name, 
        u.phone, 
        u.role, 
        s.shop_name, 
        s.owner_phone,
        u.created_at,
        u.last_login_at
      FROM users u 
      JOIN shops s ON u.shop_id = s.id 
      WHERE u.role = 'OWNER' 
      ORDER BY u.created_at DESC`
    );

    if (ownersResult.rows.length === 0) {
      console.log('❌ No owners registered yet.\n');
      return;
    }

    console.log(`✅ Found ${ownersResult.rows.length} registered owner(s):\n`);
    
    ownersResult.rows.forEach((owner, index) => {
      console.log(`${index + 1}. ${owner.full_name}`);
      console.log(`   Shop: ${owner.shop_name}`);
      console.log(`   Phone: ${owner.phone}`);
      console.log(`   Owner Phone (shops table): ${owner.owner_phone}`);
      console.log(`   Registered: ${owner.created_at}`);
      console.log(`   Last Login: ${owner.last_login_at || 'Never'}`);
      console.log(`   ID: ${owner.id}`);
      console.log('');
    });

    // Check for phone duplicates
    const duplicateCheck = await client.query(
      `SELECT phone, COUNT(*) as count 
       FROM users 
       WHERE phone IS NOT NULL 
       GROUP BY phone 
       HAVING COUNT(*) > 1`
    );

    if (duplicateCheck.rows.length > 0) {
      console.log('⚠️  WARNING: Duplicate phone numbers found:');
      duplicateCheck.rows.forEach(dup => {
        console.log(`   Phone ${dup.phone} is used ${dup.count} times`);
      });
      console.log('');
    } else {
      console.log('✅ No duplicate phone numbers found.\n');
    }

    // Check all users
    const allUsersResult = await client.query(
      `SELECT 
        u.id, 
        u.full_name, 
        u.phone, 
        u.role, 
        s.shop_name
      FROM users u 
      JOIN shops s ON u.shop_id = s.id 
      ORDER BY s.shop_name, u.role, u.full_name`
    );

    console.log(`📋 Total users in database: ${allUsersResult.rows.length}\n`);
    
    const ownerCount = allUsersResult.rows.filter(u => u.role === 'OWNER').length;
    const staffCount = allUsersResult.rows.filter(u => u.role === 'STAFF').length;
    
    console.log(`   Owners: ${ownerCount}`);
    console.log(`   Staff: ${staffCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error checking owners:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkOwners();
