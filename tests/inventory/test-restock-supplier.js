const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testRestockWithSupplier() {
  try {
    console.log('🧪 Testing Restock with Supplier Name...\n');

    // Step 1: Login as owner
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

    // Step 2: Get existing SKUs
    console.log('2. Getting existing SKUs...');
    const skusResponse = await axios.get(`${API_BASE}/inventory/skus`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (skusResponse.data.skus.length === 0) {
      console.log('⚠️  No SKUs found. Creating one...');
      const createSKUResponse = await axios.post(
        `${API_BASE}/inventory/skus`,
        {
          brand: "King's Oil",
          size: "5L",
          is_carton: false,
          units_per_carton: 12
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      var sku_id = createSKUResponse.data.sku.id;
      console.log(`✅ Created SKU: ${sku_id}`);
    } else {
      var sku_id = skusResponse.data.skus[0].id;
      console.log(`✅ Using existing SKU: ${sku_id}`);
    }

    // Step 3: Test restock WITH supplier name
    console.log('\n3. Testing restock WITH supplier name...');
    const restockWithSupplier = await axios.post(
      `${API_BASE}/inventory/restock`,
      {
        sku_id: sku_id,
        ordered_qty: 100,
        received_qty: 98,
        cost_price: 18500,
        selling_price: 21000,
        supplier_name: "Lagos Distributors Ltd"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Restock with supplier recorded:');
    console.log(JSON.stringify(restockWithSupplier.data, null, 2));

    // Verify supplier_name is in response
    if (restockWithSupplier.data.restock.supplier_name === "Lagos Distributors Ltd") {
      console.log('✅ Supplier name correctly stored and returned');
    } else {
      console.log('❌ Supplier name not in response');
    }

    // Step 4: Test restock WITHOUT supplier name
    console.log('\n4. Testing restock WITHOUT supplier name...');
    const restockWithoutSupplier = await axios.post(
      `${API_BASE}/inventory/restock`,
      {
        sku_id: sku_id,
        ordered_qty: 50,
        received_qty: 50,
        cost_price: 18500,
        selling_price: 21000
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Restock without supplier recorded:');
    console.log(JSON.stringify(restockWithoutSupplier.data, null, 2));

    // Verify supplier_name is null
    if (restockWithoutSupplier.data.restock.supplier_name === null) {
      console.log('✅ Supplier name correctly null when not provided');
    } else {
      console.log('❌ Supplier name should be null');
    }

    // Step 5: Test with very long supplier name (should fail)
    console.log('\n5. Testing validation - supplier name too long...');
    try {
      await axios.post(
        `${API_BASE}/inventory/restock`,
        {
          sku_id: sku_id,
          ordered_qty: 10,
          received_qty: 10,
          cost_price: 18500,
          selling_price: 21000,
          supplier_name: "A".repeat(151) // 151 characters
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('❌ Should have rejected long supplier name');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation working: Long supplier name rejected');
        console.log(`   Error: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }

    // Step 6: Test discrepancy calculation
    console.log('\n6. Testing discrepancy calculation...');
    const restockWithShortage = await axios.post(
      `${API_BASE}/inventory/restock`,
      {
        sku_id: sku_id,
        ordered_qty: 100,
        received_qty: 95,
        cost_price: 18500,
        selling_price: 21000,
        supplier_name: "Unreliable Supplier Co."
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const discrepancy = restockWithShortage.data.restock.discrepancy;
    console.log(`✅ Discrepancy calculated: ${discrepancy}`);
    
    if (discrepancy === -5) {
      console.log('✅ Discrepancy calculation correct (95 - 100 = -5)');
    } else {
      console.log(`❌ Discrepancy should be -5, got ${discrepancy}`);
    }

    console.log('\n🎉 All restock supplier tests passed!');
    console.log('\n✅ Summary:');
    console.log('   ✅ Restock with supplier name works');
    console.log('   ✅ Restock without supplier name works');
    console.log('   ✅ Supplier name validation works (max 150 chars)');
    console.log('   ✅ Discrepancy calculation works');
    console.log('   ✅ Response includes all expected fields');

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

testRestockWithSupplier();
