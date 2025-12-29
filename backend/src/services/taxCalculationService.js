// Tax Calculation Service for US/Canada - Production Ready
// Includes validation and proper error handling

const TAX_RATES = {
  US: {
    // State sales tax rates (simplified - actual rates vary by locality)
    AL: 0.04, AK: 0, AZ: 0.056, AR: 0.065, CA: 0.0725,
    CO: 0.029, CT: 0.0635, DE: 0, FL: 0.06, GA: 0.04,
    HI: 0.04, ID: 0.06, IL: 0.0625, IN: 0.07, IA: 0.06,
    KS: 0.065, KY: 0.06, LA: 0.0445, ME: 0.055, MD: 0.06,
    MA: 0.0625, MI: 0.06, MN: 0.06875, MS: 0.07, MO: 0.04225,
    MT: 0, NE: 0.055, NV: 0.0685, NH: 0, NJ: 0.06625,
    NM: 0.05125, NY: 0.04, NC: 0.0475, ND: 0.05, OH: 0.0575,
    OK: 0.045, OR: 0, PA: 0.06, RI: 0.07, SC: 0.06,
    SD: 0.045, TN: 0.07, TX: 0.0625, UT: 0.0485, VT: 0.06,
    VA: 0.053, WA: 0.065, WV: 0.06, WI: 0.05, WY: 0.04, DC: 0.06
  },
  CA: {
    // Canadian provincial tax rates
    AB: { gst: 0.05, pst: 0, hst: 0, type: 'gst' },
    BC: { gst: 0.05, pst: 0.07, hst: 0, type: 'gst_pst' },
    MB: { gst: 0.05, pst: 0.07, hst: 0, type: 'gst_pst' },
    NB: { gst: 0, pst: 0, hst: 0.15, type: 'hst' },
    NL: { gst: 0, pst: 0, hst: 0.15, type: 'hst' },
    NT: { gst: 0.05, pst: 0, hst: 0, type: 'gst' },
    NS: { gst: 0, pst: 0, hst: 0.15, type: 'hst' },
    NU: { gst: 0.05, pst: 0, hst: 0, type: 'gst' },
    ON: { gst: 0, pst: 0, hst: 0.13, type: 'hst' },
    PE: { gst: 0, pst: 0, hst: 0.15, type: 'hst' },
    QC: { gst: 0.05, pst: 0.09975, hst: 0, type: 'gst_qst' },
    SK: { gst: 0.05, pst: 0.06, hst: 0, type: 'gst_pst' },
    YT: { gst: 0.05, pst: 0, hst: 0, type: 'gst' }
  }
};

// Valid state/province codes for validation
const VALID_US_STATES = Object.keys(TAX_RATES.US);
const VALID_CA_PROVINCES = Object.keys(TAX_RATES.CA);

