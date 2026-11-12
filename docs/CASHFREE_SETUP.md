# Cashfree Payment Gateway Setup

StockSaathi uses Cashfree Hosted Checkout for:
- One-time shop registration fees (when System Settings → Registration Payment is set to Cashfree Automatic).
- Shop-owner plan purchases from Dashboard → Pricing.

## Render environment variables

Add these to the Render service that runs both the Express API and Vite frontend:

| Variable | Sandbox value / purpose |
|---|---|
| `CASHFREE_CLIENT_ID` | App ID from Cashfree Sandbox |
| `CASHFREE_CLIENT_SECRET` | Secret Key from Cashfree Sandbox |
| `CASHFREE_ENV` | `sandbox` |
| `CASHFREE_API_VERSION` | `2023-08-01` |
| `FRONTEND_URL` | `https://myshop-53hn.onrender.com` |
| `BACKEND_URL` | `https://myshop-53hn.onrender.com` |

Never add the Cashfree Secret Key to frontend variables, source code, or GitHub. The backend keeps it private.

For live payments, replace the Sandbox App ID and Secret Key with Production credentials and set `CASHFREE_ENV=production`. Do this only after a successful end-to-end Sandbox test and Cashfree production activation.

## Cashfree webhook

Configure this webhook URL in the Cashfree merchant dashboard:

`https://myshop-53hn.onrender.com/api/payments/cashfree/webhook`

Subscribe to payment success, failure, and user-dropped events. The backend verifies the Cashfree HMAC signature using the raw request body. A successful browser redirect is not treated as proof of payment: the server fetches the order's payments from Cashfree and checks the successful payment amount and INR currency before marking registration paid or activating a plan.

## Test checklist

1. Set the Render variables above with Sandbox credentials and redeploy.
2. In StockSaathi Admin → System Settings, enable registration payment, enter a positive fee, and select Cashfree Automatic.
3. Open a fresh shop-owner registration, finish the account form, and reach the registration payment screen.
4. Start Cashfree checkout and complete a Sandbox payment using Cashfree's current Sandbox test payment details.
5. Confirm the return page verifies the order and the account's registration payment becomes complete. Shop approval must remain a separate admin action.
6. From Dashboard → Pricing, select a paid plan and complete another Sandbox checkout. Confirm the plan changes only after server-side verification.
7. Check webhook delivery and ensure repeated webhook events do not duplicate payment activation.
8. Test a failed or abandoned payment. It must not unlock registration or activate a subscription.

## Troubleshooting

- Admin → System Settings shows whether the backend can see both Cashfree credential variables. It does not reveal either key and does not itself prove a live API transaction.
- If checkout cannot load, allow `https://sdk.cashfree.com` in the browser/network and retry.
- If order creation fails, check Render logs for the backend Cashfree error and confirm Sandbox keys are paired with `CASHFREE_ENV=sandbox`.
- If checkout returns but remains pending, check the order in Cashfree Sandbox and inspect webhook delivery. Use the in-app Check payment status action to retry server-side verification.
