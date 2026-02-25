const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    body = req.body;
  }

  const { website, email, plan, business = 'auditiqs' } = body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const price = plan === 'subscription' ? 2900 : 9900;
    const mode = plan === 'subscription' ? 'subscription' : 'payment';
    const productName = plan === 'subscription' ? 'SEO Audit Subscription' : 'SEO Audit Report';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: website || 'Website audit',
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode,
      success_url: `https://auditiqs.com/success.html`,
      cancel_url: `https://auditiqs.com/?canceled=true`,
      metadata: {
        website: website || '',
        email,
        business,
        plan: plan || 'audit',
        source: 'auto_biz'
      },
      customer_email: email,
    });

    console.log(`📝 Checkout created: ${session.id}, business: ${business}`);

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
