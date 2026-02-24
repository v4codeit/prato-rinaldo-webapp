'use server';

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

// Initialize Resend with API key from environment
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ============================================================================
// Brand constants (matching app UI - oklch(0.55 0.12 195) ≈ teal)
// ============================================================================
const BRAND = {
  primary: '#0d7c8c',        // Teal - app primary color
  primaryDark: '#0a6570',    // Darker teal for gradients
  primaryLight: '#e0f5f7',   // Light teal background
  primaryText: '#064e5c',    // Dark teal for text on light bg
  success: '#16a34a',        // Green
  successDark: '#15803d',    // Darker green for gradients
  successLight: '#dcfce7',   // Light green background
  successText: '#14532d',    // Dark green for text
  destructive: '#dc2626',    // Red
  destructiveDark: '#b91c1c',// Darker red for gradients
  destructiveLight: '#fee2e2',// Light red background
  destructiveText: '#7f1d1d',// Dark red for text
  text: '#1e293b',           // Main text
  mutedText: '#64748b',      // Secondary text
  footerText: '#94a3b8',     // Footer text
  bg: '#f8fafc',             // Light background
  cardBg: '#ffffff',         // Card background
  border: '#e2e8f0',         // Border color
  senderName: 'Community Prato Rinaldo',
  senderEmail: 'noreply@pratorinaldo.it',
} as const;

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://pratorinaldo.it';
}

function getLogoUrl(): string {
  return `${getBaseUrl()}/assets/logos/logo-pratorinaldo.png`;
}

// ============================================================================
// Shared email template wrapper
// ============================================================================

interface EmailBanner {
  title: string;
  subtitle: string;
  color: string;       // gradient start
  colorDark: string;   // gradient end
}

interface EmailButton {
  label: string;
  href: string;
  color?: string;      // defaults to BRAND.primary
}

function buildEmailHtml({
  title,
  banner,
  bodyHtml,
  buttons,
  tipHtml,
}: {
  title: string;
  banner: EmailBanner;
  bodyHtml: string;
  buttons?: EmailButton[];
  tipHtml?: string;
}): string {
  const baseUrl = getBaseUrl();
  const logoUrl = getLogoUrl();

  const buttonsHtml = buttons?.length
    ? `<div style="text-align: center; margin-bottom: 24px;">
        ${buttons
          .map(
            (btn, i) =>
              `<a href="${btn.href}"
                style="display: inline-block; background-color: ${btn.color || BRAND.primary}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; ${i > 0 ? 'margin-left: 8px;' : ''}"
              >${btn.label}</a>`
          )
          .join('\n        ')}
      </div>`
    : '';

  const tipSection = tipHtml
    ? `<div style="background-color: ${BRAND.primaryLight}; border: 1px solid ${BRAND.primary}; padding: 16px; border-radius: 8px; font-size: 14px; color: ${BRAND.primaryText}; margin-bottom: 24px;">
        ${tipHtml}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${BRAND.text}; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f1f5f9;">
    <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

      <!-- Header with logo -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${baseUrl}" style="text-decoration: none;">
          <img src="${logoUrl}" alt="${BRAND.senderName}" width="48" height="48" style="width: 48px; height: 48px; border-radius: 12px; margin-bottom: 8px;" />
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${BRAND.primary};">${BRAND.senderName}</p>
        </a>
      </div>

      <!-- Main card -->
      <div style="background-color: ${BRAND.cardBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

        <!-- Banner -->
        <div style="background: linear-gradient(135deg, ${banner.color} 0%, ${banner.colorDark} 100%); padding: 28px 24px; color: white;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">${banner.title}</h1>
          <p style="margin: 0; font-size: 15px; opacity: 0.9;">${banner.subtitle}</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          ${bodyHtml}
        </div>

        <!-- Buttons -->
        ${buttonsHtml ? `<div style="padding: 0 24px 24px;">${buttonsHtml}</div>` : ''}

        <!-- Tip -->
        ${tipHtml ? `<div style="padding: 0 24px 24px;">${tipSection}</div>` : ''}
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 24px 16px; font-size: 13px; color: ${BRAND.footerText};">
        <p style="margin: 0 0 8px 0;">${BRAND.senderName}</p>
        <p style="margin: 0;">
          <a href="${baseUrl}/bacheca" style="color: ${BRAND.primary}; text-decoration: none;">Bacheca</a>
          &nbsp;&middot;&nbsp;
          <a href="${baseUrl}/settings" style="color: ${BRAND.primary}; text-decoration: none;">Impostazioni</a>
        </p>
      </div>

    </div>
  </body>
</html>`;
}

