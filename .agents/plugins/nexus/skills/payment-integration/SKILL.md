---
name: payment-integration
description: >-
  Use this skill when the user asks to implement, audit, or extend payment
  handling in the fast-food management system. Covers cash-on-delivery (COD)
  flow, the cash ledger, rider settlement, and future payment gateway
  integration.
---

# Payment Integration Skill

This skill guides you through implementing and managing payments in the fast-food management system.

## Current Payment Model: Cash on Delivery (COD)

Version 1 supports COD only. Online payment gateway integration is deferred.

### COD Flow

```
Customer places order (payment: { method: 'cod' })
  → Rider collects cash at delivery
  → Rider enters OTP to complete delivery
  → Cash amount recorded in cashLedger collection
  → Owner settles cash with rider at end of day
```

### Cash Ledger Collection Schema

```ts
{
  riderId: ObjectId,
  orderId: ObjectId,
  amountCollected: number,   // integer paisa — never decimals
  settledFlag: boolean,
  settledBy: ObjectId,       // admin/staff who settled
  settledAt: Date,
}
```

## Steps

### 1. Implement COD Settlement (Rider Side)

- After the rider delivers (OTP verified), the API records the cash collected in `cashLedger`.
- The rider dashboard shows "COD to deposit" — sum of `unsettledCOD` entries (see R9: use `formatMoney` from `packages/utils`).

### 2. Implement Admin Settlement

- Admin panel `riders/` feature shows each rider's unsettled COD.
- Admin clicks "Settle" → API marks all unsettled entries for that rider as `settledFlag: true`, recording `settledBy` and `settledAt`.

### 3. Money Rules

- All amounts stored as **integer paisa** — multiply rupees by 100 before saving.
- Never use `toFixed(2)` for storage (see R9). Use `formatMoney` from `packages/utils/money.ts` for display only.
- Server recalculates the order total from the menu database — never trust the client price (C8).

### 4. Future: Payment Gateway

When adding an online payment gateway (e.g., Stripe, Razorpay, JazzCash):
- Add a `payments` collection and a `payments` module in the API.
- Use webhooks to confirm payment — never trust a client-side success callback.
- Store payment gateway's transaction ID alongside the order.
- Handle refunds through the gateway API, not manually.

### 5. Verify

- Place a COD order end-to-end and confirm the `cashLedger` record is created on delivery.
- Confirm the rider dashboard shows the correct unsettled amount.
- Confirm admin settlement marks entries correctly.

## Tips

- Use MongoDB transactions when writing both the order status change and the cash ledger entry together.
- Add an index on `cashLedger(riderId, settledFlag)` for fast unsettled balance queries.
