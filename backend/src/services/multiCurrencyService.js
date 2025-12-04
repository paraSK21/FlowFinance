/**
 * Multi-Currency Service
 * Handle currency conversion and multi-currency support
 */

const axios = require('axios');

class MultiCurrencyService {
  constructor() {
    this.baseCurrency = 'USD';
    this.exchangeRates = {};
    this.lastUpdate = null;
  }

  /**
   * Fetch latest exchange rates
   */
  async fetchExchangeRates() {
    try {
      // Using exchangerate-api.com (free tier)
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${this.baseCurrency}`
      );

      this.exchangeRates = response.data.rates;
      this.lastUpdate = new Date();

      console.log('Exchange rates updated successfully');
      return this.exchangeRates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  }

  /**
   * Convert amount between currencies
   */
  async convert(amount, fromCurrency, toCurrency) {
    try {
      // Update rates if older than 1 hour
      if (!this.lastUpdate || Date.now() - this.lastUpdate > 3600000) {
        await this.fetchExchangeRates();
      }

      if (fromCurrency === toCurrency) {
        return amount;
      }

      // Convert to base currency first, then to target
      const amountInBase = amount / this.exchangeRates[fromCurrency];
      const convertedAmount = amountInBase * this.exchangeRates[toCurrency];

      return parseFloat(convertedAmount.toFixed(2));
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  async getRate(fromCurrency, toCurrency) {
    try {
      if (!this.lastUpdate || Date.now() - this.lastUpdate > 3600000) {
        await this.fetchExchangeRates();
      }

      const rate = this.exchangeRates[toCurrency] / this.exchangeRates[fromCurrency];
      return parseFloat(rate.toFixed(6));
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      throw error;
    }
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies() {
    return Object.keys(this.exchangeRates);
  }
}

module.exports = new MultiCurrencyService();