class TaxCalculationService {
  /**
   * Safe float conversion with null/undefined handling
   */
  safeFloat(value, defaultValue = 0) {
    if (value === null || value === undefined || isNaN(value)) {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Validate country code
   */
  isValidCountry(country) {
    return country === 'US' || country === 'CA';
  }

  /**
   * Validate state/province code
   */
  isValidStateProvince(country, stateOrProvince) {
    if (!stateOrProvince) return false;
    
    const code = stateOrProvince.toUpperCase();
    
    if (country === 'US') {
      return VALID_US_STATES.includes(code);
    } else if (country === 'CA') {
      return VALID_CA_PROVINCES.includes(code);
    }
    
    return false;
  }

  /**
   * Calculate invoice tax with validation
   */
  calculateInvoiceTax(subtotal, country, stateOrProvince) {
    // Validate inputs
    const safeSubtotal = this.safeFloat(subtotal);
    
    if (safeSubtotal < 0) {
      return { 
        error: 'Subtotal cannot be negative',
        taxAmount: 0, 
        taxRate: 0, 
        taxType: 'error', 
        breakdown: {} 
      };
    }

    if (!this.isValidCountry(country)) {
      return { 
        error: `Invalid country code: ${country}. Must be 'US' or 'CA'`,
        taxAmount: 0, 
        taxRate: 0, 
        taxType: 'error', 
        breakdown: {} 
      };
    }

    if (!this.isValidStateProvince(country, stateOrProvince)) {
      return { 
        error: `Invalid state/province code: ${stateOrProvince} for country ${country}`,
        taxAmount: 0, 
        taxRate: 0, 
        taxType: 'error', 
        breakdown: {},
        validCodes: country === 'US' ? VALID_US_STATES : VALID_CA_PROVINCES
      };
    }

    if (country === 'US') {
      return this.calculateUSTax(safeSubtotal, stateOrProvince.toUpperCase());
    } else if (country === 'CA') {
      return this.calculateCanadaTax(safeSubtotal, stateOrProvince.toUpperCase());
    }
    
    return { taxAmount: 0, taxRate: 0, taxType: 'none', breakdown: {} };
  }

  /**
   * Calculate US sales tax
   */
  calculateUSTax(subtotal, state) {
    const rate = TAX_RATES.US[state] || 0;
    const taxAmount = subtotal * rate;
    
    return {
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      taxRate: rate,
      taxType: 'sales_tax',
      breakdown: {
        state_tax: parseFloat(taxAmount.toFixed(2))
      },
      jurisdiction: state,
      country: 'US'
    };
  }

  /**
   * Calculate Canada GST/HST/PST
   */
  calculateCanadaTax(subtotal, province) {
    const rates = TAX_RATES.CA[province];
    if (!rates) {
      return { 
        error: `No tax rates found for province: ${province}`,
        taxAmount: 0, 
        taxRate: 0, 
        taxType: 'error', 
        breakdown: {} 
      };
    }

    let breakdown = {};
    let totalTax = 0;
    let taxType = rates.type;

    if (rates.hst > 0) {
      // HST provinces (harmonized sales tax)
      totalTax = subtotal * rates.hst;
      breakdown.hst = parseFloat(totalTax.toFixed(2));
      taxType = 'hst';
    } else {
      // GST + PST/QST provinces
      const gstAmount = subtotal * rates.gst;
      breakdown.gst = parseFloat(gstAmount.toFixed(2));
      totalTax += gstAmount;

      if (rates.pst > 0) {
        const pstAmount = subtotal * rates.pst;
        breakdown.pst = parseFloat(pstAmount.toFixed(2));
        totalTax += pstAmount;
        taxType = province === 'QC' ? 'gst_qst' : 'gst_pst';
      }
    }

    return {
      taxAmount: parseFloat(totalTax.toFixed(2)),
      taxRate: parseFloat((totalTax / subtotal).toFixed(4)),
      taxType,
      breakdown,
      jurisdiction: province,
      country: 'CA'
    };
  }

  /**
   * Get tax rate for display with validation
   */
  getTaxRate(country, stateOrProvince) {
    if (!this.isValidCountry(country)) {
      return { error: `Invalid country: ${country}`, rate: 0 };
    }

    if (!this.isValidStateProvince(country, stateOrProvince)) {
      return { 
        error: `Invalid state/province: ${stateOrProvince}`, 
        rate: 0,
        validCodes: country === 'US' ? VALID_US_STATES : VALID_CA_PROVINCES
      };
    }

    const code = stateOrProvince.toUpperCase();

    if (country === 'US') {
      return { rate: TAX_RATES.US[code] || 0, jurisdiction: code };
    } else if (country === 'CA') {
      const rates = TAX_RATES.CA[code];
      if (!rates) return { error: 'No rates found', rate: 0 };
      const totalRate = rates.hst || (rates.gst + rates.pst);
      return { rate: totalRate, jurisdiction: code, breakdown: rates };
    }
    
    return { rate: 0 };
  }

  /**
   * Calculate total from line items with validation
   */
  calculateInvoiceTotal(lineItems, country, stateOrProvince) {
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return {
        error: 'Line items must be a non-empty array',
        subtotal: 0,
        taxAmount: 0,
        total: 0
      };
    }

    const subtotal = lineItems.reduce((sum, item) => {
      const quantity = this.safeFloat(item.quantity, 0);
      const rate = this.safeFloat(item.rate, 0);
      return sum + (quantity * rate);
    }, 0);

    const taxCalc = this.calculateInvoiceTax(subtotal, country, stateOrProvince);
    
    if (taxCalc.error) {
      return {
        error: taxCalc.error,
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: 0,
        total: parseFloat(subtotal.toFixed(2)),
        validCodes: taxCalc.validCodes
      };
    }
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      ...taxCalc,
      total: parseFloat((subtotal + taxCalc.taxAmount).toFixed(2))
    };
  }

  /**
   * Get all valid state/province codes for a country
   */
  getValidJurisdictions(country) {
    if (country === 'US') {
      return {
        country: 'US',
        jurisdictions: VALID_US_STATES.map(code => ({
          code,
          rate: TAX_RATES.US[code],
          type: 'sales_tax'
        }))
      };
    } else if (country === 'CA') {
      return {
        country: 'CA',
        jurisdictions: VALID_CA_PROVINCES.map(code => {
          const rates = TAX_RATES.CA[code];
          return {
            code,
            rates,
            totalRate: rates.hst || (rates.gst + rates.pst),
            type: rates.type
          };
        })
      };
    }
    
    return { error: 'Invalid country', jurisdictions: [] };
  }
}

module.exports = new TaxCalculationService();
