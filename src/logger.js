import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';
import { debug } from './utils.js';

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
    const errorMsg = error ? `Error: ${error.message || error}\nStack: ${error.stack || 'No stack trace'}` : '';
    
    const logLine = `${timestamp} | PO: ${poNo} | Duration: ${duration}s | Status: ${status} | ${errorMsg}\n`;
    
    try {
      const logFile = this.getLogFilePath();
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      debug.error('Error writing to log file:', error);
    }
  }

  static cleanupOldLogs() {
    // Ensure log directory exists
    if (!fs.existsSync(CONFIG.LOG_DIR)) {
      fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
      return; // No logs to cleanup in a new directory
    }

    const files = fs.readdirSync(CONFIG.LOG_DIR);
    const now = new Date();
    
    files.forEach(file => {
      const filePath = path.join(CONFIG.LOG_DIR, file);
      const stats = fs.statSync(filePath);
      const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);
      
      if (daysOld > CONFIG.LOG_RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        debug.log(`Deleted old log file: ${file}`);
      }
    });
  }

  static generateDailySummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const summaryFile = path.join(CONFIG.LOG_DIR, `summary_${today}.txt`);
      const logFile = this.getLogFilePath();

      // Read today's log file
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      // Skip header
      lines.shift();

      // Initialize counters
      const summary = {
        totalExecutions: lines.length,
        successful: 0,
        failed: 0,
        averageDuration: 0,
        totalDuration: 0,
        errors: {}
      };

      // Process each line
      lines.forEach(line => {
        const [timestamp, poInfo, durationStr, statusStr, errorMsg] = line.split('|').map(s => s.trim());
        const status = statusStr.split(':')[1].trim();
        const duration = parseFloat(durationStr.split(':')[1]);

        if (status === 'SUCCESS') {
          summary.successful++;
        } else {
          summary.failed++;
          // Group similar errors
          const errorKey = errorMsg.split('\n')[0]; // Use first line of error
          summary.errors[errorKey] = (summary.errors[errorKey] || 0) + 1;
        }

        summary.totalDuration += duration;
      });

      // Calculate average duration
      summary.averageDuration = summary.totalDuration / summary.totalExecutions;

      // Generate summary text
      const summaryText = `Daily Summary for ${today}
===============================
Total Executions: ${summary.totalExecutions}
Successful: ${summary.successful}
Failed: ${summary.failed}
Success Rate: ${((summary.successful / summary.totalExecutions) * 100).toFixed(2)}%
Average Duration: ${summary.averageDuration.toFixed(2)}s
Total Duration: ${summary.totalDuration.toFixed(2)}s

Error Summary:
${Object.entries(summary.errors)
  .map(([error, count]) => `- ${error} (${count} occurrences)`)
  .join('\n')}
`;

      // Write summary to file
      fs.writeFileSync(summaryFile, summaryText);
      debug.log(`Daily summary generated: ${summaryFile}`);
      
      return summaryFile;
    } catch (error) {
      debug.error('Error generating daily summary:', error);
      throw error;
    }
  }
} 