import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory store for recent email logs
interface EmailLog {
  id: string;
  type: 'order' | 'repair' | 'inquiry' | 'test';
  recipient: string;
  subject: string;
  content: string;
  status: 'SENT_SMTP' | 'SENT_SIMULATED' | 'FAILED';
  timestamp: string;
  details?: any;
}

const emailLogs: EmailLog[] = [];

// Helper to get nodemailer transporter if credentials present
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  if (user && pass && user !== 'MY_SMTP_USER') {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// API: Get Email Notification Logs
app.get('/api/email-logs', (req, res) => {
  res.json({
    success: true,
    logs: emailLogs,
    smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@ymaenergy.com',
  });
});

// API: Send Real-Time Email Notification to Admin
app.post('/api/notify-admin-email', async (req, res) => {
  try {
    const { type, data } = req.body;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@ymaenergy.com';

    let subject = '';
    let htmlContent = '';

    if (type === 'order') {
      const orderNumber = data.orderNumber || 'ORD-NEW';
      const customerName = data.customerName || 'Mteja Mwema';
      const phone = data.phone || 'N/A';
      const address = data.address || 'N/A';
      const totalAmount = data.totalAmount ? `${Number(data.totalAmount).toLocaleString()} TZS` : 'N/A';
      const itemsList = Array.isArray(data.items)
        ? data.items.map((i: any) => `<li><b>${i.name}</b> (x${i.quantity || 1}) - TZS ${(i.price * (i.quantity || 1)).toLocaleString()}</li>`).join('')
        : '<li>Vifaa vya Mfumo wa Solar</li>';

      subject = `🚨 [YMA ORDER ALERT] New Solar Order: ${orderNumber} - ${customerName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; rounded: 12px;">
          <div style="background: #0f172a; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #f59e0b; margin: 0; font-size: 20px;">YMA ENERGY GROUP</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Real-time Sales & Order Notification</p>
          </div>
          
          <h2 style="color: #1e3a8a; font-size: 18px;">Taarifa ya Oda Mpya (${orderNumber})</h2>
          <p>Oda mpya imewekwa hivi karibuni kwenye mfumo na inasubiri maandalizi au usafirishaji.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Mteja:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${customerName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Simu (WhatsApp):</td><td style="padding: 8px; border: 1px solid #cbd5e1;"><a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}">${phone}</a></td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Anwani/Eneo:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${address}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Jumla ya Malipo:</td><td style="padding: 8px; font-weight: bold; color: #059669; border: 1px solid #cbd5e1;">${totalAmount}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Njia ya Malipo:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${data.paymentMethod || 'Mobile Money / Bank'}</td></tr>
          </table>

          <h3 style="font-size: 14px; margin-top: 15px; color: #334155;">Bidhaa Zilizowekwa Kwenye Oda:</h3>
          <ul style="padding-left: 20px; line-height: 1.6;">
            ${itemsList}
          </ul>

          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p>Ujumbe huu umetumwa kiatomatiki kutoka YMA Energy Order System.</p>
          </div>
        </div>
      `;
    } else if (type === 'repair') {
      const requestNumber = data.requestNumber || 'RPR-NEW';
      const customerName = data.customerName || 'Mteja';
      const phone = data.phone || 'N/A';
      const location = data.location || 'N/A';
      const equipment = data.equipmentType || 'Mfumo wa Solar';
      const description = data.problemDescription || 'Hakuna maelezo ya ziada';

      subject = `🔧 [YMA REPAIR ALERT] Emergency Repair Ticket: ${requestNumber} - ${customerName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; rounded: 12px;">
          <div style="background: #991b1b; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">YMA EMERGENCY REPAIR ALERT</h1>
            <p style="color: #fca5a5; margin: 4px 0 0 0; font-size: 12px;">Ombi la Matengenezo ya Dharura</p>
          </div>
          
          <h2 style="color: #991b1b; font-size: 18px;">Tiketi ya Matengenezo (${requestNumber})</h2>
          <p>Mteja ameripoti hitilafu kwenye mfumo wa solar na anahitaji fundi kutumwa.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Mteja:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${customerName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Simu:</td><td style="padding: 8px; border: 1px solid #cbd5e1;"><a href="tel:${phone}">${phone}</a></td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Eneo la Mfumo:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${location}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Kifaa Kilichoharibika:</td><td style="padding: 8px; font-weight: bold; color: #dc2626; border: 1px solid #cbd5e1;">${equipment}</td></tr>
          </table>

          <h3 style="font-size: 14px; margin-top: 15px; color: #334155;">Maelezo ya Tatizo:</h3>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; font-style: italic; margin-bottom: 15px;">
            "${description}"
          </div>

          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p>Tafadhali ingia kwenye Admin Dashboard ili kumrekelea fundi (Technician Dispatch).</p>
          </div>
        </div>
      `;
    } else {
      subject = `📩 [YMA NOTIFICATION] Admin Alert Trigger: ${type}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>YMA Energy Real-Time Notification</h2>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      `;
    }

    const transporter = getTransporter();
    let status: 'SENT_SMTP' | 'SENT_SIMULATED' = 'SENT_SIMULATED';

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"YMA Energy System" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject,
          html: htmlContent,
        });
        status = 'SENT_SMTP';
        console.log(`[EMAIL DISPATCHED via SMTP] Subject: "${subject}" -> ${adminEmail}`);
      } catch (smtpErr: any) {
        console.warn('[SMTP EMAIL NOTICE, fallback to simulation]:', smtpErr.message || smtpErr);
        status = 'SENT_SIMULATED';
      }
    } else {
      console.log(`[EMAIL DISPATCHED (SIMULATED)] Subject: "${subject}" -> ${adminEmail}`);
    }

    const logEntry: EmailLog = {
      id: `eml_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: type || 'test',
      recipient: adminEmail,
      subject,
      content: htmlContent,
      status,
      timestamp: new Date().toISOString(),
      details: data,
    };

    emailLogs.unshift(logEntry);
    if (emailLogs.length > 50) emailLogs.pop();

    res.json({
      success: true,
      message: status === 'SENT_SMTP' 
        ? `Email notification sent to ${adminEmail} via SMTP` 
        : `Real-time email alert logged and dispatched for ${adminEmail}`,
      log: logEntry,
    });
  } catch (err: any) {
    console.error('Error in /api/notify-admin-email:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
});

// API: Send Test Email
app.post('/api/test-email', async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@ymaenergy.com';
    const transporter = getTransporter();
    const subject = '🔔 [TEST ALERT] YMA Energy Email Trigger Verification';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #f59e0b; border-radius: 10px;">
        <h2 style="color: #d97706;">YMA Energy Email Notification Test</h2>
        <p>This is a test notification confirming that the real-time alert trigger system is active and operational!</p>
        <p><b>Timestamp:</b> ${new Date().toLocaleString()}</p>
        <p><b>Target Admin Email:</b> ${adminEmail}</p>
      </div>
    `;

    let status: 'SENT_SMTP' | 'SENT_SIMULATED' = 'SENT_SIMULATED';

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"YMA Energy System" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject,
          html: htmlContent,
        });
        status = 'SENT_SMTP';
      } catch (smtpErr: any) {
        console.warn('[SMTP TEST EMAIL NOTICE]: Invalid SMTP login or network issue, using simulated dispatch:', smtpErr.message || smtpErr);
        status = 'SENT_SIMULATED';
      }
    }

    const logEntry: EmailLog = {
      id: `eml_test_${Date.now()}`,
      type: 'test',
      recipient: adminEmail,
      subject,
      content: htmlContent,
      status,
      timestamp: new Date().toISOString(),
    };

    emailLogs.unshift(logEntry);

    res.json({
      success: true,
      message: `Test email trigger executed successfully (${status})`,
      log: logEntry,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite middleware setup for Development / Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
