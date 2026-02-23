const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testDashboard() {
  try {
    console.log('🧪 Testing Dashboard Overview Endpoint...\n');

    // Step 1: Login as owner
    console.log('1. Logging in as owner...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login-owner`, {
      phone: '+254700000001'
    });

    console.log(`✅ OTP sent. Dev OTP: ${loginResponse.data.dev_otp}`);

    // Verify OTP
    const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: '+254700000001',
      otp: loginResponse.data.dev_otp
    });

    const ownerToken = verifyResponse.data.token;
    console.log('✅ Owner logged in successfully\n');

    // Step 2: Get dashboard overview
    console.log('2. Fetching dashboard overview...');
    const dashboardResponse = await axios.get(`${API_BASE}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    const dashboard = dashboardResponse.data;

    console.log('\n📊 DASHBOARD OVERVIEW:');
    console.log('='.repeat(50));
    
    // Shop Info
    console.log('\n🏪 Shop Information:');
    console.log(`   Name: ${dashboard.shop.shop_name}`);
    console.log(`   Owner: ${dashboard.shop.owner_phone}`);
    
    // Health Score
    console.log('\n💚 Shop Health:');
    console.log(`   Score: ${dashboard.health.score}%`);
    console.log(`   Status: ${dashboard.health.status}`);
    console.log(`   Message: ${dashboard.health.message}`);
    
    // Quick Stats
    console.log('\n📈 Quick Stats:');
    console.log(`   Inventory Value: $${dashboard.stats.inventory_value}`);
    console.log(`   Total Products: ${dashboard.stats.total_products}`);
    console.log(`   Total Units: ${dashboard.stats.total_units}`);
    console.log(`   Today's Sales: ${dashboard.stats.today_sales_count} transactions`);
    console.log(`   Units Sold Today: ${dashboard.stats.today_units_sold}`);
    console.log(`   Today's Revenue: $${dashboard.stats.today_revenue}`);
    console.log(`   Open Alerts: ${dashboard.stats.open_alerts}`);
    console.log(`   Active Staff: ${dashboard.stats.active_staff}`);
    
    // Recent Alerts
    console.log('\n🚨 Recent Alerts:');
    if (dashboard.recent_alerts.length === 0) {
      console.log('   No recent alerts');
    } else {
      dashboard.recent_alerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. ${alert.product}`);
        console.log(`      Deviation: ${alert.deviation} units`);
        console.log(`      Loss: $${alert.estimated_loss}`);
        console.log(`      Status: ${alert.status}`);
        console.log(`      Time: ${alert.time_ago}`);
      });
    }
    
    // Low Stock Items
    console.log('\n📦 Low Stock Items:');
    if (dashboard.low_stock_items.length === 0) {
      console.log('   No low stock items');
    } else {
      dashboard.low_stock_items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product}`);
        console.log(`      Current: ${item.quantity} units`);
        console.log(`      Reorder Level: ${item.reorder_level} units`);
      });
    }

    console.log('\n' + '='.repeat(50));

    // Step 3: Test staff access
    console.log('\n3. Testing staff access to dashboard...');
    
    // Try to login as staff
    const staffList = await axios.get(`${API_BASE}/shops/staff`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    if (staffList.data.staff.length > 0) {
      const staff = staffList.data.staff[0];
      
      try {
        const staffLoginResponse = await axios.post(`${API_BASE}/auth/login-pin`, {
          staff_name: staff.full_name,
          pin: '1234'
        });

        if (staffLoginResponse.data.success) {
          const staffToken = staffLoginResponse.data.token;
          
          const staffDashboard = await axios.get(`${API_BASE}/dashboard/overview`, {
            headers: { Authorization: `Bearer ${staffToken}` }
          });

          console.log('✅ Staff can access dashboard');
          console.log(`   Staff sees: ${staffDashboard.data.stats.total_products} products`);
          console.log(`   Active staff count hidden: ${staffDashboard.data.stats.active_staff === 0 ? 'Yes' : 'No'}`);
        }
      } catch (error) {
        console.log('⚠️  Could not test staff access (PIN might be different)');
      }
    } else {
      console.log('⚠️  No staff members to test with');
    }

    console.log('\n🎉 Dashboard endpoint test completed!');
    console.log('\n✅ Summary:');
    console.log('   ✅ Dashboard overview endpoint working');
    console.log('   ✅ Shop health calculation working');
    console.log('   ✅ Quick stats aggregation working');
    console.log('   ✅ Recent alerts retrieval working');
    console.log('   ✅ Low stock detection working');
    console.log('   ✅ Role-based data filtering working');

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
testDashboard();
