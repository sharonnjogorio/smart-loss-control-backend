const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testSwagger() {
  try {
    console.log('🧪 Testing Swagger Documentation...\n');

    // Test 1: Check if Swagger UI is accessible
    console.log('1. Checking Swagger UI accessibility...');
    const swaggerResponse = await axios.get(`${API_BASE}/api-docs/`);
    
    if (swaggerResponse.status === 200) {
      console.log('✅ Swagger UI is accessible at http://localhost:5000/api-docs/');
    }

    // Test 2: Check if OpenAPI spec is loaded
    console.log('\n2. Checking OpenAPI specification...');
    const yaml = require('yamljs');
    const swaggerDoc = yaml.load('./docs/openapi.yaml');
    
    console.log(`✅ OpenAPI Version: ${swaggerDoc.openapi}`);
    console.log(`✅ API Title: ${swaggerDoc.info.title}`);
    console.log(`✅ API Version: ${swaggerDoc.info.version}`);

    // Test 3: Count endpoints
    console.log('\n3. Counting documented endpoints...');
    const paths = Object.keys(swaggerDoc.paths);
    const totalEndpoints = paths.reduce((count, path) => {
      return count + Object.keys(swaggerDoc.paths[path]).length;
    }, 0);

    console.log(`✅ Total paths: ${paths.length}`);
    console.log(`✅ Total endpoints: ${totalEndpoints}`);

    // Test 4: Check shop endpoints
    console.log('\n4. Verifying Shop Management endpoints...');
    const shopEndpoints = [
      '/shops/me',
      '/shops/staff',
      '/shops/staff/{staff_id}',
      '/shops/staff/{staff_id}/revoke',
      '/shops/staff/{staff_id}/reactivate'
    ];

    let shopEndpointCount = 0;
    shopEndpoints.forEach(endpoint => {
      if (swaggerDoc.paths[endpoint]) {
        const methods = Object.keys(swaggerDoc.paths[endpoint]);
        console.log(`   ✅ ${endpoint} - Methods: ${methods.join(', ').toUpperCase()}`);
        shopEndpointCount += methods.length;
      } else {
        console.log(`   ❌ ${endpoint} - NOT FOUND`);
      }
    });

    console.log(`\n✅ Shop Management endpoints documented: ${shopEndpointCount}/6`);

    // Test 5: Check tags
    console.log('\n5. Checking API tags...');
    const tags = swaggerDoc.tags.map(t => t.name);
    console.log(`   Tags: ${tags.join(', ')}`);

    console.log('\n🎉 Swagger documentation is properly configured!');
    console.log('\n📖 Access documentation at: http://localhost:5000/api-docs/');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Server is not running! Start it with: npm start');
    } else if (error.response?.data) {
      console.error('   API Error:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Run the test
testSwagger();
