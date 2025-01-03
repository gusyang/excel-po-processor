export const CONFIG = {
  CHECKPOINT_FILE: './checkpoint.json',
  TEMP_OUTPUT_FILE: './temp_output.xlsx',
  LOG_DIR: './logs',
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  LOG_RETENTION_DAYS: 30,
  API_KEY: '70AB4F85-FC84-48C2-B6FB-732690694F10',
  API_COOKIE: 'ARRAffinity=cfb98572471b0c41299b8ff4c92bbd3ef0be3e4e54d0a694aa6258a51d038669; ARRAffinitySameSite=cfb98572471b0c41299b8ff4c92bbd3ef0be3e4e54d0a694aa6258a51d038669',
  API_URL: 'https://importanalyst.azurewebsites.net/api/v2/FTZ/GetPurchaseOrderDetails',
  DEBUG: true,
}; 
