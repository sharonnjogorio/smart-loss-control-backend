const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testSalesSync() {
  try {
    console.log('🧪 Testing Sales Sync Endpoint...\n');

    // Step 1: Login as staff to get token
    console.log('1. Logging in as staff...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login-pin`, {
      staff_name: 'Chinedu',
      pin: '4321'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Staff login failed. Make sure you have a staff user named "Chinedu" with PIN "4321"');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Staff logged in successfully');

    // Step 2: Get available SKUs
    console.log('\n2. Getting available SKUs...');
    const skusResponse = await axios.get(`${API_BASE}/inventory/skus`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (skusResponse.data.skus.length === 0) {
      console.log('❌ No SKUs found. Please create some products first.');
      return;
    }

    const firstSKU = skusResponse.data.skus[0];
    console.log(`✅ Found SKU: ${firstSKU.brand} ${firstSKU.size} (ID: ${firstSKU.id})`);

    // Step 3: Check current inventory
    console.log('\n3. Checking current inventory...');
    const inventoryResponse = await axios.get(`${API_BASE}/inventory/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const inventoryItem = inventoryResponse.data.inventory.find(item => item.sku_id === firstSKU.id);
    if (!inventoryItem) {
      console.log('❌ No inventory found for this SKU. Please restock first.');
      return;
    }

    console.log(`✅ Current stock: ${inventoryItem.quantity} units at $${inventoryItem.selling_price} each`);

    if (inventoryItem.quantity < 5) {
      console.log('❌ Insufficient stock for test. Need at least 5 units.');
      return;
    }

    // Step 4: Sync some sales
    console.log('\n4. Syncing offline sales...');
    
    const salesData = {
      device_id: 'test-device-123',
      sales: [
        {
          sale_id: `test-sale-${Date.now()}-1`,
          sku_id: firstSKU.id,
          quantity: 2,
          unit_price: inventoryItem.selling_price,
          sold_at: new Date().toISOString()
        },
        {
          sale_id: `test-sale-${Date.now()}-2`,
          sku_id: firstSKU.id,
          quantity: 1,
          unit_price: inventoryItem.selling_price,
          sold_at: new Date(Date.now() - 60000).toISOString() // 1 minute ago
        }
      ]
    };

    const syncResponse = await axios.post(`${API_BASE}/sales/sync`, salesData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Sales sync response:', JSON.stringify(syncResponse.data, null, 2));

    // Step 5: Verify inventory was updated
    console.log('\n5. Verifying inventory update...');
    const updatedInventoryResponse = await axios.get(`${API_BASE}/inventory/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const updatedInventoryItem = updatedInventoryResponse.data.inventory.find(item => item.sku_id === firstSKU.id);
    const expectedQuantity = inventoryItem.quantity - 3; // Sold 2 + 1 = 3 units

    if (updatedInventoryItem.quantity === expectedQuantity) {
      console.log(`✅ Inventory correctly updated: ${inventoryItem.quantity} → ${updatedInventoryItem.quantity}`);
    } else {
      console.log(`❌ Inventory mismatch. Expected: ${expectedQuantity}, Got: ${updatedInventoryItem.quantity}`);
    }

    // Step 6: Test duplicate sync (should be ignored)
    console.log('\n6. Testing duplicate sync (should be ignored)...');
    const duplicateResponse = await axios.post(`${API_BASE}/sales/sync`, salesData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Duplicate sync response:', JSON.stringify(duplicateResponse.data, null, 2));

    // Step 7: Get sales history
    console.log('\n7. Getting sales history...');
    const historyResponse = await axios.get(`${API_BASE}/sales/history?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Sales history:', JSON.stringify(historyResponse.data, null, 2));

    // Step 8: Get sales summary
    console.log('\n8. Getting sales summary...');
    const summaryResponse = await axios.get(`${API_BASE}/sales/summary?period=today`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Sales summary:', JSON.stringify(summaryResponse.data, null, 2));

    console.log('\n🎉 All sales sync tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testSalesSync();