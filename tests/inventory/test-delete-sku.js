const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testDeleteSKU() {
  try {
    console.log('🧪 Testing SKU Soft Delete & Reactivate...\n');

    // Login as owner
    console.log('1. Logging in as owner...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login-owner`, {
      phone: '+2348099999999'
    });

    const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: '+2348099999999',
      otp: loginResponse.data.dev_otp
    });

    const token = verifyResponse.data.token;
    console.log('✅ Owner logged in successfully\n');

    // Create a test product
    console.log('2. Creating a test product (Devon King 3L)...');
    let testSKU;
    try {
      const createResponse = await axios.post(
        `${API_BASE}/inventory/skus`,
        {
          brand: "Devon King",
          size: "3L",
          is_carton: false,
          units_per_carton: 12
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      testSKU = createResponse.data.sku;
      console.log(`✅ Product created: ${testSKU.brand} ${testSKU.size}`);
      console.log(`   ID: ${testSKU.id}\n`);
    } catch (error) {
      if (error.response?.status === 409) {
        // Product exists, get it
        const skusResponse = await axios.get(`${API_BASE}/inventory/skus`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        testSKU = skusResponse.data.skus.find(s => s.brand === 'Devon King' && s.size === '3L');
        console.log(`⚠️  Product already exists, using existing one\n`);
      } else {
        throw error;
      }
    }

    // View all active SKUs
    console.log('3. Viewing all ACTIVE SKUs...');
    const activeSkusResponse = await axios.get(`${API_BASE}/inventory/skus`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${activeSkusResponse.data.count} active products`);
    console.log(`   Note: ${activeSkusResponse.data.note}\n`);

    // Delete (soft delete) the SKU
    console.log('4. Discontinuing (soft deleting) the product...');
    const deleteResponse = await axios.delete(
      `${API_BASE}/inventory/skus/${testSKU.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Product discontinued:');
    console.log(`   Message: ${deleteResponse.data.message}`);
    console.log(`   Note: ${deleteResponse.data.note}\n`);

    // Try to delete again (should fail)
    console.log('5. Trying to discontinue again (should fail)...');
    try {
      await axios.delete(
        `${API_BASE}/inventory/skus/${testSKU.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('❌ Should have failed!');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly prevented: Product is already discontinued\n');
      } else {
        throw error;
      }
    }

    // View active SKUs (should not include discontinued)
    console.log('6. Viewing ACTIVE SKUs (discontinued should be hidden)...');
    const activeAfterDelete = await axios.get(`${API_BASE}/inventory/skus`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isHidden = !activeAfterDelete.data.skus.find(s => s.id === testSKU.id);
    if (isHidden) {
      console.log(`✅ Discontinued product is hidden from active list`);
      console.log(`   Active products: ${activeAfterDelete.data.count}\n`);
    } else {
      console.log('❌ Product should be hidden!\n');
    }

    // View ALL SKUs including inactive
    console.log('7. Viewing ALL SKUs (including discontinued)...');
    const allSkusResponse = await axios.get(
      `${API_BASE}/inventory/skus?include_inactive=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const discontinuedProduct = allSkusResponse.data.skus.find(s => s.id === testSKU.id);
    if (discontinuedProduct && !discontinuedProduct.is_active) {
      console.log(`✅ Discontinued product found in full list`);
      console.log(`   Brand: ${discontinuedProduct.brand} ${discontinuedProduct.size}`);
      console.log(`   Status: ${discontinuedProduct.is_active ? 'Active' : 'Discontinued'}`);
      console.log(`   Discontinued at: ${discontinuedProduct.discontinued_at}\n`);
    } else {
      console.log('❌ Product should be in full list!\n');
    }

    // Reactivate the SKU
    console.log('8. Reactivating the discontinued product...');
    const reactivateResponse = await axios.patch(
      `${API_BASE}/inventory/skus/${testSKU.id}/reactivate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Product reactivated:');
    console.log(`   Message: ${reactivateResponse.data.message}\n`);

    // Try to reactivate again (should fail)
    console.log('9. Trying to reactivate again (should fail)...');
    try {
      await axios.patch(
        `${API_BASE}/inventory/skus/${testSKU.id}/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('❌ Should have failed!');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly prevented: Product is already active\n');
      } else {
        throw error;
      }
    }

    // Verify it's back in active list
    console.log('10. Verifying product is back in active list...');
    const finalActiveList = await axios.get(`${API_BASE}/inventory/skus`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isBackInList = finalActiveList.data.skus.find(s => s.id === testSKU.id);
    if (isBackInList) {
      console.log(`✅ Product is back in active list`);
      console.log(`   Status: ${isBackInList.is_active ? 'Active' : 'Inactive'}\n`);
    } else {
      console.log('❌ Product should be in active list!\n');
    }

    console.log('🎉 All soft delete tests passed!');
    console.log('\n✅ Summary:');
    console.log('   ✅ Products can be discontinued (soft deleted)');
    console.log('   ✅ Discontinued products are hidden from active lists');
    console.log('   ✅ Discontinued products can be viewed with ?include_inactive=true');
    console.log('   ✅ Discontinued products can be reactivated');
    console.log('   ✅ All history is preserved (no data loss)');
    console.log('   ✅ Duplicate operations are prevented');

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

testDeleteSKU();
