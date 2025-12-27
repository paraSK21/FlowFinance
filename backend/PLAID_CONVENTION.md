# Plaid Transaction Amount Convention - Quick Reference

## The Rule (MEMORIZE THIS!)

When using Plaid's `/transactions/get` endpoint:

```
Positive Amount (+) = EXPENSE (money OUT / debit)
Negative Amount (-) = INCOME (money IN / credit)
```

## Examples

| Amount | Type | Description | Real World |
|--------|------|-------------|------------|
| `+50.00` | expense | Money leaving account | Bought coffee |
| `+1200.00` | expense | Money leaving account | Paid rent |
| `-2500.00` | income | Money entering account | Salary deposit |
| `-45.00` | income | Money entering account | Refund received |

## Code Patterns

### ✅ CORRECT - Setting Type from Plaid Data
```javascript
// When receiving data from Plaid
const type = txn.amount > 0 ? 'expense' : 'income';
```

### ✅ CORRECT - Filtering by Type
```javascript
// Use the type field, not amount sign
const income = transactions.filter(t => t.type === 'income');
const expenses = transactions.filter(t => t.type === 'expense');
```

### ✅ CORRECT - Calculating Totals
```javascript
// Always use Math.abs() for calculations
const totalIncome = transactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

const totalExpenses = transactions
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
```

### ❌ WRONG - Don't Do This
```javascript
// DON'T infer type from amount in business logic
if (txn.amount < 0) {  // ❌ WRONG
  // treat as income
}

// DON'T forget Math.abs() when calculating
const total = transactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + t.amount, 0);  // ❌ Will be negative!
```

## Database Schema

```javascript
Transaction {
  amount: DECIMAL(15, 2),  // Raw Plaid amount (+ or -)
  type: ENUM('income', 'expense'),  // Categorized type
  // ... other fields
}
```

## Why This Matters

If you get this wrong:
- ❌ Reports show incorrect revenue/expenses
- ❌ Forecasts predict wrong cash flow
- ❌ Financing eligibility calculated incorrectly
- ❌ Users see negative income amounts
- ❌ Tax calculations are wrong

## Testing Your Code

Always test with both positive and negative amounts:

```javascript
const testTransactions = [
  { amount: 100.00, type: 'expense' },   // Positive = expense
  { amount: -500.00, type: 'income' },   // Negative = income
];
```

## Quick Checklist

Before committing transaction-related code:

- [ ] Do I use `txn.type` for filtering?
- [ ] Do I use `Math.abs(txn.amount)` for calculations?
- [ ] Did I test with both positive and negative amounts?
- [ ] Does my code work correctly for income AND expenses?

## Need Help?

See `TRANSACTION_FIXES.md` for detailed examples of correct implementations.
