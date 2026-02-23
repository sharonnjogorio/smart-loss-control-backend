const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testDashboardWithData() {
  try {
    console.log('🧪 Testing Dashboard with Real Data...\n');

    // Use the original test owner that has inventory
    console.log('1. Logging in as owner with data...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login-owner`, {
      phone: '+2348099999999' // Original test owner
    });

    console.log(`✅ OTP sent. Dev OTP: ${loginResponse.data.dev_otp}`);

    const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: '+2348099999999',
      otp: loginResponse.data.dev_otp
    });

    const ownerToken = verifyResponse.data.token;
    console.log('✅ Owner logged in successfully\n');

    // Get dashboard
    console.log('2. Fetching dashboard overview...');
    const dashboardResponse = await axios.get(`${API_BASE}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    const dashboard = dashboardResponse.data;

    console.log('\n📊 DASHBOARD OVERVIEW:');
    console.log('='.repeat(60));
    
    console.log('\n🏪 Shop Information:');
    console.log(`   Name: ${dashboard.shop.shop_name}`);
    console.log(`   Owner: ${dashboard.shop.owner_phone}`);
    
    console.log('\n💚 Shop Health:');
    console.log(`   Score: ${dashboard.health.score}%`);
    console.log(`   Status: ${dashboard.health.status}`);
    console.log(`   Message: ${dashboard.health.message}`);
    
    console.log('\n📈 Quick Stats:');
    console.log(`   💰 Inventory Value: $${dashboard.stats.inventory_value}`);
    console.log(`   📦 Total Products: ${dashboard.stats.total_products} SKUs`);
    console.log(`   📊 Total Units: ${dashboard.stats.total_units} items`);
    console.log(`   🛒 Today's Sales: ${dashboard.stats.today_sales_count} transactions`);
    console.log(`   📤 Units Sold Today: ${dashboard.stats.today_units_sold}`);
    console.log(`   💵 Today's Revenue: $${dashboard.stats.today_revenue}`);
    console.log(`   🚨 Open Alerts: ${dashboard.stats.open_alerts}`);
    console.log(`   👥 Active Staff: ${dashboard.stats.active_staff}`);
    
    console.log('\n🚨 Recent Alerts:');
    if (dashboard.recent_alerts.length === 0) {
      console.log('   ✅ No recent alerts - Shop is running smoothly!');
    } else {
      dashboard.recent_alerts.forEach((alert, index) => {
        const icon = alert.status === 'CRITICAL' ? '🔴' : alert.status === 'WARNING' ? '🟡' : '🟢';
        console.log(`   ${icon} ${index + 1}. ${alert.product}`);
        console.log(`      Deviation: ${alert.deviation} units`);
        console.log(`      Estimated Loss: $${alert.estimated_loss}`);
        console.log(`      Status: ${alert.status}`);
        console.log(`      Time: ${alert.time_ago}`);
      });
    }
    
    console.log('\n📦 Low Stock Items:');
    if (dashboard.low_stock_items.length === 0) {
      console.log('   ✅ All products are well stocked!');
    } else {
      dashboard.low_stock_items.forEach((item, index) => {
        console.log(`   ⚠️  ${index + 1}. ${item.product}`);
        console.log(`      Current Stock: ${item.quantity} units`);
        console.log(`      Reorder Level: ${item.reorder_level} units`);
        console.log(`      Action: Restock needed!`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Dashboard is ready for production!');

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

testDashboardWithData();
