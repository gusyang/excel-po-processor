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
    console.log('Starting summary generation...');
    const today = new Date().toISOString().split('T')[0];
    const logFiles = fs.readdirSync(CONFIG.LOG_DIR)
      .filter(file => {
        // Only include execution logs from today
        return file === `execution_log_${today}.txt` || 
               file.startsWith(`execution_log_${today}_`); // For multiple log files of same day
      });

    let summary = {
      total: 0,
      success: 0,
      failure: 0,
      errors: {},
      averageDuration: 0,
      totalDuration: 0
    };

    if (logFiles.length === 0) {
      console.log('No log files found for today:', today);
      return summary;
    }

    logFiles.forEach(file => {
      const content = fs.readFileSync(path.join(CONFIG.LOG_DIR, file), 'utf-8');
      if (!content || content.trim() === '') return;

      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Only process lines that match our expected format
        if (!line.includes(' | PO:') || !line.includes(' | Duration:') || !line.includes(' | Status:')) {
          continue;
        }

        // Split by | and trim each part
        const parts = line.split('|').map(part => part.trim());
        
        // Validate that we have all required parts
        if (parts.length < 4) continue;

        // Parse duration
        const durationPart = parts.find(part => part.startsWith('Duration:'));
        if (durationPart) {
          const duration = parseFloat(durationPart.replace('Duration:', '').replace('s', ''));
          if (!isNaN(duration)) {
            summary.totalDuration += duration;
          }
        }

        // Parse the status
        const statusPart = parts.find(part => part.startsWith('Status:'));
        if (!statusPart) continue;

        const status = statusPart.replace('Status:', '').trim();
        summary.total++;

        if (status === 'SUCCESS') {
          summary.success++;
        } else if (status === 'FAILED') {
          summary.failure++;
          // Get error message if present
          const errorPart = parts.find(part => part.includes('Error:'));
          if (errorPart) {
            const error = errorPart.substring(errorPart.indexOf('Error:') + 6).split('\n')[0].trim();
            summary.errors[error] = (summary.errors[error] || 0) + 1;
          } else {
            summary.errors['Unknown error'] = (summary.errors['Unknown error'] || 0) + 1;
          }
        }
      }
    });

    // Calculate average duration
    summary.averageDuration = summary.total > 0 ? 
      (summary.totalDuration / summary.total).toFixed(2) : 0;

    const summaryContent = `
Daily Summary (${new Date().toISOString().split('T')[0]})
----------------------------------------
Total Requests: ${summary.total}
Successful: ${summary.success}
Failed: ${summary.failure}
Average Duration: ${summary.averageDuration}s
Total Duration: ${summary.totalDuration.toFixed(2)}s

Error Breakdown:
${Object.entries(summary.errors)
  .map(([error, count]) => `- ${error}: ${count} occurrences`)
  .join('\n')}
`;

    const summaryPath = path.join(CONFIG.LOG_DIR, `summary_${new Date().toISOString().split('T')[0]}.txt`);
    fs.writeFileSync(summaryPath, summaryContent);
    console.log(`Summary written to: ${summaryPath}`);
    
    return summary;
  }
} 