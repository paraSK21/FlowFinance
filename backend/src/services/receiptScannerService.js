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

    // Extract merchant (usually first few lines)
    const merchant = lines.slice(0, 3).join(' ').substring(0, 100);

    // Extract total amount
    const totalRegex = /total[:\s]*\$?(\d+\.?\d*)/i;
    const totalMatch = text.match(totalRegex);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;

    // Extract date
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    const date = dateMatch ? new Date(dateMatch[1]) : new Date();

    // Extract items
    const items = [];
    const itemRegex = /(.+?)\s+\$?(\d+\.?\d*)/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      if (match[2] && parseFloat(match[2]) > 0) {
        items.push({
          description: match[1].trim(),
          amount: parseFloat(match[2])
        });
      }
    }

    return {
      merchant,
      total,
      date,
      items,
      description: `Receipt from ${merchant}`
    };
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
