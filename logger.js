import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

export class Logger {
  static getLogFilePath() {
    const date = new Date().toISOString().split('T')[0];
    const baseFilename = `execution_log_${date}`;
    let counter = 1;
    let logFile = path.join(CONFIG.LOG_DIR, `${baseFilename}.txt`);

    while (fs.existsSync(logFile) && fs.statSync(logFile).size >= CONFIG.MAX_LOG_SIZE) {
      logFile = path.join(CONFIG.LOG_DIR, `${baseFilename}_${counter}.txt`);
      counter++;
    }

    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, 'Timestamp | PO Number | Duration | Status | Error\n');
    }

    return logFile;
  }

  static logExecution(poNo, startTime, success, error = null) {
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    const timestamp = endTime.toISOString();
    const status = success ? 'SUCCESS' : 'FAILED';
    const errorMsg = error ? `Error: ${error}` : '';
    
    const logLine = `${timestamp} | PO: ${poNo} | Duration: ${duration}s | Status: ${status} ${errorMsg}\n`;
    
    try {
      const logFile = this.getLogFilePath();
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  static cleanupOldLogs() {
    const files = fs.readdirSync(CONFIG.LOG_DIR);
    const now = new Date();
    
    files.forEach(file => {
      const filePath = path.join(CONFIG.LOG_DIR, file);
      const stats = fs.statSync(filePath);
      const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);
      
      if (daysOld > CONFIG.LOG_RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      }
    });
  }

  static generateDailySummary() {
    // ... summary generation code ...
  }
} 