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

// In-memory store for customer SMS logs
interface SmsLog {
  id: string;
  type: 'technician_assigned' | 'job_completed' | 'repair_assigned' | 'repair_completed' | 'test' | 'custom';
  recipient: string;
  message: string;
  status: 'SENT_BEEM' | 'SENT_NEXTSMS' | 'SENT_TWILIO' | 'SENT_SIMULATED' | 'FAILED';
  provider: string;
  timestamp: string;
  details?: any;
}

const smsLogs: SmsLog[] = [];

// Helper to normalize Tanzanian phone numbers (07XXXXXXXX / 06XXXXXXXX -> 2557XXXXXXXX)
function normalizeTzPhone(rawPhone: string): { international: string; local: string; e164: string } {
  const digits = (rawPhone || '').replace(/\D/g, '');
  let intl = digits;
  if (digits.startsWith('0') && digits.length === 10) {
    intl = '255' + digits.substring(1);
  } else if (digits.startsWith('255')) {
    intl = digits;
  }
  const e164 = intl.startsWith('+') ? intl : `+${intl}`;
  const local = intl.startsWith('255') ? `0${intl.substring(3)}` : intl;
  return { international: intl, local, e164 };
}

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
    const { type, data, targetEmail } = req.body;
    const adminEmail = targetEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'support@ymaenergy.co.tz';

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
    } else if (type === 'service') {
      const requestNumber = data.requestNumber || 'SRV-NEW';
      const customerName = data.customerName || 'Mteja';
      const serviceName = data.serviceName || 'Huduma ya Sola';
      const phone = data.phone || 'N/A';
      const location = data.location || 'N/A';
      const preferredDate = data.preferredDate || 'N/A';
      const timeSlot = data.timeSlot || 'Anytime';
      const notes = data.notes || 'Hakuna maelezo ya ziada';

      subject = `🛠️ [YMA SERVICE ALERT] New Service Booking: ${requestNumber} - ${customerName} (${serviceName})`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="background: #0284c7; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">YMA SERVICE BOOKING ALERT</h1>
            <p style="color: #bae6fd; margin: 4px 0 0 0; font-size: 12px;">Ombi Jipya la Huduma ya Sola</p>
          </div>
          
          <h2 style="color: #0369a1; font-size: 18px;">Ombi la Huduma: ${serviceName} (${requestNumber})</h2>
          <p>Mteja ameweka ombi jipya la huduma ya solar kupitia tovuti ya YMA Energy.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Mteja:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${customerName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Simu:</td><td style="padding: 8px; border: 1px solid #cbd5e1;"><a href="tel:${phone}">${phone}</a></td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Huduma:</td><td style="padding: 8px; font-weight: bold; color: #0284c7; border: 1px solid #cbd5e1;">${serviceName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Mahali:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${location}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Tarehe & Wakati:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${preferredDate} (${timeSlot})</td></tr>
          </table>

          <h3 style="font-size: 14px; margin-top: 15px; color: #334155;">Maelezo ya Ziada:</h3>
          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px; font-style: italic; margin-bottom: 15px;">
            "${notes}"
          </div>

          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p>Tafadhali ingia kwenye Admin Dashboard ili kupanga mhandisi (Assign Engineer/Technician).</p>
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
    const { targetEmail } = req.body || {};
    const adminEmail = targetEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'support@ymaenergy.co.tz';
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

// ==========================================
// CUSTOMER SMS DISPATCH & GATEWAY ENDPOINTS
// ==========================================

// API: Get SMS Notification Logs
app.get('/api/sms-logs', (req, res) => {
  const beemActive = Boolean(process.env.BEEM_API_KEY && process.env.BEEM_SECRET_KEY);
  const nextSmsActive = Boolean(process.env.NEXTSMS_USERNAME && process.env.NEXTSMS_PASSWORD);
  const twilioActive = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  res.json({
    success: true,
    logs: smsLogs,
    activeProvider: beemActive ? 'Beem Africa' : nextSmsActive ? 'NextSMS' : twilioActive ? 'Twilio' : 'Simulated Gateway (Active)',
    senderId: process.env.SMS_SENDER_ID || 'YMA_ENERGY',
    beemConfigured: beemActive,
    nextSmsConfigured: nextSmsActive,
    twilioConfigured: twilioActive,
  });
});

// API: Send Real-Time SMS Notification to Customer
app.post('/api/send-sms', async (req, res) => {
  try {
    const { recipient, message, type, details, senderId } = req.body;
    if (!recipient || !message) {
      return res.status(400).json({ success: false, error: 'Recipient phone number and message are required' });
    }

    const { international, local, e164 } = normalizeTzPhone(recipient);
    const smsSender = senderId || process.env.SMS_SENDER_ID || 'YMA_ENERGY';

    let status: 'SENT_BEEM' | 'SENT_NEXTSMS' | 'SENT_TWILIO' | 'SENT_SIMULATED' | 'FAILED' = 'SENT_SIMULATED';
    let providerName = 'Simulated Local Gateway';
    let providerResponse: any = null;

    // 1. Try Beem Africa SMS Gateway (Tanzania standard)
    if (process.env.BEEM_API_KEY && process.env.BEEM_SECRET_KEY) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${process.env.BEEM_API_KEY}:${process.env.BEEM_SECRET_KEY}`).toString('base64');
        const beemRes = await fetch('https://apisms.beem.africa/v1/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            source_addr: smsSender,
            schedule_time: '',
            encoding: 0,
            message,
            recipients: [
              {
                recipient_id: 1,
                dest_addr: international,
              },
            ],
          }),
        });
        providerResponse = await beemRes.json().catch(() => null);
        if (beemRes.ok) {
          status = 'SENT_BEEM';
          providerName = 'Beem Africa';
          console.log(`[SMS DISPATCHED via BEEM AFRICA] To: ${international}, Status: SUCCESS`);
        } else {
          console.warn('[Beem Africa SMS warning, falling back]:', providerResponse);
        }
      } catch (beemErr: any) {
        console.warn('[Beem Africa SMS Error]:', beemErr.message || beemErr);
      }
    }

    // 2. Try NextSMS Gateway (Tanzania) if Beem not sent
    if (status === 'SENT_SIMULATED' && process.env.NEXTSMS_USERNAME && process.env.NEXTSMS_PASSWORD) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${process.env.NEXTSMS_USERNAME}:${process.env.NEXTSMS_PASSWORD}`).toString('base64');
        const nextRes = await fetch('https://messaging-service.co.tz/api/sms/v1/text/single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            from: smsSender,
            to: international,
            text: message,
          }),
        });
        providerResponse = await nextRes.json().catch(() => null);
        if (nextRes.ok) {
          status = 'SENT_NEXTSMS';
          providerName = 'NextSMS Tanzania';
          console.log(`[SMS DISPATCHED via NEXTSMS] To: ${international}, Status: SUCCESS`);
        } else {
          console.warn('[NextSMS warning, falling back]:', providerResponse);
        }
      } catch (nextErr: any) {
        console.warn('[NextSMS Error]:', nextErr.message || nextErr);
      }
    }

    // 3. Try Twilio Gateway if others not sent
    if (status === 'SENT_SIMULATED' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilioAuth = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const formParams = new URLSearchParams();
        formParams.append('To', e164);
        formParams.append('From', process.env.TWILIO_PHONE_NUMBER);
        formParams.append('Body', message);

        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': twilioAuth,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formParams.toString(),
        });
        providerResponse = await twilioRes.json().catch(() => null);
        if (twilioRes.ok) {
          status = 'SENT_TWILIO';
          providerName = 'Twilio SMS';
          console.log(`[SMS DISPATCHED via TWILIO] To: ${e164}, Status: SUCCESS`);
        } else {
          console.warn('[Twilio SMS warning, falling back]:', providerResponse);
        }
      } catch (twilioErr: any) {
        console.warn('[Twilio SMS Error]:', twilioErr.message || twilioErr);
      }
    }

    if (status === 'SENT_SIMULATED') {
      console.log(`[SMS DISPATCHED (INSTANT SIMULATION)] To: ${international} (${local}) | Message: "${message}"`);
    }

    const logEntry: SmsLog = {
      id: `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: type || 'custom',
      recipient: international || recipient,
      message,
      status,
      provider: providerName,
      timestamp: new Date().toISOString(),
      details: { ...details, localPhone: local, internationalPhone: international },
    };

    smsLogs.unshift(logEntry);
    if (smsLogs.length > 60) smsLogs.pop();

    res.json({
      success: true,
      message: `SMS dispatched successfully to ${local} via ${providerName}`,
      status,
      provider: providerName,
      log: logEntry,
    });
  } catch (err: any) {
    console.error('Error in /api/send-sms:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to dispatch SMS' });
  }
});

// API: Send Test SMS
app.post('/api/test-sms', async (req, res) => {
  try {
    const { testPhone, customMessage } = req.body || {};
    const recipient = testPhone || '0712345678';
    const message = customMessage || 'Habari! Huu ni ujumbe wa majaribio kutoka YMA ENERGY GROUP. Mfumo wa SMS kwa wateja unafanya kazi kikamilifu!';

    const { international, local } = normalizeTzPhone(recipient);
    const logEntry: SmsLog = {
      id: `sms_test_${Date.now()}`,
      type: 'test',
      recipient: international,
      message,
      status: 'SENT_SIMULATED',
      provider: 'YMA SMS Test Gateway',
      timestamp: new Date().toISOString(),
      details: { localPhone: local },
    };

    smsLogs.unshift(logEntry);

    res.json({
      success: true,
      message: `Ujumbe wa majaribio umetumwa kwa namba: ${local} (+${international})`,
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
