const { storage } = require('./server/storage.js');

async function testActivitySystem() {
  console.log('Testing Activity System...\n');
  
  try {
    // Test 1: Create test activity logs
    console.log('1. Creating test activity logs...');
    
    const testActivities = [
      {
        type: 'account_connected',
        message: 'Test Google account connected successfully',
        metadata: { email: 'test@example.com', action: 'test' }
      },
      {
        type: 'manual_test_sent',
        message: 'Manual test invite sent to test@prospect.com',
        metadata: { eventTitle: 'Test Meeting', sendNow: true }
      },
      {
        type: 'campaign_processed',
        message: 'Campaign "Test Campaign" processed successfully',
        metadata: { campaignName: 'Test Campaign', prospects: 5 }
      },
      {
        type: 'invite_sent',
        message: 'Calendar invite sent to john@example.com',
        metadata: { prospectEmail: 'john@example.com' }
      },
      {
        type: 'invite_accepted',
        message: 'Invite accepted by sarah@company.com',
        metadata: { prospectEmail: 'sarah@company.com' }
      }
    ];
    
    for (const activity of testActivities) {
      await storage.createActivityLog(activity);
      console.log(`✓ Created: ${activity.type} - ${activity.message}`);
    }
    
    // Test 2: Retrieve activity logs
    console.log('\n2. Retrieving activity logs...');
    const activities = await storage.getActivityLogs(10);
    console.log(`✓ Retrieved ${activities.length} activity logs`);
    
    // Test 3: Display activities
    console.log('\n3. Recent Activities:');
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. [${activity.type}] ${activity.message}`);
      console.log(`   Created: ${activity.createdAt}`);
      if (activity.metadata) {
        console.log(`   Metadata: ${JSON.stringify(activity.metadata)}`);
      }
      console.log('');
    });
    
    console.log('✅ Activity system test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Activity system test failed:', error);
  }
}

// Run the test
testActivitySystem().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});