import nodemailer from 'nodemailer';

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

    let emailSent = false;
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER || 'albertlivingstan73@gmail.com';
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    // 1. Primary: Send email directly via Nodemailer
    if (emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });

        await transporter.sendMail({
          from: `"Portfolio Contact" <${emailUser}>`,
          to: 'albertlivingstan73@gmail.com',
          replyTo: email,
          subject: `Portfolio Inquiry from ${name}`,
          text: `You received a new inquiry from your portfolio (albert3.vercel.app):\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}\n\nSent: ${new Date().toISOString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
              <h2 style="color: #1a73e8; margin-top: 0;">🚀 New Message from Portfolio</h2>
              <p style="font-size: 15px; color: #333;">You received a new contact inquiry via <strong>albert3.vercel.app</strong>.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px; color: #555;">Name</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #eee; color: #111;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #1a73e8; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-weight: bold; vertical-align: top; color: #555;">Message</td>
                  <td style="padding: 12px 16px; color: #111; white-space: pre-wrap; line-height: 1.5;">${message}</td>
                </tr>
              </table>

              <p style="margin-top: 24px; font-size: 12px; color: #888; text-align: center;">
                Sent automatically from <a href="https://albert3.vercel.app" style="color: #888;">albert3.vercel.app</a>
              </p>
            </div>
          `
        });

        emailSent = true;
      } catch (nmErr) {
        console.warn('Nodemailer failed:', nmErr.message);
      }
    }

    // 2. Trigger UiPath Webhook if configured (as background trigger)
    const webhookUrl = process.env.UIPATH_WEBHOOK_URL;
    const webhookSecret = process.env.UIPATH_WEBHOOK_SECRET || 'AlbertPortfolio2026SecureKey';

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-uipath-secret': webhookSecret
          },
          body: JSON.stringify({
            name,
            email,
            message,
            content: { name, email, message },
            body: { name, email, message },
            source: 'albert3.vercel.app',
            timestamp: new Date().toISOString()
          })
        });
      } catch (uiErr) {
        console.warn('UiPath dispatch error:', uiErr.message);
      }
    }

    // 3. Fallback: FormSubmit email backup if nodemailer is not yet configured with an app password
    if (!emailSent) {
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
    }

    return res.status(200).json({
      success: true,
      emailSent,
      message: 'Your message has been sent successfully!'
    });
  } catch (error) {
    console.error('Contact handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
