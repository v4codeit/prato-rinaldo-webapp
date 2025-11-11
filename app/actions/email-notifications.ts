'use server';

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

// Initialize Resend with API key from environment
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send email notification when a new message is received
 *
 * @param recipientEmail - Email of the recipient
 * @param recipientName - Name of the recipient
 * @param senderName - Name of the message sender
 * @param itemTitle - Title of the marketplace item
 * @param messagePreview - Preview of the message content (first 100 chars)
 * @param conversationId - ID of the conversation for the link
 */
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
  // Check if Resend is configured
  if (!resend) {
    console.warn('Resend API key not configured - email notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Prato Rinaldo <noreply@pratorinaldo.it>', // Change to your verified domain
      to: recipientEmail,
      subject: `Nuovo messaggio da ${senderName} - ${itemTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nuovo Messaggio</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin: 0 0 16px 0; font-size: 24px;">Nuovo Messaggio</h1>
              <p style="margin: 0 0 12px 0;">Ciao ${recipientName},</p>
              <p style="margin: 0 0 12px 0;">Hai ricevuto un nuovo messaggio da <strong>${senderName}</strong> riguardo al tuo annuncio:</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600;">"${itemTitle}"</p>
            </div>

            <div style="background-color: #ffffff; border-left: 4px solid #2563eb; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="margin: 0; font-style: italic; color: #555;">"${messagePreview}${messagePreview.length >= 100 ? '...' : ''}"</p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pratorinaldo.it'}/messages/${conversationId}"
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Rispondi al Messaggio
              </a>
            </div>

            <div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px; font-size: 14px; color: #666;">
              <p style="margin: 0 0 8px 0;"><strong>Suggerimento:</strong> Rispondi rapidamente per mantenere l'interesse dell'acquirente!</p>
              <p style="margin: 0;">Puoi gestire le tue conversazioni dalla <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pratorinaldo.it'}/messages" style="color: #2563eb;">sezione messaggi</a>.</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <div style="font-size: 12px; color: #999; text-align: center;">
              <p style="margin: 0 0 8px 0;">Questa email è stata inviata da Prato Rinaldo</p>
              <p style="margin: 0;">Se non desideri ricevere queste notifiche, puoi disattivarle dalle <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pratorinaldo.it'}/settings" style="color: #2563eb;">impostazioni</a>.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Ciao ${recipientName},

Hai ricevuto un nuovo messaggio da ${senderName} riguardo al tuo annuncio: "${itemTitle}"

Messaggio:
"${messagePreview}${messagePreview.length >= 100 ? '...' : ''}"

Rispondi al messaggio: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://pratorinaldo.it'}/messages/${conversationId}

---
Questa email è stata inviata da Prato Rinaldo.
Gestisci le tue impostazioni: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://pratorinaldo.it'}/settings
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

/**
 * Get recipient details and send notification
 * Called internally after a message is sent
 *
 * @param conversationId - The conversation ID
 * @param senderId - ID of the user who sent the message
 * @param messageContent - Content of the message
 */
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

    // Get conversation details with marketplace item and participants
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

    // Determine recipient (the one who didn't send the message)
    const isBuyerSender = conv.buyer_id === senderId;
    const recipient = isBuyerSender ? conv.seller : conv.buyer;
    const sender = isBuyerSender ? conv.buyer : conv.seller;

    if (!recipient || !recipient.email) {
      console.warn('Recipient email not available');
      return { success: false, error: 'Recipient email not available' };
    }

    // Send email notification
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

/**
 * Send email notification when a professional profile is approved
 *
 * @param recipientEmail - Email of the profile owner
 * @param recipientName - Name of the profile owner
 * @param businessName - Name of the business/professional profile
 * @param profileType - Type of profile (volunteer or professional)
 * @param category - Professional category
 * @param profileId - ID of the profile for the link
 */
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
  // Check if Resend is configured
  if (!resend) {
    console.warn('Resend API key not configured - email notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const typeLabel = profileType === 'volunteer' ? 'Volontario' : 'Professionista';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pratorinaldo.it';

  try {
    const { data, error } = await resend.emails.send({
      from: 'Prato Rinaldo <noreply@pratorinaldo.it>',
      to: recipientEmail,
      subject: `✅ Il tuo profilo ${typeLabel} è stato approvato!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Profilo Approvato</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 24px; margin-bottom: 20px; color: white;">
              <h1 style="margin: 0 0 16px 0; font-size: 28px;">✅ Profilo Approvato!</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">Il tuo profilo è ora visibile alla community</p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <p style="margin: 0 0 12px 0;">Ciao ${recipientName},</p>
              <p style="margin: 0 0 20px 0;">Ottime notizie! Il tuo profilo professionale è stato approvato e ora è visibile a tutti i membri della community di Prato Rinaldo.</p>

              <div style="background-color: white; padding: 16px; border-radius: 6px; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #10b981;">Dettagli Profilo:</p>
                <p style="margin: 0 0 4px 0;"><strong>Nome Attività:</strong> ${businessName}</p>
                <p style="margin: 0 0 4px 0;"><strong>Tipo:</strong> ${typeLabel}</p>
                <p style="margin: 0;"><strong>Categoria:</strong> ${category}</p>
              </div>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${baseUrl}/community-pro/${profileId}"
                 style="display: inline-block; background-color: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 8px 8px 0;">
                Vedi Profilo Pubblico
              </a>
              <a href="${baseUrl}/community-pro/${profileId}/edit"
                 style="display: inline-block; background-color: #6b7280; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 0 8px 0;">
                Modifica Profilo
              </a>
            </div>

            <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 16px; border-radius: 4px; font-size: 14px; color: #065f46; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0;"><strong>💡 Suggerimento:</strong></p>
              <p style="margin: 0;">Inizia subito a ricevere contatti! Condividi il link del tuo profilo sui social o invialo direttamente agli interessati.</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <div style="font-size: 12px; color: #999; text-align: center;">
              <p style="margin: 0 0 8px 0;">Questa email è stata inviata da Prato Rinaldo</p>
              <p style="margin: 0;">Gestisci il tuo profilo dalla <a href="${baseUrl}/bacheca" style="color: #10b981;">tua bacheca</a>.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Ciao ${recipientName},

✅ PROFILO APPROVATO!

Il tuo profilo professionale è stato approvato e ora è visibile alla community di Prato Rinaldo.

Dettagli Profilo:
- Nome Attività: ${businessName}
- Tipo: ${typeLabel}
- Categoria: ${category}

Vedi il tuo profilo pubblico: ${baseUrl}/community-pro/${profileId}
Modifica profilo: ${baseUrl}/community-pro/${profileId}/edit

Suggerimento: Inizia subito a ricevere contatti condividendo il link del tuo profilo!

---
Questa email è stata inviata da Prato Rinaldo.
Gestisci il tuo profilo: ${baseUrl}/bacheca
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

/**
 * Send email notification when a professional profile is rejected
 *
 * @param recipientEmail - Email of the profile owner
 * @param recipientName - Name of the profile owner
 * @param businessName - Name of the business/professional profile
 * @param profileType - Type of profile (volunteer or professional)
 * @param rejectionReason - Reason for rejection
 * @param profileId - ID of the profile for the edit link
 */
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
  // Check if Resend is configured
  if (!resend) {
    console.warn('Resend API key not configured - email notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const typeLabel = profileType === 'volunteer' ? 'Volontario' : 'Professionista';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pratorinaldo.it';

  try {
    const { data, error } = await resend.emails.send({
      from: 'Prato Rinaldo <noreply@pratorinaldo.it>',
      to: recipientEmail,
      subject: `❌ Il tuo profilo ${typeLabel} necessita modifiche`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Profilo Rifiutato</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 8px; padding: 24px; margin-bottom: 20px; color: white;">
              <h1 style="margin: 0 0 16px 0; font-size: 28px;">❌ Profilo Non Approvato</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">Il tuo profilo necessita alcune modifiche</p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <p style="margin: 0 0 12px 0;">Ciao ${recipientName},</p>
              <p style="margin: 0 0 20px 0;">Purtroppo il tuo profilo professionale "<strong>${businessName}</strong>" non può essere approvato al momento per il seguente motivo:</p>

              <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #dc2626;">📝 Motivo del Rifiuto:</p>
                <p style="margin: 0; color: #991b1b;">${rejectionReason}</p>
              </div>

              <p style="margin: 0;">Non preoccuparti! Puoi modificare il tuo profilo e inviarlo nuovamente per la revisione. Il nostro team lo esaminerà al più presto.</p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${baseUrl}/community-pro/${profileId}/edit"
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Modifica e Invia Nuovamente
              </a>
            </div>

            <div style="background-color: #eff6ff; border: 1px solid #2563eb; padding: 16px; border-radius: 4px; font-size: 14px; color: #1e40af; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0;"><strong>💡 Suggerimenti:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Assicurati che tutte le informazioni siano complete e accurate</li>
                <li>Verifica che la descrizione sia chiara e dettagliata</li>
                <li>Controlla che i contatti siano corretti</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <div style="font-size: 12px; color: #999; text-align: center;">
              <p style="margin: 0 0 8px 0;">Questa email è stata inviata da Prato Rinaldo</p>
              <p style="margin: 0;">Hai domande? <a href="${baseUrl}/contacts" style="color: #2563eb;">Contattaci</a>.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Ciao ${recipientName},

❌ PROFILO NON APPROVATO

Il tuo profilo professionale "${businessName}" non può essere approvato al momento per il seguente motivo:

📝 Motivo del Rifiuto:
${rejectionReason}

Non preoccuparti! Puoi modificare il tuo profilo e inviarlo nuovamente per la revisione.

Modifica profilo: ${baseUrl}/community-pro/${profileId}/edit

Suggerimenti:
- Assicurati che tutte le informazioni siano complete e accurate
- Verifica che la descrizione sia chiara e dettagliata
- Controlla che i contatti siano corretti

---
Questa email è stata inviata da Prato Rinaldo.
Hai domande? Contattaci: ${baseUrl}/contacts
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
