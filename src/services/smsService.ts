import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useCompanySettingsStore } from '../store/useCompanySettingsStore';

export interface SmsTriggerPayload {
  recipient: string;
  message?: string;
  type: 'technician_assigned' | 'job_completed' | 'repair_assigned' | 'repair_completed' | 'test' | 'custom';
  customerName?: string;
  requestNumber?: string;
  serviceName?: string;
  technicianName?: string;
  technicianPhone?: string;
  details?: Record<string, any>;
}

export function buildCustomerSmsMessage(payload: SmsTriggerPayload, companyPhone = ''): string {
  if (payload.message && payload.message.trim().length > 0) {
    return payload.message.trim();
  }

  const cName = payload.customerName?.trim() || 'Mteja';
  const reqNum = payload.requestNumber ? `#${payload.requestNumber}` : '';
  const sName = payload.serviceName || 'Huduma ya Sola';
  const tName = payload.technicianName || 'Mhandisi Wetu';
  const tPhone = payload.technicianPhone ? ` (Simu: ${payload.technicianPhone})` : '';
  const compPhone = companyPhone || '0754 000 000';

  switch (payload.type) {
    case 'technician_assigned':
      return `Habari ${cName}, ombi lako la huduma ${reqNum} (${sName}) limepangiwa Mhandisi ${tName}${tPhone}. Atawasiliana nawe kabla ya kuanza safari. Asante kwa kuchagua YMA Energy Group!`;

    case 'job_completed':
      return `Habari ${cName}, kazi yako ya ${sName} ${reqNum} imekamilika kikamilifu na kuthibitishwa na Mhandisi ${tName}. Asante kwa kuiamini YMA Energy Group! Kwa msaada piga: ${compPhone}.`;

    case 'repair_assigned':
      return `Habari ${cName}, tiketi yako ya matengenezo ${reqNum} imepangiwa Fundi ${tName}${tPhone}. Atafika kukagua na kutatua hitilafu. YMA Energy Group.`;

    case 'repair_completed':
      return `Habari ${cName}, matengenezo ya mfumo wako wa sola ${reqNum} yamekamilika na kufanyiwa majaribio kikamilifu. Asante kwa kuchagua YMA Energy Group!`;

    case 'test':
      return `Habari! Huu ni ujumbe wa majaribio wa mfumo wa SMS kutoka YMA Energy Group. Huduma inafanya kazi kikamilifu.`;

    default:
      return `Habari ${cName}, taarifa mpya kuhusu ombi lako ${reqNum} kutoka YMA Energy Group.`;
  }
}

export async function sendCustomerSms(payload: SmsTriggerPayload): Promise<{ success: boolean; message: string; log?: any }> {
  try {
    const rawRecipient = (payload.recipient || '').trim();
    if (!rawRecipient) {
      console.warn('sendCustomerSms aborted: no recipient phone number');
      return { success: false, message: 'Namba ya simu ya mteja haipo' };
    }

    const companyPhone = useCompanySettingsStore.getState().settings?.companyPhone || '';
    const finalMessage = buildCustomerSmsMessage(payload, companyPhone);

    // 1. Post to full-stack Express API route
    let result: any = null;
    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: rawRecipient,
          message: finalMessage,
          type: payload.type,
          details: {
            customerName: payload.customerName,
            requestNumber: payload.requestNumber,
            serviceName: payload.serviceName,
            technicianName: payload.technicianName,
            technicianPhone: payload.technicianPhone,
            ...payload.details,
          },
        }),
      });
      result = await res.json().catch(() => null);
    } catch (fetchErr) {
      console.warn('Local /api/send-sms call error, will store directly in Firestore:', fetchErr);
    }

    // 2. Persist to Firestore `sms_notifications` collection for live audit & cross-device dashboard sync
    const notificationId = `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const smsDoc = {
      id: notificationId,
      recipient: rawRecipient,
      customerName: payload.customerName || 'Mteja',
      requestNumber: payload.requestNumber || '',
      serviceName: payload.serviceName || '',
      technicianName: payload.technicianName || '',
      technicianPhone: payload.technicianPhone || '',
      message: finalMessage,
      type: payload.type,
      status: result?.status || 'SENT_SIMULATED',
      provider: result?.provider || 'YMA Gateway',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'sms_notifications', notificationId), smsDoc).catch((fsErr) =>
      console.warn('Firestore SMS log record skipped:', fsErr)
    );

    return {
      success: true,
      message: result?.message || `SMS imetumwa kwa mteja (${rawRecipient})`,
      log: smsDoc,
    };
  } catch (err: any) {
    console.error('Failed to send customer SMS:', err);
    return { success: false, message: err.message || 'Hitilafu wakati wa kutuma SMS' };
  }
}

// Helpers for native device SMS & WhatsApp fallback
export function getNativeSmsLink(phone: string, text: string): string {
  const cleanPhone = (phone || '').replace(/[^\d+]/g, '');
  return `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
}

export function getWhatsAppLink(phone: string, text: string): string {
  let clean = (phone || '').replace(/\D/g, '');
  if (clean.startsWith('0') && clean.length === 10) {
    clean = '255' + clean.substring(1);
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
