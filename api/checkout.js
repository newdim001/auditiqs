const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { website, email, plan, business = 'auditiqs' } = req.body;

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
              description: website,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode,
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      metadata: {
        website,
        email,
        business,
        plan,
        source: 'auto_biz'
      },
      customer_email: email,
    });

    // Track for learning system
    console.log(`📝 Checkout created: ${session.id}, business: ${business}`);

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
