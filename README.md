# Excel PO Processing Tool

Automated tool for processing Purchase Orders and updating Excel files with API data.

## Setup

1. Install dependencies: 

npm install


2. Configure the application:
   - Update `src/config.js` with your API credentials
   - Ensure input Excel file is in the correct location

3. Run the application:
node updateExcel.js

## Features

- Processes Excel files with PO data
- Fetches additional information from API
- Checkpoint system for resumable operations
- Detailed logging system
- Daily execution summaries

## Project Structure

```
project/
├── src/
│   ├── config.js      # Configuration settings
│   ├── logger.js      # Logging functionality
│   ├── excel.js       # Excel file operations
│   ├── api.js         # API interaction
│   └── utils.js       # Utility functions
├── logs/              # Log files directory
├── updateExcel.js     # Main application file
├── package.json
└── README.md
```

## Logging

- Logs are stored in the `logs` directory
- Daily log files with format: `execution_log_YYYY-MM-DD.txt`
- Daily summaries available in: `summary_YYYY-MM-DD.txt`

## Error Handling

- Checkpoint system saves progress regularly
- Automatic resume from last successful operation
- Detailed error logging

## Maintenance

Logs are automatically cleaned up after 30 days.

4. Create a package.json if you haven't already:
{
  "name": "excel-po-processor",
  "version": "1.0.0",
  "type": "module",
  "description": "Excel PO processing tool with API integration",
  "main": "updateExcel.js",
  "scripts": {
    "start": "node updateExcel.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "xlsx": "^latest",
    "node-fetch": "^latest"
  }
}

5. If you're using GitHub, you can create a new repository and push your code:

```bash
# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/excel-po-processor.git

# Push to GitHub
git branch -M main
git push -u origin main
```

