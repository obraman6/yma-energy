import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useCompanySettingsStore } from '../store/useCompanySettingsStore';

export interface EmailTriggerPayload {
  type: 'order' | 'repair' | 'inquiry';
  data: any;
  targetEmail?: string;
}

export async function sendAdminEmailTrigger(payload: EmailTriggerPayload): Promise<boolean> {
  try {
    const configuredEmail = useCompanySettingsStore.getState().settings?.companyEmail || '';
    const recipientEmail = payload.targetEmail || configuredEmail;

    // 1. Call Backend API trigger
    const res = await fetch('/api/notify-admin-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        targetEmail: recipientEmail,
      }),
    });

    const result = await res.json();
    console.log('Real-time email notification response:', result);

    // 2. Also log to Firestore `email_notifications` for multi-device sync
    const notificationId = `eml_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const emailDoc = {
      id: notificationId,
      type: payload.type,
      subject: result?.log?.subject || `Real-time Alert: ${payload.type.toUpperCase()}`,
      recipient: result?.log?.recipient || recipientEmail,
      status: result?.log?.status || 'DISPATCHED',
      createdAt: new Date().toISOString(),
      payload: payload.data,
    };

    await setDoc(doc(db, 'email_notifications', notificationId), emailDoc).catch((e) =>
      console.warn('Firestore email notification log skipped:', e)
    );

    return result?.success ?? true;
  } catch (error) {
    console.error('Failed to dispatch email trigger API:', error);
    const configuredEmail = useCompanySettingsStore.getState().settings?.companyEmail || '';
    // Fallback log to Firestore directly
    try {
      const notificationId = `eml_fallback_${Date.now()}`;
      await setDoc(doc(db, 'email_notifications', notificationId), {
        id: notificationId,
        type: payload.type,
        subject: `[ALERT] New ${payload.type.toUpperCase()} Submitted`,
        recipient: payload.targetEmail || configuredEmail,
        status: 'DISPATCHED_FALLBACK',
        createdAt: new Date().toISOString(),
        payload: payload.data,
      });
    } catch (fsErr) {
      console.warn('Firestore fallback log failed:', fsErr);
    }
    return false;
  }
}
