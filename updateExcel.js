import { Logger } from './src/logger.js';
import { ExcelHandler } from './src/excel.js';
import { ApiHandler } from './src/api.js';
import { sleep, debug } from './src/utils.js';
import fs from 'fs';
import { CONFIG } from './src/config.js';

async function updateExcel(inputFile, outputFile) {
  Logger.cleanupOldLogs();
  
  const data = ExcelHandler.readExcelFile(inputFile);
  const startRow = ExcelHandler.loadCheckpoint() + 1;

  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    let poNo = row.poNo;
    if(poNo && poNo[0] !== 'P') {
      Logger.logExecution(poNo, new Date(), false, 'PO number does not start with P, skipping');
      continue;
    }

    if (poNo) {
      poNo = poNo.substring(1);
      //do not change the poNo in the excel file
      //row.poNo = poNo; 

      const startTime = new Date();
      try {
        const jsonData = await ApiHandler.fetchPurchaseOrderDetails(poNo);
        
        if (jsonData && jsonData.length > 0) {
          const firstNode = jsonData[0];
          row.masterBillOfLading = firstNode.masterBillOfLading;
          row.houseBillOfLading = firstNode.houseBillOfLading;
          row.containerNum = firstNode.containerNum;
          //do not change subReceiptType in the excel file, using customsStatus instead
          row.customsStatus = firstNode.customsStatus;
          Logger.logExecution(poNo, startTime, true);
        } else {
          Logger.logExecution(poNo, startTime, false, 'No data found');
        }

        ExcelHandler.saveCheckpoint(i, data);

      } catch (error) {
        Logger.logExecution(poNo, startTime, false, error.message);
        ExcelHandler.saveCheckpoint(i - 1, data);
        throw error;
      }

      if ((i + 1) % 100 === 0) {
        debug.log(`Processed ${i + 1} rows. Sleeping for 5 seconds...`);
        await sleep(5000);
      }
    }
  }

  ExcelHandler.writeExcelFile(data, outputFile);
  debug.log(`Updated Excel file saved as ${outputFile}`);
  
  // Cleanup
  fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
  fs.unlinkSync(CONFIG.TEMP_OUTPUT_FILE);
}

// Usage
updateExcel('./sourcefile/book1.xlsx', 'output.xlsx')
  .then(() => {
    try {
      Logger.generateDailySummary();
    } catch (error) {
      debug.error('Failed to generate daily summary:', error);
    }
  })
  .catch(error => {
    debug.error('Script failed:', error);
    try {
      Logger.generateDailySummary();
    } catch (summaryError) {
      debug.error('Failed to generate daily summary:', summaryError);
    }
    process.exit(1);
  });