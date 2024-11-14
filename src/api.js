import fetch from 'node-fetch';
import { CONFIG } from './config.js';

export class ApiHandler {
  static async fetchPurchaseOrderDetails(poNo) {
    const url = `${CONFIG.API_URL}?purchaseOrderNumber=${poNo}`;
    const headers = {
      'cubeship-api-key': CONFIG.API_KEY,
      'Cookie': CONFIG.API_COOKIE
    };
    
    debug.log('Fetch Parameters:', {
      url,
      headers,
      poNo
    });
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        debug.log(`Skipping PO ${poNo}: Not found (404)`);
        return null;  // Return null for 404s instead of throwing
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
} 