// ============================================================================
// 1. New message notification (marketplace conversations)
// ============================================================================

export async function sendNewMessageNotification({
  recipientEmail,
  recipientName,
  senderName,
  itemTitle,
  messagePreview,
  conversationId,
}: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  itemTitle: string;
  messagePreview: string;
  conversationId: string;
}) {
  if (!resend) {
    console.warn('Resend API key not configured - email notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const baseUrl = getBaseUrl();
  const truncatedPreview = messagePreview.length >= 100
    ? `${messagePreview.substring(0, 100)}...`
    : messagePreview;

  try {
    const { data, error } = await resend.emails.send({
      from: `${BRAND.senderName} <${BRAND.senderEmail}>`,
      to: recipientEmail,
      subject: `Nuovo messaggio da ${senderName} - ${itemTitle}`,
      html: buildEmailHtml({
        title: 'Nuovo Messaggio',
        banner: {
          title: 'Nuovo Messaggio',
          subtitle: `Da ${senderName} per "${itemTitle}"`,
          color: BRAND.primary,
          colorDark: BRAND.primaryDark,
        },
        bodyHtml: `
          <p style="margin: 0 0 12px 0;">Ciao <strong>${recipientName}</strong>,</p>
          <p style="margin: 0 0 16px 0;">Hai ricevuto un nuovo messaggio da <strong>${senderName}</strong> riguardo al tuo annuncio "<strong>${itemTitle}</strong>".</p>
          <div style="background-color: ${BRAND.bg}; border-left: 4px solid ${BRAND.primary}; padding: 16px; border-radius: 4px; margin-bottom: 8px;">
            <p style="margin: 0; font-style: italic; color: ${BRAND.mutedText};">"${truncatedPreview}"</p>
          </div>
        `,
        buttons: [
          { label: 'Rispondi al Messaggio', href: `${baseUrl}/messages/${conversationId}` },
        ],
        tipHtml: `
          <p style="margin: 0 0 4px 0;"><strong>Suggerimento:</strong></p>
          <p style="margin: 0;">Rispondi rapidamente per mantenere l'interesse dell'acquirente!</p>
        `,
      }),
      text: `
Ciao ${recipientName},

Hai ricevuto un nuovo messaggio da ${senderName} riguardo al tuo annuncio: "${itemTitle}"

Messaggio:
"${truncatedPreview}"

Rispondi al messaggio: ${baseUrl}/messages/${conversationId}

---
${BRAND.senderName}
Bacheca: ${baseUrl}/bacheca | Impostazioni: ${baseUrl}/settings
      `.trim(),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    console.log('Email notification sent successfully:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error in sendNewMessageNotification:', error);
    return { success: false, error: 'Failed to send email notification' };
  }
}

// ============================================================================
// 2. Notify new message (internal helper - fetches conversation details)
// ============================================================================

export async function notifyNewMessage({
  conversationId,
  senderId,
  messageContent,
}: {
  conversationId: string;
  senderId: string;
  messageContent: string;
}) {
  try {
    const supabase = await createClient();

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        marketplace_item:marketplace_items!conversations_marketplace_item_id_fkey(
          id,
          title
        ),
        buyer:users!conversations_buyer_id_fkey(
          id,
          name,
          email
        ),
        seller:users!conversations_seller_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Error fetching conversation for email notification:', convError);
      return { success: false, error: 'Conversation not found' };
    }

    const conv = conversation as any;
    const isBuyerSender = conv.buyer_id === senderId;
    const recipient = isBuyerSender ? conv.seller : conv.buyer;
    const sender = isBuyerSender ? conv.buyer : conv.seller;

    if (!recipient || !recipient.email) {
      console.warn('Recipient email not available');
      return { success: false, error: 'Recipient email not available' };
    }

    return await sendNewMessageNotification({
      recipientEmail: recipient.email,
      recipientName: recipient.name || 'Utente',
      senderName: sender?.name || 'Un utente',
      itemTitle: conv.marketplace_item?.title || 'Annuncio',
      messagePreview: messageContent.substring(0, 100),
      conversationId,
    });
  } catch (error) {
    console.error('Error in notifyNewMessage:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

// ============================================================================
// 3. Welcome email (registration received, under review)
// ============================================================================

export async function sendWelcomeEmail({
  recipientEmail,
  recipientName,
}: {
  recipientEmail: string;
  recipientName: string;
}) {
  if (!resend) {
    console.warn('Resend API key not configured - email notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const baseUrl = getBaseUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: `${BRAND.senderName} <${BRAND.senderEmail}>`,
      to: recipientEmail,
      subject: 'Benvenuto nella Community Prato Rinaldo!',
      html: buildEmailHtml({
        title: 'Benvenuto!',
        banner: {
          title: 'Benvenuto!',
          subtitle: 'La tua registrazione è stata ricevuta',
          color: BRAND.primary,
          colorDark: BRAND.primaryDark,
        },
        bodyHtml: `
          <p style="margin: 0 0 12px 0;">Ciao <strong>${recipientName}</strong>,</p>
          <p style="margin: 0 0 16px 0;">Grazie per esserti registrato alla community di Prato Rinaldo! La tua richiesta è stata ricevuta e sarà esaminata dal nostro team.</p>
          <div style="background-color: ${BRAND.bg}; padding: 16px; border-radius: 8px; border-left: 4px solid ${BRAND.primary}; margin-bottom: 8px;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: ${BRAND.primaryText};">Cosa succede ora?</p>
            <ul style="margin: 0; padding-left: 20px; color: ${BRAND.mutedText};">
              <li>Il nostro team verificherà i tuoi dati</li>
              <li>Riceverai una notifica via email con l'esito</li>
              <li>Una volta approvato, potrai accedere a tutte le funzionalità</li>
            </ul>
          </div>
        `,
        buttons: [
          { label: 'Vai al Sito', href: baseUrl },
        ],
        tipHtml: `
          <p style="margin: 0 0 4px 0;"><strong>Suggerimento:</strong></p>
          <p style="margin: 0;">Assicurati di aver completato tutti i dati del profilo per velocizzare la verifica.</p>
        `,
      }),
      text: `
Ciao ${recipientName},

BENVENUTO!

Grazie per esserti registrato alla community di Prato Rinaldo! La tua richiesta è stata ricevuta e sarà esaminata dal nostro team.

Cosa succede ora:
- Il nostro team verificherà i tuoi dati
- Riceverai una notifica via email con l'esito
- Una volta approvato, potrai accedere a tutte le funzionalità

Vai al sito: ${baseUrl}

---
${BRAND.senderName}
Bacheca: ${baseUrl}/bacheca | Impostazioni: ${baseUrl}/settings
      `.trim(),
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('Welcome email sent successfully:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error in sendWelcomeEmail:', error);
    return { success: false, error: 'Failed to send email notification' };
  }
}

// ============================================================================
// 4. Professional profile approved
// ============================================================================

export async function sendProfessionalApprovalEmail({
  recipientEmail,
  recipientName,
  businessName,
  profileType,
  category,
  profileId,
}: {
  recipientEmail: string;
  recipientName: string;
  businessName: string;
  profileType: 'volunteer' | 'professional';
  category: string;
  profileId: string;
}) {
  if (!resend) {
    console.warn('Resend API key not configured - email notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const typeLabel = profileType === 'volunteer' ? 'Volontario' : 'Professionista';
  const baseUrl = getBaseUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: `${BRAND.senderName} <${BRAND.senderEmail}>`,
      to: recipientEmail,
      subject: `Il tuo profilo ${typeLabel} è stato approvato!`,
      html: buildEmailHtml({
        title: 'Profilo Approvato',
        banner: {
          title: 'Profilo Approvato!',
          subtitle: 'Il tuo profilo è ora visibile alla community',
          color: BRAND.success,
          colorDark: BRAND.successDark,
        },
        bodyHtml: `
          <p style="margin: 0 0 12px 0;">Ciao <strong>${recipientName}</strong>,</p>
          <p style="margin: 0 0 20px 0;">Ottime notizie! Il tuo profilo professionale è stato approvato e ora è visibile a tutti i membri della community.</p>
          <div style="background-color: ${BRAND.bg}; padding: 16px; border-radius: 8px; border-left: 4px solid ${BRAND.success}; margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0;"><strong>Nome Attività:</strong> ${businessName}</p>
            <p style="margin: 0 0 4px 0;"><strong>Tipo:</strong> ${typeLabel}</p>
            <p style="margin: 0;"><strong>Categoria:</strong> ${category}</p>
          </div>
        `,
        buttons: [
          { label: 'Vedi Profilo Pubblico', href: `${baseUrl}/community-pro/${profileId}`, color: BRAND.success },
          { label: 'Modifica Profilo', href: `${baseUrl}/community-pro/${profileId}/edit`, color: BRAND.mutedText },
        ],
        tipHtml: `
          <p style="margin: 0 0 4px 0;"><strong>Suggerimento:</strong></p>
          <p style="margin: 0;">Condividi il link del tuo profilo sui social per iniziare a ricevere contatti!</p>
        `,
      }),
      text: `
Ciao ${recipientName},

PROFILO APPROVATO!

Il tuo profilo professionale è stato approvato e ora è visibile alla community.

Dettagli Profilo:
- Nome Attività: ${businessName}
- Tipo: ${typeLabel}
- Categoria: ${category}

Vedi il tuo profilo pubblico: ${baseUrl}/community-pro/${profileId}
Modifica profilo: ${baseUrl}/community-pro/${profileId}/edit

---
${BRAND.senderName}
Bacheca: ${baseUrl}/bacheca | Impostazioni: ${baseUrl}/settings
      `.trim(),
    });

    if (error) {
      console.error('Error sending professional approval email:', error);
      return { success: false, error: error.message };
    }

    console.log('Professional approval email sent successfully:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error in sendProfessionalApprovalEmail:', error);
    return { success: false, error: 'Failed to send email notification' };
  }
}

// ============================================================================
// 4. User account verification (approved/rejected)
// ============================================================================

export async function sendUserVerificationEmail({
  recipientEmail,
  recipientName,
  status,
}: {
  recipientEmail: string;
  recipientName: string;
  status: 'approved' | 'rejected';
}) {
  if (!resend) {
    console.warn('Resend API key not configured - email notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const baseUrl = getBaseUrl();
  const isApproved = status === 'approved';

  try {
    const { data, error } = await resend.emails.send({
      from: `${BRAND.senderName} <${BRAND.senderEmail}>`,
      to: recipientEmail,
      subject: isApproved
        ? 'Il tuo account è stato verificato!'
        : 'Verifica account non approvata',
      html: isApproved
        ? buildEmailHtml({
            title: 'Account Verificato',
            banner: {
              title: 'Benvenuto nella Community!',
              subtitle: 'Il tuo account è stato verificato con successo',
              color: BRAND.success,
              colorDark: BRAND.successDark,
            },
            bodyHtml: `
              <p style="margin: 0 0 12px 0;">Ciao <strong>${recipientName}</strong>,</p>
              <p style="margin: 0 0 20px 0;">Ottime notizie! La tua registrazione alla community è stata verificata e approvata.</p>
              <div style="background-color: ${BRAND.successLight}; padding: 16px; border-radius: 8px; border-left: 4px solid ${BRAND.success}; margin-bottom: 8px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: ${BRAND.successText};">Cosa puoi fare ora:</p>
                <ul style="margin: 0; padding-left: 20px; color: ${BRAND.successText};">
                  <li>Accedere a tutte le aree riservate ai residenti</li>
                  <li>Partecipare alle discussioni della community</li>
                  <li>Pubblicare annunci nel mercatino</li>
                  <li>Iscriverti agli eventi</li>
                  <li>Partecipare alle proposte civiche nell'Agora</li>
                </ul>
              </div>
            `,
            buttons: [
              { label: 'Vai alla Bacheca', href: `${baseUrl}/bacheca`, color: BRAND.success },
            ],
          })
        : buildEmailHtml({
            title: 'Verifica Non Approvata',
            banner: {
              title: 'Verifica Non Approvata',
              subtitle: 'La tua richiesta di verifica non è stata accettata',
              color: BRAND.destructive,
              colorDark: BRAND.destructiveDark,
            },
            bodyHtml: `
              <p style="margin: 0 0 12px 0;">Ciao <strong>${recipientName}</strong>,</p>
              <p style="margin: 0 0 16px 0;">Purtroppo la tua richiesta di verifica per accedere alla community non è stata approvata.</p>
              <p style="margin: 0 0 12px 0;">Questo potrebbe essere dovuto a:</p>
              <ul style="margin: 0 0 16px 0; padding-left: 20px; color: ${BRAND.mutedText};">
                <li>Informazioni incomplete o non verificabili</li>
                <li>Mancata corrispondenza con i requisiti di residenza</li>
              </ul>
            `,
            tipHtml: `
              <p style="margin: 0 0 4px 0;"><strong>Hai domande?</strong></p>
              <p style="margin: 0;">Puoi contattarci per maggiori informazioni o per richiedere una nuova valutazione.</p>
            `,
          }),
      text: isApproved
        ? `
Ciao ${recipientName},

ACCOUNT VERIFICATO!

La tua registrazione alla community è stata verificata e approvata.

Cosa puoi fare ora:
- Accedere a tutte le aree riservate ai residenti
- Partecipare alle discussioni della community
- Pubblicare annunci nel mercatino
- Iscriverti agli eventi
- Partecipare alle proposte civiche nell'Agora

Vai alla Bacheca: ${baseUrl}/bacheca

---
${BRAND.senderName}
Bacheca: ${baseUrl}/bacheca | Impostazioni: ${baseUrl}/settings
        `.trim()
        : `
Ciao ${recipientName},

Verifica Non Approvata

Purtroppo la tua richiesta di verifica per accedere alla community non è stata approvata.

Questo potrebbe essere dovuto a:
- Informazioni incomplete o non verificabili
- Mancata corrispondenza con i requisiti di residenza

Hai domande? Puoi contattarci per maggiori informazioni.

---
${BRAND.senderName}
Bacheca: ${baseUrl}/bacheca | Impostazioni: ${baseUrl}/settings
        `.trim(),
    });

    if (error) {
      console.error('Error sending user verification email:', error);
      return { success: false, error: error.message };
    }

    console.log('User verification email sent successfully:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error in sendUserVerificationEmail:', error);
    return { success: false, error: 'Failed to send email notification' };
  }
}

// ============================================================================
// 5. Professional profile rejected
// ============================================================================

export async function sendProfessionalRejectionEmail({
  recipientEmail,
  recipientName,
  businessName,
  profileType,
  rejectionReason,
  profileId,
}: {
  recipientEmail: string;
  recipientName: string;
  businessName: string;
  profileType: 'volunteer' | 'professional';
  rejectionReason: string;
  profileId: string;
}) {
  if (!resend) {
    console.warn('Resend API key not configured - email notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const typeLabel = profileType === 'volunteer' ? 'Volontario' : 'Professionista';
  const baseUrl = getBaseUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: `${BRAND.senderName} <${BRAND.senderEmail}>`,
      to: recipientEmail,
      subject: `Il tuo profilo ${typeLabel} necessita modifiche`,
      html: buildEmailHtml({
        title: 'Profilo Non Approvato',
        banner: {
          title: 'Profilo Non Approvato',
          subtitle: 'Il tuo profilo necessita alcune modifiche',
          color: BRAND.destructive,
          colorDark: BRAND.destructiveDark,
        },
        bodyHtml: `
          <p style="margin: 0 0 12px 0;">Ciao <strong>${recipientName}</strong>,</p>
          <p style="margin: 0 0 16px 0;">Purtroppo il tuo profilo professionale "<strong>${businessName}</strong>" non può essere approvato al momento.</p>
          <div style="background-color: ${BRAND.destructiveLight}; border-left: 4px solid ${BRAND.destructive}; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: ${BRAND.destructive};">Motivo:</p>
            <p style="margin: 0; color: ${BRAND.destructiveText};">${rejectionReason}</p>
          </div>
          <p style="margin: 0;">Non preoccuparti! Puoi modificare il tuo profilo e inviarlo nuovamente per la revisione.</p>
        `,
        buttons: [
          { label: 'Modifica e Invia Nuovamente', href: `${baseUrl}/community-pro/${profileId}/edit` },
        ],
        tipHtml: `
          <p style="margin: 0 0 4px 0;"><strong>Suggerimenti:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Assicurati che tutte le informazioni siano complete e accurate</li>
            <li>Verifica che la descrizione sia chiara e dettagliata</li>
            <li>Controlla che i contatti siano corretti</li>
          </ul>
        `,
      }),
      text: `
Ciao ${recipientName},

PROFILO NON APPROVATO

Il tuo profilo professionale "${businessName}" non può essere approvato al momento.

Motivo:
${rejectionReason}

Non preoccuparti! Puoi modificare il tuo profilo e inviarlo nuovamente per la revisione.

Modifica profilo: ${baseUrl}/community-pro/${profileId}/edit

Suggerimenti:
- Assicurati che tutte le informazioni siano complete e accurate
- Verifica che la descrizione sia chiara e dettagliata
- Controlla che i contatti siano corretti

---
${BRAND.senderName}
Bacheca: ${baseUrl}/bacheca | Impostazioni: ${baseUrl}/settings
      `.trim(),
    });

    if (error) {
      console.error('Error sending professional rejection email:', error);
      return { success: false, error: error.message };
    }

    console.log('Professional rejection email sent successfully:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error in sendProfessionalRejectionEmail:', error);
    return { success: false, error: 'Failed to send email notification' };
  }
}
