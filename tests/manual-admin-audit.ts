/**
 * Manual Admin Dashboard Audit - Phase 2 Mission
 * Expert-level systematic testing of all admin features
 */

async function adminAudit() {
  const baseUrl = 'http://localhost:5000';
  console.log('🔍 PHASE 2 MISSION: ADMIN DASHBOARD AUDIT\n');

  // Step 1: Admin Authentication Test
  console.log('1️⃣ TESTING ADMIN AUTHENTICATION');
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });

  if (!loginResponse.ok) {
    console.log('❌ Admin authentication failed');
    return;
  }

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Admin authentication successful\n');

  // Step 2: Menu & Menu-Type Management Testing
  console.log('2️⃣ TESTING MENU & MENU-TYPE MANAGEMENT');
  
  // Test Menu Items API
  const menuItemsResponse = await fetch(`${baseUrl}/api/menu-items`, {
    headers: { 'Cookie': cookies || '' }
  });
  const menuItemsData = await menuItemsResponse.json();
  
  if (menuItemsData.success) {
    console.log(`✅ Menu Items API: ${menuItemsData.data.length} items loaded`);
    
    // Test creating a new menu item
    const newMenuItem = {
      name: 'Audit Test Flavor (vanilla)',
      category: 'base',
      price: 6.99,
      description: 'Test item for audit',
      isActive: true,
      sortOrder: 999
    };
    
    const createResponse = await fetch(`${baseUrl}/api/menu-items`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies || '' 
      },
      body: JSON.stringify(newMenuItem)
    });
    
    const createResult = await createResponse.json();
    if (createResult.success) {
      console.log('✅ Menu Item Creation: Working');
      
      // Test updating the item
      const updateResponse = await fetch(`${baseUrl}/api/menu-items/${createResult.data.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies || '' 
        },
        body: JSON.stringify({ price: 7.99 })
      });
      
      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        console.log('✅ Menu Item Update: Working');
      } else {
        console.log('❌ Menu Item Update: Failed -', updateResult.message);
      }
      
      // Test deleting the item
      const deleteResponse = await fetch(`${baseUrl}/api/menu-items/${createResult.data.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': cookies || '' }
      });
      
      const deleteResult = await deleteResponse.json();
      if (deleteResult.success) {
        console.log('✅ Menu Item Deletion: Working');
      } else {
        console.log('❌ Menu Item Deletion: Failed -', deleteResult.message);
      }
    } else {
      console.log('❌ Menu Item Creation: Failed -', createResult.message);
    }
  } else {
    console.log('❌ Menu Items API: Failed');
  }

  // Test Menu Types API
  const menuTypesResponse = await fetch(`${baseUrl}/api/menus`, {
    headers: { 'Cookie': cookies || '' }
  });
  const menuTypesData = await menuTypesResponse.json();
  
  if (menuTypesData.success) {
    console.log(`✅ Menu Types API: ${menuTypesData.data.length} types loaded`);
    
    // Test creating a new menu type
    const newMenuType = {
      name: 'Audit Test Menu',
      description: 'Test menu for audit',
      orderingFlow: 'three-step',
      isActive: true,
      sortOrder: 999
    };
    
    const createMenuResponse = await fetch(`${baseUrl}/api/menus`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies || '' 
      },
      body: JSON.stringify(newMenuType)
    });
    
    const createMenuResult = await createMenuResponse.json();
    if (createMenuResult.success) {
      console.log('✅ Menu Type Creation: Working');
    } else {
      console.log('❌ Menu Type Creation: Failed -', createMenuResult.message);
    }
  } else {
    console.log('❌ Menu Types API: Failed');
  }
  
  console.log();

  // Step 3: Orders Tab Testing
  console.log('3️⃣ TESTING ORDERS TAB');
  
  const ordersResponse = await fetch(`${baseUrl}/api/orders`, {
    headers: { 'Cookie': cookies || '' }
  });
  const ordersData = await ordersResponse.json();
  
  if (ordersData.success) {
    console.log(`✅ Orders API: ${ordersData.data.length} orders loaded`);
    
    // Test creating a new order
    const testOrder = {
      customerName: 'Audit Test Customer',
      items: [
        { name: 'Vanilla', price: 5.99, quantity: 1 },
        { name: 'Chocolate Sauce', price: 1.50, quantity: 1 }
      ],
      totalAmount: 7.49
    };
    
    const createOrderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder)
    });
    
    const createOrderResult = await createOrderResponse.json();
    if (createOrderResult.success) {
      console.log('✅ Order Creation: Working');
      
      // Test updating order status
      const statusResponse = await fetch(`${baseUrl}/api/orders/${createOrderResult.data.id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies || '' 
        },
        body: JSON.stringify({ status: 'fulfilled' })
      });
      
      const statusResult = await statusResponse.json();
      if (statusResult.success) {
        console.log('✅ Order Status Update: Working');
      } else {
        console.log('❌ Order Status Update: Failed -', statusResult.message);
      }
    } else {
      console.log('❌ Order Creation: Failed -', createOrderResult.message);
    }
  } else {
    console.log('❌ Orders API: Failed');
  }
  
  console.log();

  // Step 4: QR Code Generator Testing
  console.log('4️⃣ TESTING QR CODE GENERATOR');
  
  const flows = ['three-step', 'single-page', 'custom'];
  
  for (const flow of flows) {
    const qrResponse = await fetch(`${baseUrl}/api/qr/generate?flow=${flow}`, {
      headers: { 'Cookie': cookies || '' }
    });
    
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      if (qrData.success) {
        console.log(`✅ QR Code Generation (${flow}): Working`);
      } else {
        console.log(`❌ QR Code Generation (${flow}): Failed -`, qrData.message);
      }
    } else {
      console.log(`❌ QR Code API (${flow}): HTTP ${qrResponse.status}`);
    }
  }
  
  console.log();

  // Step 5: Manual Ticket Entry Testing
  console.log('5️⃣ TESTING MANUAL TICKET ENTRY');
  
  const manualOrder = {
    customerName: 'Manual Entry Test',
    items: [
      { name: 'Strawberry', price: 5.99, quantity: 2 },
      { name: 'Vanilla Sauce', price: 1.50, quantity: 1 }
    ],
    totalAmount: 13.48,
    source: 'manual_entry'
  };
  
  const manualResponse = await fetch(`${baseUrl}/api/orders/manual`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookies || '' 
    },
    body: JSON.stringify(manualOrder)
  });
  
  if (manualResponse.ok) {
    const manualResult = await manualResponse.json();
    if (manualResult.success) {
      console.log('✅ Manual Order Entry: Working');
    } else {
      console.log('❌ Manual Order Entry: Failed -', manualResult.message);
    }
  } else {
    console.log(`❌ Manual Entry API: HTTP ${manualResponse.status}`);
  }
  
  // Test invalid manual entry
  const invalidManualResponse = await fetch(`${baseUrl}/api/orders/manual`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookies || '' 
    },
    body: JSON.stringify({ incomplete: 'data' })
  });
  
  if (invalidManualResponse.status === 400) {
    console.log('✅ Manual Entry Validation: Working (properly rejects invalid data)');
  } else {
    console.log('❌ Manual Entry Validation: Failed (should reject invalid data)');
  }
  
  console.log();

  // Step 6: Inventory Integration Testing
  console.log('6️⃣ TESTING INVENTORY INTEGRATION');
  
  const inventoryResponse = await fetch(`${baseUrl}/api/inventory`, {
    headers: { 'Cookie': cookies || '' }
  });
  const inventoryData = await inventoryResponse.json();
  
  if (inventoryData.success) {
    console.log(`✅ Inventory API: ${inventoryData.data.inventory.length} items loaded`);
    
    // Test inventory adjustments
    const firstItem = inventoryData.data.inventory[0];
    const adjustments = [{
      inventoryItemId: firstItem.id,
      adjustment: -1,
      reason: 'Audit test adjustment',
      note: 'Testing inventory decrement'
    }];
    
    const adjustResponse = await fetch(`${baseUrl}/api/inventory-adjustments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies || '' 
      },
      body: JSON.stringify({ adjustments })
    });
    
    const adjustResult = await adjustResponse.json();
    if (adjustResult.success) {
      console.log('✅ Inventory Adjustments: Working');
    } else {
      console.log('❌ Inventory Adjustments: Failed -', adjustResult.message);
    }
  } else {
    console.log('❌ Inventory API: Failed');
  }
  
  console.log('\n🎯 AUDIT SUMMARY COMPLETE - See results above');
}

// Run the audit
adminAudit().catch(console.error);