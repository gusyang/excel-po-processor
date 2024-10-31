import fetch from 'node-fetch';
import { CONFIG } from './config.js';

export class ApiHandler {
  static async fetchPurchaseOrderDetails(poNo) {
    const response = await fetch(
      `${CONFIG.API_URL}?purchaseOrderNumber=${poNo}`,
      {
        headers: {
          'cubeship-api-key': CONFIG.API_KEY,
          'Cookie': CONFIG.API_COOKIE
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
} 