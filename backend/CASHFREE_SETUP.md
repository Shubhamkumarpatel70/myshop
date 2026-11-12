# Cashfree registration payment setup

The registration fee is created and verified only on the backend. Never expose Cashfree secrets in frontend environment variables or commit them to Git.

## Render backend environment variables

Set these in the backend service:

- `CASHFREE_CLIENT_ID`: Cashfree PG App ID / Client ID
- `CASHFREE_CLIENT_SECRET`: Cashfree PG secret key
- `CASHFREE_ENV`: `sandbox` while testing, then `production` after live activation
- `CASHFREE_API_VERSION`: optional; defaults to `2023-08-01`
- `FRONTEND_URL`: deployed StockSaathi frontend origin, without trailing slash
- `BACKEND_URL`: deployed backend public origin, without trailing slash (required for Cashfree webhooks)

## Cashfree dashboard

Configure the webhook URL as:

`https://YOUR-BACKEND-DOMAIN/api/payments/cashfree/webhook`

Subscribe to payment success events. The webhook is signature-verified and then the server fetches the order's payments directly from Cashfree before unlocking registration.

## Test before switching live

1. Use sandbox credentials and `CASHFREE_ENV=sandbox`.
2. Set the Global Settings registration fee and enable `isPaymentRequired`.
3. Register a new shop owner and complete a Cashfree sandbox payment.
4. Confirm the shop owner's `isPaymentDone` changes only after Cashfree confirms a successful payment.
5. Test failed, abandoned, pending, duplicate webhook and return-to-site flows.
6. Replace sandbox keys with live credentials and set `CASHFREE_ENV=production` only after Cashfree live activation.

Do not use the admin "confirm payment" endpoint to mark paid when registration payment is enabled; it now refuses that operation.
