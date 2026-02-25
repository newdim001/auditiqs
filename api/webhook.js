const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const website = session.metadata?.website;

    if (customerEmail && website) {
      // Send confirmation email with Resend
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@auditiqs.com',
        to: customerEmail,
        subject: 'Order Confirmed - Your SEO Audit',
        html: `
          <h1>Thank You for Your Order!</h1>
          <p>We're analyzing <strong>${website}</strong>.</p>
          <p>Your SEO audit report will be delivered within 24 hours.</p>
          <p>Best regards,<br>The AuditIQs Team</p>
        `,
      });
    }
  }

  res.json({ received: true });
}
