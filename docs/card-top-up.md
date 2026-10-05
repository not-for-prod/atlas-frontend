# Card top-up

Approved backend model: ../atlas/docs/event-storming/card-top-up.md.
The card page submits exact net-credit USD decimal amounts and a backend-confirmed client commission with one retained request key. No automatic mutation retries. The backend reserves synchronously, funds the provider wallet then tops up the card.

The owner approved silent customer top-ups on 2026-10-05: after backend acceptance the form closes, and no progress bar, stage list or automatically reopened progress dialog is shown. Owner-scoped current/by-ID reads and the topup URL parameter resume background polling after reload. While the order is pending, another top-up is disabled. Unknown outcomes and failures retain explicit errors and retry actions; they never imply success. Confirmed terminal outcomes refresh the server-owned card balance, wallet and payment history. No credited amount is inferred from the receipt. Payment details show the receipt without a top-up progress tab. Only active USD cards are enabled; no inferred FX.
