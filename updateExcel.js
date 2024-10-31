import { Logger } from './src/logger.js';
import { ExcelHandler } from './src/excel.js';
import { ApiHandler } from './src/api.js';
import { sleep } from './src/utils.js';
import fs from 'fs';
import { CONFIG } from './src/config.js';

async function updateExcel(inputFile, outputFile) {
  Logger.cleanupOldLogs();
  
  const data = ExcelHandler.readExcelFile(inputFile);
  const startRow = ExcelHandler.loadCheckpoint() + 1;

  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    let poNo = row.poNo;
    
    if (poNo) {
      poNo = poNo.substring(1);
      row.poNo = poNo;

      const startTime = new Date();
      try {
        const jsonData = await ApiHandler.fetchPurchaseOrderDetails(poNo);
        
        if (jsonData.length > 0) {
          const firstNode = jsonData[0];
          row.masterBillOfLading = firstNode.masterBillOfLading;
          row.houseBillOfLading = firstNode.houseBillOfLading;
          row.containerNum = firstNode.containerNum;
          Logger.logExecution(poNo, startTime, true);
        }

        ExcelHandler.saveCheckpoint(i, data);

      } catch (error) {
        Logger.logExecution(poNo, startTime, false, error.message);
        ExcelHandler.saveCheckpoint(i - 1, data);
        throw error;
      }

      if ((i + 1) % 100 === 0) {
        console.log(`Processed ${i + 1} rows. Sleeping for 5 seconds...`);
        await sleep(5000);
      }
    }
  }

  ExcelHandler.writeExcelFile(data, outputFile);
  console.log(`Updated Excel file saved as ${outputFile}`);
  
  // Cleanup
  fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
  fs.unlinkSync(CONFIG.TEMP_OUTPUT_FILE);
}

// Usage
updateExcel('./sourcefile/book1.xlsx', 'output.xlsx')
  .then(() => {
    Logger.generateDailySummary();
  })
  .catch(error => {
    console.error('Script failed:', error);
    Logger.generateDailySummary();
    process.exit(1);
  });