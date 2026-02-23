require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function createTestStaff() {
  try {
    console.log('🧪 Creating test staff user...\n');

    // Step 1: Login as owner to get token
    console.log('1. Logging in as owner...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login-owner`, {
      phone: '+254712345678' // Using existing test owner
    });

    if (!loginResponse.data.success) {
      console.log('❌ Owner login failed');
      return;
    }

    console.log('✅ Owner login successful');
    console.log('📱 OTP:', loginResponse.data.dev_otp);

    // Step 2: Verify OTP
    console.log('\n2. Verifying OTP...');
    const otpResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: '+254712345678',
      otp: loginResponse.data.dev_otp
    });

    if (!otpResponse.data.success) {
      console.log('❌ OTP verification failed');
      return;
    }

    const ownerToken = otpResponse.data.token;
    console.log('✅ OTP verified, got owner token');

    // Step 3: Generate QR code
    console.log('\n3. Generating QR code...');
    const qrResponse = await axios.post(`${API_BASE}/auth/generate-qr`, {}, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    if (!qrResponse.data.success) {
      console.log('❌ QR generation failed');
      return;
    }

    const qrToken = qrResponse.data.qr_code.token;
    console.log('✅ QR code generated:', qrToken);

    // Step 4: Link staff device
    console.log('\n4. Linking staff device...');
    const linkResponse = await axios.post(`${API_BASE}/auth/staff/link`, {
      qr_token: qrToken,
      device_id: 'test-device-chinedu',
      staff_name: 'Chinedu',
      pin: '4321'
    });

    if (!linkResponse.data.success) {
      console.log('❌ Staff linking failed:', linkResponse.data.message);
      return;
    }

    console.log('✅ Staff linked successfully!');
    console.log('Staff details:', linkResponse.data.staff);

    // Step 5: Test staff login
    console.log('\n5. Testing staff login...');
    const staffLoginResponse = await axios.post(`${API_BASE}/auth/login-pin`, {
      staff_name: 'Chinedu',
      pin: '4321'
    });

    if (!staffLoginResponse.data.success) {
      console.log('❌ Staff login failed');
      return;
    }

    console.log('✅ Staff login successful!');
    console.log('Staff token received');

    console.log('\n🎉 Test staff "Chinedu" with PIN "4321" is ready for testing!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createTestStaff();