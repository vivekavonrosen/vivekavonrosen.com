import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Stripe needs the RAW request body to verify the signature, so turn off Vercel's body parser.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  // 1. Verify the event really came from Stripe (rejects anyone spamming the endpoint).
  let event;
  try {
    const rawBody = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  // 2. Only fire on a completed checkout — the moment someone actually buys.
  //    (Silent yearly auto-renewals come through as invoice.paid, which we deliberately ignore.)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const name = session.customer_details?.name || 'Name not collected';
    const payerEmail = session.customer_details?.email || 'unknown';

    // The custom field where the buyer types the email they'll use to join WTIC on Skool.
    const skoolField = (session.custom_fields || []).find((f) => f.text);
    const skoolEmail = skoolField?.text?.value || payerEmail;

    const amount = session.amount_total != null ? (session.amount_total / 100).toFixed(2) : '697.00';
    const currency = (session.currency || 'usd').toUpperCase();

    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL,   // e.g. 'WTIC <notify@yourdomain.com>'
        to: process.env.NOTIFY_EMAIL,   // your inbox
        subject: `New WTIC annual — invite ${name}`,
        html: `
          <div style="font-family:Lato,Arial,sans-serif;color:#1A1320;line-height:1.6;font-size:16px;max-width:520px">
            <h2 style="color:#571F81;margin:0 0 12px">New annual member 🎉</h2>
            <p style="margin:0 0 16px">Someone just bought the $${amount} ${currency} WTIC Pro annual. Invite them into Skool and they'll land straight in the paid tier.</p>
            <table style="border-collapse:collapse;margin:0 0 20px;font-size:16px">
              <tr><td style="padding:5px 16px 5px 0;color:#4A4356">Name</td><td><strong>${name}</strong></td></tr>
              <tr><td style="padding:5px 16px 5px 0;color:#4A4356">Email to invite</td><td><strong style="color:#571F81">${skoolEmail}</strong></td></tr>
              <tr><td style="padding:5px 16px 5px 0;color:#4A4356">Payment email</td><td>${payerEmail}</td></tr>
              <tr><td style="padding:5px 16px 5px 0;color:#4A4356">Amount</td><td>$${amount} ${currency}</td></tr>
            </table>
            <a href="https://www.skool.com/womens-tech-collaborative-2106/-/members"
               style="background:#571F81;color:#fff;text-decoration:none;font-family:'Bebas Neue',Arial,sans-serif;letter-spacing:.06em;padding:12px 24px;border-radius:3px;display:inline-block">
               Open Skool members &rarr; invite them
            </a>
            <p style="margin:18px 0 0;color:#4A4356;font-size:14px">Members tab &rarr; invite by email &rarr; paste the address above. They click JOIN NOW and they're in.</p>
          </div>`,
      });
    } catch (err) {
      // Log it but still return 200 so Stripe doesn't retry endlessly.
      // Your Stripe dashboard email (see README, step 7) is the backstop if this ever fails.
      console.error('Resend send failed:', err);
    }
  }

  return res.status(200).json({ received: true });
}
