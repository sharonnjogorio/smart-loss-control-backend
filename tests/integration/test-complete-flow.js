/**
 * COMPLETE API TEST FLOW
 * Tests Owner Auth, Staff Auth, and Inventory Management
 * 
 * Run: node test-complete-flow.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let ownerToken = '';
let staffToken = '';
let shopId = '';
let qrToken = '';
let skuId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Test phone number (use your actual registered number)
const TEST_PHONE = '+254712345678';
const TEST_OWNER_NAME = 'Test Owner';
const TEST_SHOP_NAME = 'Test Shop';
const TEST_STAFF_NAME = 'Test Staff';
const TEST_STAFF_PIN = '4321';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// OWNER AUTHENTICATION TESTS
// ============================================

async function testOwnerLogin() {
  logSection('TEST 1: OWNER LOGIN');
  
  try {
    logInfo(`Requesting OTP for phone: ${TEST_PHONE}`);
    
    const response = await axios.post(`${BASE_URL}/auth/login-owner`, {
      phone: TEST_PHONE
    });

    if (response.data.success) {
      logSuccess('OTP sent successfully');
      logInfo(`Owner: ${response.data.owner_name}`);
      logInfo(`Shop: ${response.data.shop_name}`);
      
      if (response.data.dev_otp) {
        logInfo(`Development OTP: ${response.data.dev_otp}`);
        return response.data.dev_otp;
      } else {
        logInfo('Check your phone for OTP (production mode)');
        return null;
      }
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logError('Owner not found - trying registration instead...');
      return await testOwnerRegistration();
    }
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testOwnerRegistration() {
  logSection('TEST 1B: OWNER REGISTRATION (NEW OWNER)');
  
  try {
    logInfo('Registering new owner...');
    
    const response = await axios.post(`${BASE_URL}/auth/register-owner`, {
      full_name: TEST_OWNER_NAME,
      shop_name: TEST_SHOP_NAME,
      phone: TEST_PHONE
    });

    if (response.data.success) {
      logSuccess('Owner registered successfully');
      
      if (response.data.dev_otp) {
        logInfo(`Development OTP: ${response.data.dev_otp}`);
        return response.data.dev_otp;
      }
    }
  } catch (error) {
    logError(`Registration failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testVerifyOTP(otp) {
  logSection('TEST 2: VERIFY OTP');
  
  try {
    logInfo(`Verifying OTP: ${otp}`);
    
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      phone: TEST_PHONE,
      otp: otp
    });

    if (response.data.success && response.data.token) {
      logSuccess('OTP verified successfully');
      logInfo(`Token received: ${response.data.token.substring(0, 20)}...`);
      
      ownerToken = response.data.token;
      shopId = response.data.user.shop_id;
      
      logInfo(`Shop ID: ${shopId}`);
      logInfo(`User ID: ${response.data.user.id}`);
      
      return response.data.token;
    }
  } catch (error) {
    logError(`OTP verification failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// ============================================
// INVENTORY TESTS
// ============================================

async function testCreateSKU() {
  logSection('TEST 3: CREATE SKU (PRODUCT)');
  
  try {
    logInfo('Creating new SKU: King\'s Oil 5L');
    
    const response = await axios.post(
      `${BASE_URL}/inventory/skus`,
      {
        brand: "King's Oil",
        size: "5L",
        is_carton: false,
        units_per_carton: 12
      },
      {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }
    );

    if (response.data.success) {
      logSuccess('SKU created successfully');
      skuId = response.data.sku.id;
      logInfo(`SKU ID: ${skuId}`);
      return skuId;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      logInfo('SKU already exists - fetching existing SKU...');
      return await testGetSKUs();
    }
    logError(`SKU creation failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testGetSKUs() {
  logSection('TEST 4: GET ALL SKUs');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/inventory/skus`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }
    );

    if (response.data.success) {
      logSuccess(`Found ${response.data.count} SKUs`);
      
      if (response.data.skus.length > 0) {
        skuId = response.data.skus[0].id;
        logInfo(`Using SKU: ${response.data.skus[0].brand} ${response.data.skus[0].size}`);
        logInfo(`SKU ID: ${skuId}`);
      }
      
      return skuId;
    }
  } catch (error) {
    logError(`Get SKUs failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testRestock() {
  logSection('TEST 5: RESTOCK INVENTORY');
  
  try {
    logInfo('Recording restock: 100 units ordered, 98 received');
    
    const response = await axios.post(
      `${BASE_URL}/inventory/restock`,
      {
        sku_id: skuId,
        ordered_qty: 100,
        received_qty: 98,
        cost_price: 1850,
        selling_price: 2100
      },
      {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }
    );

    if (response.data.success) {
      logSuccess('Restock recorded successfully');
      logInfo(`Discrepancy: ${response.data.restock.discrepancy} units`);
      logInfo(`Inventory after: ${response.data.restock.inventory_after} units`);
    }
  } catch (error) {
    logError(`Restock failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

async function testGetInventory() {
  logSection('TEST 6: GET INVENTORY SUMMARY');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/inventory/summary`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }
    );

    if (response.data.success) {
      logSuccess(`Inventory retrieved: ${response.data.inventory.length} items`);
      
      response.data.inventory.forEach(item => {
        logInfo(`${item.brand} ${item.size}: ${item.quantity} units @ $${item.sell_price}`);
      });
    }
  } catch (error) {
    logError(`Get inventory failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// ============================================
// STAFF AUTHENTICATION TESTS
// ============================================

async function testGenerateQR() {
  logSection('TEST 7: GENERATE QR CODE (OWNER)');
  
  try {
    logInfo('Generating QR code for staff onboarding...');
    
    const response = await axios.post(
      `${BASE_URL}/auth/generate-qr`,
      {},
      {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }
    );

    if (response.data.success) {
      logSuccess('QR code generated successfully');
      qrToken = response.data.qr_code.token;
      logInfo(`QR Token: ${qrToken.substring(0, 20)}...`);
      logInfo(`Expires in: ${response.data.qr_code.expires_in_minutes} minutes`);
      return qrToken;
    }
  } catch (error) {
    logError(`QR generation failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testStaffLink() {
  logSection('TEST 8: STAFF DEVICE LINKING');
  
  try {
    logInfo(`Linking staff: ${TEST_STAFF_NAME}`);
    
    const response = await axios.post(
      `${BASE_URL}/auth/staff/link`,
      {
        qr_token: qrToken,
        device_id: 'test-device-123',
        staff_name: TEST_STAFF_NAME,
        pin: TEST_STAFF_PIN
      }
    );

    if (response.data.success) {
      logSuccess('Staff linked successfully');
      logInfo(`Staff ID: ${response.data.staff.id}`);
      logInfo(`Staff Name: ${response.data.staff.full_name}`);
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
      logInfo('Staff already exists - continuing...');
    } else {
      logError(`Staff linking failed: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }
}

async function testStaffLogin() {
  logSection('TEST 9: STAFF PIN LOGIN');
  
  try {
    logInfo(`Staff logging in: ${TEST_STAFF_NAME}`);
    
    const response = await axios.post(
      `${BASE_URL}/auth/login-pin`,
      {
        staff_name: TEST_STAFF_NAME,
        pin: TEST_STAFF_PIN
      }
    );

    if (response.data.success && response.data.token) {
      logSuccess('Staff login successful');
      staffToken = response.data.token;
      logInfo(`Token received: ${staffToken.substring(0, 20)}...`);
      return staffToken;
    }
  } catch (error) {
    logError(`Staff login failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.clear();
  log('\n🚀 SMART LOSS CONTROL API - COMPLETE TEST SUITE\n', 'cyan');
  
  try {
    // Test 1-2: Owner Authentication
    const otp = await testOwnerLogin();
    if (!otp) {
      logError('Cannot continue without OTP. Please enter OTP manually.');
      return;
    }
    
    await sleep(1000);
    await testVerifyOTP(otp);
    
    // Test 3-6: Inventory Management
    await sleep(1000);
    await testCreateSKU();
    
    await sleep(1000);
    await testGetSKUs();
    
    await sleep(1000);
    await testRestock();
    
    await sleep(1000);
    await testGetInventory();
    
    // Test 7-9: Staff Authentication
    await sleep(1000);
    await testGenerateQR();
    
    await sleep(1000);
    await testStaffLink();
    
    await sleep(1000);
    await testStaffLogin();
    
    // Summary
    logSection('TEST SUMMARY');
    logSuccess('All tests completed successfully! ✓');
    log('\nYour API is ready for testing in Swagger UI:', 'green');
    log(`${BASE_URL}/api-docs\n`, 'cyan');
    
  } catch (error) {
    logSection('TEST FAILED');
    logError('Test suite failed. Check the errors above.');
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
