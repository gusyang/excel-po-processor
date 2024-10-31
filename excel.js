import xlsx from 'xlsx';
import fs from 'fs';
import { CONFIG } from './config.js';

export class ExcelHandler {
  static loadCheckpoint() {
    try {
      if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
        const checkpoint = JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf8'));
        console.log(`Resuming from row ${checkpoint.lastProcessedRow}`);
        return checkpoint.lastProcessedRow;
      }
    } catch (error) {
      console.error('Error loading checkpoint:', error);
    }
    return -1;
  }

  static saveCheckpoint(rowIndex, data) {
    try {
      fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify({ lastProcessedRow: rowIndex }));
      const tempWorkbook = xlsx.utils.book_new();
      const tempSheet = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(tempWorkbook, tempSheet, 'Updated Data');
      xlsx.writeFile(tempWorkbook, CONFIG.TEMP_OUTPUT_FILE);
      console.log(`Checkpoint saved at row ${rowIndex}`);
    } catch (error) {
      console.error('Error saving checkpoint:', error);
    }
  }

  static readExcelFile(inputFile) {
    const workbook = xlsx.readFile(inputFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
  }

  static writeExcelFile(data, outputFile) {
    const newWorkbook = xlsx.utils.book_new();
    const newSheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Updated Data');
    xlsx.writeFile(newWorkbook, outputFile);
  }
} 