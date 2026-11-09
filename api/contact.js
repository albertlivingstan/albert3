import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// 12-hour block window (in milliseconds)
const BLOCK_DURATION_MS = 12 * 60 * 60 * 1000; 
const MAX_MESSAGES = 5;
const TRACKER_FILE = '/tmp/portfolio-spam-tracker.json';

// In-memory cache fallback
const memoryTracker = global._portfolioSpamTracker = global._portfolioSpamTracker || new Map();

function loadSpamRecords() {
  try {
    if (fs.existsSync(TRACKER_FILE)) {
      const data = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) {
        memoryTracker.set(k, v);
      }
    }
  } catch (e) {
    // ignore read error
  }
}

function saveSpamRecords() {
  try {
    const obj = {};
    for (const [k, v] of memoryTracker.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(obj), 'utf8');
  } catch (e) {
    // ignore write error
  }
}

// Initialize from /tmp if available
loadSpamRecords();

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
    let { name, email, message } = req.body || {};

    name = typeof name === 'string' ? name.trim() : '';
    email = typeof email === 'string' ? email.trim().toLowerCase() : '';
    message = typeof message === 'string' ? message.trim() : '';

    // ==========================================
    // 1. INPUT VALIDATION
    // ==========================================
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Please enter your name (at least 2 characters).' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Name is too long (maximum 100 characters).' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!message || message.length < 10) {
      return res.status(400).json({ error: 'Please enter a message with at least 10 characters.' });
    }
    if (message.length > 3000) {
      return res.status(400).json({ error: 'Message is too long (maximum 3000 characters).' });
    }

    // ==========================================
    // 2. ANTI-SPAM & 12-HOUR BLOCKING
    // ==========================================
    loadSpamRecords();
    const now = Date.now();
    let record = memoryTracker.get(email);

    if (record) {
      // Check if user is currently blocked
      if (record.blockedUntil && now < record.blockedUntil) {
        const remainingMs = record.blockedUntil - now;
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const timeRemaining = remainingHours > 0 
          ? `${remainingHours}h ${remainingMinutes}m` 
          : `${remainingMinutes} minute(s)`;

        return res.status(429).json({
          error: `Please don't spam! You have sent too many messages with this email. This email is blocked for 12 hours. Please try again in ${timeRemaining}.`
        });
      }

      // If the block has expired, or the window has passed, reset
      if (record.blockedUntil && now >= record.blockedUntil) {
        record = { count: 0, firstSent: now, blockedUntil: null };
      } else if (now - record.firstSent > BLOCK_DURATION_MS) {
        record = { count: 0, firstSent: now, blockedUntil: null };
      }

      // Increment count
      record.count += 1;

      // If sent more than 5 times, block for 12 hours
      if (record.count > MAX_MESSAGES) {
        record.blockedUntil = now + BLOCK_DURATION_MS;
        memoryTracker.set(email, record);
        saveSpamRecords();

        return res.status(429).json({
          error: "Please don't spam! You have sent more than 5 messages. This email has been blocked for 12 hours."
        });
      }
    } else {
      record = { count: 1, firstSent: now, blockedUntil: null };
    }

    // Save updated record
    memoryTracker.set(email, record);
    saveSpamRecords();

    // ==========================================
    // 3. SEND EMAIL (NODEMAILER)
    // ==========================================
    let emailSent = false;
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER || 'albertlivingstan73@gmail.com';
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

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
          subject: `💼 Portfolio Inquiry from ${name}`,
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
        console.warn('Nodemailer error:', nmErr.message);
      }
    }

    // Backup UiPath Webhook trigger
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
            source: 'albert3.vercel.app',
            timestamp: new Date().toISOString()
          })
        });
      } catch (uiErr) {
        console.warn('UiPath dispatch error:', uiErr.message);
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
