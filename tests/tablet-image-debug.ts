/**
 * Tablet Image Loading Debug Test
 * Investigates why images aren't loading on tablets
 */

// Test actual image URLs from the database
async function testTabletImageLoading() {
  console.log('🔍 TABLET IMAGE LOADING DEBUG');
  console.log('='.repeat(50));
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Get actual menu data
    const menusResponse = await fetch(`${baseUrl}/api/menus`);
    const menusData = await menusResponse.json();
    const menus = menusData.data || [];
    
    console.log('\n📋 TESTING ACTUAL IMAGE URLS FROM DATABASE:');
    
    for (const menu of menus) {
      if (menu.imageUrl) {
        console.log(`\n🧪 Testing: ${menu.name}`);
        console.log(`   URL: ${menu.imageUrl}`);
        
        try {
          // Test if URL is accessible
          const imageResponse = await fetch(menu.imageUrl, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            }
          });
          
          console.log(`   Status: ${imageResponse.status} ${imageResponse.statusText}`);
          console.log(`   Content-Type: ${imageResponse.headers.get('content-type')}`);
          console.log(`   Access-Control-Allow-Origin: ${imageResponse.headers.get('access-control-allow-origin') || 'Not set'}`);
          
          // Check for CORS issues
          const corsHeader = imageResponse.headers.get('access-control-allow-origin');
          if (!corsHeader || (corsHeader !== '*' && !corsHeader.includes('replit'))) {
            console.log(`   ⚠️  CORS Issue: ${corsHeader || 'No CORS header'}`);
          } else {
            console.log(`   ✅ CORS OK`);
          }
          
        } catch (error) {
          console.log(`   ❌ FETCH ERROR: ${error.message}`);
        }
      }
    }
    
    console.log('\n🔧 CLOUDINARY URL ANALYSIS:');
    
    // Check Cloudinary URLs specifically
    const cloudinaryUrls = menus
      .filter(m => m.imageUrl && m.imageUrl.includes('cloudinary'))
      .map(m => m.imageUrl);
      
    console.log(`Found ${cloudinaryUrls.length} Cloudinary URLs`);
    
    for (const url of cloudinaryUrls) {
      console.log(`\n🔍 Analyzing: ${url.substring(0, 80)}...`);
      
      // Check if it's a thumbnail/preview URL (these often have CORS issues)
      if (url.includes('/thumbnails/') || url.includes('/preview')) {
        console.log(`   ⚠️  THUMBNAIL/PREVIEW URL - May have CORS restrictions`);
      }
      
      // Suggest alternative URLs
      if (url.includes('res-console.cloudinary.com')) {
        const publicUrl = url.replace('res-console.cloudinary.com', 'res.cloudinary.com');
        console.log(`   💡 Suggested public URL: ${publicUrl.substring(0, 80)}...`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
  }
}

// Run the debug test
testTabletImageLoading().catch(console.error);