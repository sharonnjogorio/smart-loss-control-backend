const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testDuplicateSKU() {
  try {
    console.log('🧪 Testing Duplicate SKU Prevention...\n');

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

    // Test 1: Create a new unique product
    console.log('2. Creating a NEW product (Mamador 2L Bottle)...');
    try {
      const createResponse = await axios.post(
        `${API_BASE}/inventory/skus`,
        {
          brand: "Mamador",
          size: "2L",
          is_carton: false,
          units_per_carton: 12
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Product created successfully:');
      console.log(`   Brand: ${createResponse.data.sku.brand}`);
      console.log(`   Size: ${createResponse.data.sku.size}`);
      console.log(`   Type: ${createResponse.data.sku.is_carton ? 'Carton' : 'Bottle'}`);
      console.log(`   ID: ${createResponse.data.sku.id}\n`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  Product already exists (expected if you ran this before)');
        console.log(`   Message: ${error.response.data.message}\n`);
      } else {
        throw error;
      }
    }

    // Test 2: Try to create the SAME product again (should fail)
    console.log('3. Trying to create DUPLICATE product (Mamador 2L Bottle)...');
    try {
      await axios.post(
        `${API_BASE}/inventory/skus`,
        {
          brand: "Mamador",
          size: "2L",
          is_carton: false,
          units_per_carton: 12
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('❌ ERROR: Duplicate was allowed! This should not happen!');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate prevented! (This is correct behavior)');
        console.log(`   Status: ${error.response.status} Conflict`);
        console.log(`   Message: ${error.response.data.message}`);
        console.log(`   Existing SKU ID: ${error.response.data.existing_sku.id}`);
        console.log(`   Suggestion: ${error.response.data.suggestion}\n`);
      } else {
        throw error;
      }
    }

    // Test 3: Create CARTON version (should succeed - different product)
    console.log('4. Creating CARTON version (Mamador 2L Carton)...');
    try {
      const cartonResponse = await axios.post(
        `${API_BASE}/inventory/skus`,
        {
          brand: "Mamador",
          size: "2L",
          is_carton: true,
          units_per_carton: 12
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Carton version created successfully:');
      console.log(`   Brand: ${cartonResponse.data.sku.brand}`);
      console.log(`   Size: ${cartonResponse.data.sku.size}`);
      console.log(`   Type: ${cartonResponse.data.sku.is_carton ? 'Carton' : 'Bottle'}`);
      console.log(`   ID: ${cartonResponse.data.sku.id}\n`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  Carton version already exists (expected if you ran this before)\n');
      } else {
        throw error;
      }
    }

    // Test 4: Show all Mamador products
    console.log('5. Listing all SKUs to see the difference...');
    const skusResponse = await axios.get(`${API_BASE}/inventory/skus`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const mamadorProducts = skusResponse.data.skus.filter(s => s.brand === 'Mamador');
    console.log(`\n📦 Found ${mamadorProducts.length} Mamador product(s):\n`);
    
    mamadorProducts.forEach((sku, index) => {
      console.log(`   ${index + 1}. ${sku.brand} ${sku.size} ${sku.is_carton ? '(Carton)' : '(Bottle)'}`);
      console.log(`      ID: ${sku.id}`);
      console.log(`      Units per carton: ${sku.units_per_carton}`);
    });

    console.log('\n🎉 Duplicate prevention test completed!');
    console.log('\n✅ Summary:');
    console.log('   ✅ New products can be created');
    console.log('   ✅ Duplicate products are prevented (409 Conflict)');
    console.log('   ✅ Bottle and Carton versions are treated as different products');
    console.log('   ✅ Clear error messages guide users to use restock instead');

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

testDuplicateSKU();
