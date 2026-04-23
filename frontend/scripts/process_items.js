const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/items_raw.json');
const outputPath = path.join(__dirname, '../public/items.json');

try {
  console.log('Reading raw items file...');
  const data = fs.readFileSync(inputPath, 'utf8');
  const items = JSON.parse(data);
  
  console.log(`Processing ${items.length} items...`);
  
  const processed = items
    .filter(item => item.UniqueName && item.LocalizedNames && item.LocalizedNames['EN-US'])
    .map(item => {
      const name = item.LocalizedNames['EN-US'];
      const id = item.UniqueName;
      
      // Try to extract tier
      let tier = null;
      const tierMatch = id.match(/^T(\d)/);
      if (tierMatch) {
        tier = parseInt(tierMatch[1]);
      }
      
      return { id, name, tier };
    });
    
  console.log(`Writing ${processed.length} processed items to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(processed));
  console.log('Done!');
} catch (error) {
  console.error('Error processing items:', error);
}
