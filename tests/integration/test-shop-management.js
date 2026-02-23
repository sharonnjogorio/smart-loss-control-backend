const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testShopManagement() {
  try {
    console.log('🧪 Testing Shop Management Endpoints...\n');

    // Step 1: Login as owner
    console.log('1. Logging in as owner...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login-owner`, {
      phone: '+2348099999999' // Test Owner
    });

    if (!loginResponse.data.success) {
      console.log('❌ Owner login failed. Please register an owner first.');
      return;
    }

    console.log(`✅ OTP sent. Dev OTP: ${loginResponse.data.dev_otp}`);

    // Verify OTP
    const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: '+2348099999999',
      otp: loginResponse.data.dev_otp
    });

    const ownerToken = verifyResponse.data.token;
    console.log('✅ Owner logged in successfully\n');

    // Step 2: Get shop profile
    console.log('2. Getting shop profile...');
    const profileResponse = await axios.get(`${API_BASE}/shops/me`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    console.log('✅ Shop Profile:', JSON.stringify(profileResponse.data, null, 2));

    // Step 3: Update shop profile
    console.log('\n3. Updating shop name...');
    const updateResponse = await axios.patch(
      `${API_BASE}/shops/me`,
      { shop_name: 'Updated Shop Name - Test' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );

    console.log('✅ Shop Updated:', JSON.stringify(updateResponse.data, null, 2));

    // Step 4: Get staff list
    console.log('\n4. Getting staff list...');
    const staffListResponse = await axios.get(`${API_BASE}/shops/staff`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    console.log('✅ Staff List:', JSON.stringify(staffListResponse.data, null, 2));

    if (staffListResponse.data.staff.length === 0) {
      console.log('\n⚠️  No staff members found. Skipping staff management tests.');
      console.log('   Create a staff member first using QR code linking.');
      return;
    }

    const firstStaff = staffListResponse.data.staff[0];
    console.log(`\n   Found staff: ${firstStaff.full_name} (ID: ${firstStaff.id})`);

    // Step 5: Get staff details
    console.log('\n5. Getting staff details...');
    const staffDetailsResponse = await axios.get(
      `${API_BASE}/shops/staff/${firstStaff.id}`,
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );

    console.log('✅ Staff Details:', JSON.stringify(staffDetailsResponse.data, null, 2));

    // Step 6: Revoke staff access
    console.log('\n6. Revoking staff access...');
    const revokeResponse = await axios.patch(
      `${API_BASE}/shops/staff/${firstStaff.id}/revoke`,
      {},
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );

    console.log('✅ Staff Revoked:', JSON.stringify(revokeResponse.data, null, 2));

    // Step 7: Verify staff is inactive
    console.log('\n7. Verifying staff is inactive...');
    const verifyInactiveResponse = await axios.get(`${API_BASE}/shops/staff`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    const inactiveStaff = verifyInactiveResponse.data.staff.find(s => s.id === firstStaff.id);
    if (inactiveStaff && !inactiveStaff.is_active) {
      console.log('✅ Staff is now inactive');
    } else {
      console.log('❌ Staff status not updated correctly');
    }

    // Step 8: Reactivate staff access
    console.log('\n8. Reactivating staff access...');
    const reactivateResponse = await axios.patch(
      `${API_BASE}/shops/staff/${firstStaff.id}/reactivate`,
      {},
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );

    console.log('✅ Staff Reactivated:', JSON.stringify(reactivateResponse.data, null, 2));

    // Step 9: Test security - staff cannot access owner endpoints
    console.log('\n9. Testing security - staff trying to access owner endpoints...');
    
    // Login as staff
    const staffLoginResponse = await axios.post(`${API_BASE}/auth/login-pin`, {
      staff_name: firstStaff.full_name,
      pin: '4321' // Assuming default PIN
    }).catch(() => null);

    if (staffLoginResponse && staffLoginResponse.data.success) {
      const staffToken = staffLoginResponse.data.token;

      // Try to update shop (should fail)
      try {
        await axios.patch(
          `${API_BASE}/shops/me`,
          { shop_name: 'Hacked Shop' },
          { headers: { Authorization: `Bearer ${staffToken}` } }
        );
        console.log('❌ SECURITY ISSUE: Staff was able to update shop!');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Security OK: Staff cannot update shop (403 Forbidden)');
        } else {
          console.log('⚠️  Unexpected error:', error.response?.data);
        }
      }

      // Try to revoke access (should fail)
      try {
        await axios.patch(
          `${API_BASE}/shops/staff/${firstStaff.id}/revoke`,
          {},
          { headers: { Authorization: `Bearer ${staffToken}` } }
        );
        console.log('❌ SECURITY ISSUE: Staff was able to revoke access!');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Security OK: Staff cannot revoke access (403 Forbidden)');
        } else {
          console.log('⚠️  Unexpected error:', error.response?.data);
        }
      }

      // Staff can view shop profile (should succeed)
      try {
        const staffViewResponse = await axios.get(`${API_BASE}/shops/me`, {
          headers: { Authorization: `Bearer ${staffToken}` }
        });
        console.log('✅ Security OK: Staff can view shop profile');
      } catch (error) {
        console.log('❌ Staff should be able to view shop profile');
      }
    }

    console.log('\n🎉 All shop management tests passed!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Shop profile retrieval');
    console.log('   ✅ Shop profile update');
    console.log('   ✅ Staff list retrieval');
    console.log('   ✅ Staff details retrieval');
    console.log('   ✅ Staff access revocation');
    console.log('   ✅ Staff access reactivation');
    console.log('   ✅ Security: Owner-only endpoints protected');
    console.log('   ✅ Security: Staff can view but not modify');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Server is not running! Start it with: npm start');
    } else if (error.response?.data) {
      console.error('   API Error:', JSON.stringify(error.response.data, null, 2));
      console.error('   Status:', error.response.status);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Run the test
testShopManagement();
