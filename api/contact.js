export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-uipath-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const webhookUrl = process.env.UIPATH_WEBHOOK_URL || 'https://cloud.uipath.com/studedhebskx/b38edefe-d261-4b6f-aacd-6825cc0a3788/elements_/v1/webhooks/events/aCwhc--U8PlVk_K40ijLAEs4wEgUlCgqmb_TsUHOP9wWGJ-1a_9fVyWIB0pNnB84_q9YDy-dLIYq4ZtWqgFunQ';
    const webhookSecret = process.env.UIPATH_WEBHOOK_SECRET || 'AlbertPortfolio2026SecureKey';

    let uipathTriggered = false;

    // Trigger UiPath Webhook if configured
    if (webhookUrl) {
      try {
        const uipathRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-uipath-secret': webhookSecret
          },
          body: JSON.stringify({
            name,
            email,
            message,
            input: { name, email, message },
            inputs: { name, email, message },
            data: { name, email, message },
            workflow: { input: { name, email, message } },
            timestamp: new Date().toISOString(),
            source: 'albert3.vercel.app'
          })
        });

        if (uipathRes.ok) {
          uipathTriggered = true;
        } else {
          console.warn('UiPath response not ok:', uipathRes.status);
        }
      } catch (uiErr) {
        console.warn('Failed to dispatch to UiPath webhook:', uiErr.message);
      }
    }

    // Always send FormSubmit email backup so no inquiry is ever lost
    try {
      await fetch('https://formsubmit.co/ajax/albertlivingstan73@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: `Portfolio inquiry from ${name}`,
          _template: 'table'
        })
      });
    } catch (fsErr) {
      console.warn('FormSubmit backup failed:', fsErr.message);
    }

    return res.status(200).json({
      success: true,
      uipathTriggered,
      message: 'Your message has been sent successfully!'
    });
  } catch (error) {
    console.error('Contact handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

