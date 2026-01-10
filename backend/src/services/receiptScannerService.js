const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const aiService = require('./aiCategorizationService');

class ReceiptScannerService {
  async scanReceipt(imageBuffer) {
    try {
      // Preprocess image for better OCR
      const processedImage = await sharp(imageBuffer)
        .greyscale()
        .normalize()
        .sharpen()
        .toBuffer();

      // Perform OCR
      const { data: { text } } = await Tesseract.recognize(
        processedImage,
        'eng',
        {
          logger: m => console.log(m)
        }
      );

      // Extract receipt data
      const receiptData = this.parseReceiptText(text);

      // Categorize using AI
      const categorization = await aiService.categorizeTransaction(
        receiptData.description,
        receiptData.merchant,
        receiptData.total
      );

      return {
        ...receiptData,
        category: categorization.category,
        confidence: categorization.confidence,
        rawText: text
      };
    } catch (error) {
      console.error('Receipt scan error:', error);
      throw new Error('Failed to scan receipt');
    }
  }

  parseReceiptText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const lowerText = text.toLowerCase();

    // Extract merchant (usually first few lines, clean up common OCR artifacts)
    let merchant = lines.slice(0, 3).join(' ')
      .replace(/[^a-zA-Z0-9\s&'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);

    // Extract total amount - try multiple patterns
    let total = 0;
    const totalPatterns = [
      /total[:\s]*\$?\s*(\d+[.,]\d{2})/i,           // "Total: $25.99" or "Total 25.99"
      /amount\s*due[:\s]*\$?\s*(\d+[.,]\d{2})/i,    // "Amount Due: $25.99"
      /balance[:\s]*\$?\s*(\d+[.,]\d{2})/i,         // "Balance: $25.99"
      /grand\s*total[:\s]*\$?\s*(\d+[.,]\d{2})/i,   // "Grand Total: $25.99"
      /\$\s*(\d+[.,]\d{2})\s*total/i,               // "$25.99 Total"
      /total[:\s]*(\d+[.,]\d{2})/i                  // "Total 25.99" (no $)
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        total = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }

    // If no total found, try to find the largest amount (likely the total)
    if (total === 0) {
      const allAmounts = text.match(/\$?\s*(\d+[.,]\d{2})/g);
      if (allAmounts && allAmounts.length > 0) {
        const amounts = allAmounts.map(a => parseFloat(a.replace(/[$,]/g, '').replace(',', '.')));
        total = Math.max(...amounts);
      }
    }

    // Extract date - try multiple formats
    let date = new Date();
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,                    // MM/DD/YYYY or DD-MM-YYYY
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,                      // YYYY-MM-DD
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i,  // "Jan 15, 2024"
      /(\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4})/i   // "15 Jan 2024"
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          date = new Date(match[0]);
          if (!isNaN(date.getTime())) break;
        } catch (e) {
          // Continue to next pattern
        }
      }
    }

    // Extract items with improved parsing
    const items = [];
    const itemPatterns = [
      /^(.+?)\s+\$?\s*(\d+[.,]\d{2})$/gm,           // "Item Name    $12.99"
      /^(.+?)\s+(\d+[.,]\d{2})\s*$/gm,              // "Item Name    12.99"
      /^(\d+)\s+(.+?)\s+\$?\s*(\d+[.,]\d{2})$/gm    // "2 Item Name    $12.99"
    ];

    for (const pattern of itemPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const amount = parseFloat(match[match.length - 1].replace(',', '.'));
        if (amount > 0 && amount < total) {  // Item should be less than total
          const description = match[match.length - 2].trim();
          // Filter out common non-item lines
          if (!description.match(/total|subtotal|tax|discount|change|cash|card/i)) {
            items.push({
              description: description.substring(0, 100),
              amount
            });
          }
        }
      }
      if (items.length > 0) break;  // Stop if we found items
    }

    // Extract tax if present
    let taxAmount = 0;
    const taxPatterns = [
      /tax[:\s]*\$?\s*(\d+[.,]\d{2})/i,
      /gst[:\s]*\$?\s*(\d+[.,]\d{2})/i,
      /hst[:\s]*\$?\s*(\d+[.,]\d{2})/i,
      /sales\s*tax[:\s]*\$?\s*(\d+[.,]\d{2})/i
    ];

    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match) {
        taxAmount = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }

    return {
      merchant: merchant || 'Unknown Merchant',
      total: total || 0,
      date,
      items,
      taxAmount,
      description: `Receipt from ${merchant || 'Unknown Merchant'}`,
      confidence: this.calculateParsingConfidence(merchant, total, date, items)
    };
  }

  /**
   * Calculate confidence score for parsed receipt data
   */
  calculateParsingConfidence(merchant, total, date, items) {
    let confidence = 0.5;  // Base confidence

    if (merchant && merchant !== 'Unknown Merchant' && merchant.length > 3) {
      confidence += 0.2;
    }

    if (total > 0) {
      confidence += 0.2;
    }

    if (date && !isNaN(date.getTime())) {
      confidence += 0.1;
    }

    if (items && items.length > 0) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  async scanMultipleReceipts(imageBuffers) {
    const results = [];
    
    for (const buffer of imageBuffers) {
      try {
        const result = await this.scanReceipt(buffer);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new ReceiptScannerService();
