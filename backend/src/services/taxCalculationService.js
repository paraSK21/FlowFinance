// Tax Calculation Service for US/Canada
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

class TaxCalculationService {
  // Calculate invoice tax
  calculateInvoiceTax(subtotal, country, stateOrProvince) {
    if (country === 'US') {
      return this.calculateUSTax(subtotal, stateOrProvince);
    } else if (country === 'CA') {
      return this.calculateCanadaTax(subtotal, stateOrProvince);
    }
    return { taxAmount: 0, taxRate: 0, taxType: 'none', breakdown: {} };
  }

  calculateUSTax(subtotal, state) {
    const rate = TAX_RATES.US[state] || 0;
    const taxAmount = subtotal * rate;
    
    return {
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      taxRate: rate,
      taxType: 'sales_tax',
      breakdown: {
        state_tax: taxAmount
      },
      jurisdiction: state
    };
  }

  calculateCanadaTax(subtotal, province) {
    const rates = TAX_RATES.CA[province];
    if (!rates) {
      return { taxAmount: 0, taxRate: 0, taxType: 'none', breakdown: {} };
    }

    let breakdown = {};
    let totalTax = 0;
    let taxType = rates.type;

    if (rates.hst > 0) {
      // HST provinces
      totalTax = subtotal * rates.hst;
      breakdown.hst = totalTax;
      taxType = 'hst';
    } else {
      // GST + PST/QST provinces
      const gstAmount = subtotal * rates.gst;
      breakdown.gst = gstAmount;
      totalTax += gstAmount;

      if (rates.pst > 0) {
        const pstAmount = subtotal * rates.pst;
        breakdown.pst = pstAmount;
        totalTax += pstAmount;
        taxType = province === 'QC' ? 'gst_qst' : 'gst_pst';
      }
    }

    return {
      taxAmount: parseFloat(totalTax.toFixed(2)),
      taxRate: parseFloat((totalTax / subtotal).toFixed(4)),
      taxType,
      breakdown,
      jurisdiction: province
    };
  }

  // Get tax rate for display
  getTaxRate(country, stateOrProvince) {
    if (country === 'US') {
      return TAX_RATES.US[stateOrProvince] || 0;
    } else if (country === 'CA') {
      const rates = TAX_RATES.CA[stateOrProvince];
      if (!rates) return 0;
      return rates.hst || (rates.gst + rates.pst);
    }
    return 0;
  }

  // Calculate total from line items
  calculateInvoiceTotal(lineItems, country, stateOrProvince) {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);

    const taxCalc = this.calculateInvoiceTax(subtotal, country, stateOrProvince);
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      ...taxCalc,
      total: parseFloat((subtotal + taxCalc.taxAmount).toFixed(2))
    };
  }
}

module.exports = new TaxCalculationService();
