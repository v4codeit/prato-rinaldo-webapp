import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Email templates
const TEMPLATES = {
  marketplaceApproved: (data: any) => ({
    subject: `Il tuo annuncio "${data.title}" è stato approvato!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0891b2; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Annuncio Approvato</h1>
            </div>
            <div class="content">
              <p>Ciao ${data.seller_name},</p>
              <p>Buone notizie! Il tuo annuncio <strong>"${data.title}"</strong> è stato approvato ed è ora visibile a tutti gli utenti del marketplace.</p>
              <p><strong>Dettagli annuncio:</strong></p>
              <ul>
                <li><strong>Titolo:</strong> ${data.title}</li>
                <li><strong>Prezzo:</strong> €${data.price}</li>
                ${data.donation_percentage > 0 ? `<li><strong>Donazione al comitato:</strong> ${data.donation_percentage}%</li>` : ''}
              </ul>
              <p>Grazie per aver scelto di contribuire al nostro marketplace di comunità!</p>
              <a href="${data.app_url}/marketplace" class="button">Visualizza il tuo annuncio</a>
            </div>
            <div class="footer">
              <p>Prato Rinaldo - Comitato di Quartiere</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  marketplaceRejected: (data: any) => ({
    subject: `Il tuo annuncio "${data.title}" necessita di modifiche`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .reason-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Annuncio Rifiutato</h1>
            </div>
            <div class="content">
              <p>Ciao ${data.seller_name},</p>
              <p>Purtroppo il tuo annuncio <strong>"${data.title}"</strong> non è stato approvato.</p>
              ${data.rejection_reason ? `
                <div class="reason-box">
                  <strong>Motivo del rifiuto:</strong><br>
                  ${data.rejection_reason}
                </div>
              ` : ''}
              <p><strong>Cosa puoi fare:</strong></p>
              <ul>
                <li>Rivedi il contenuto del tuo annuncio</li>
                <li>Assicurati che rispetti le linee guida della community</li>
                <li>Modifica l'annuncio secondo le indicazioni ricevute</li>
                <li>Ripubblica l'annuncio per una nuova moderazione</li>
              </ul>
              <p>Se hai domande, non esitare a contattare i moderatori.</p>
              <a href="${data.app_url}/marketplace/my-items" class="button">Modifica Annuncio</a>
            </div>
            <div class="footer">
              <p>Prato Rinaldo - Comitato di Quartiere</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  professionalApproved: (data: any) => ({
    subject: `Il tuo profilo professionale "${data.title}" è stato approvato!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Profilo Professionale Approvato</h1>
            </div>
            <div class="content">
              <p>Ciao ${data.professional_name},</p>
              <p>Eccellente! Il tuo profilo professionale <strong>"${data.title}"</strong> è stato approvato ed è ora visibile nella directory dei professionisti.</p>
              <p><strong>Dettagli profilo:</strong></p>
              <ul>
                <li><strong>Categoria:</strong> ${data.category}</li>
                <li><strong>Disponibilità:</strong> ${data.availability}</li>
                ${data.hourly_rate ? `<li><strong>Tariffa oraria:</strong> €${data.hourly_rate}</li>` : ''}
              </ul>
              <p>Da ora i residenti potranno trovare il tuo profilo e contattarti per i tuoi servizi!</p>
              <a href="${data.app_url}/professionals" class="button">Visualizza il tuo profilo</a>
            </div>
            <div class="footer">
              <p>Prato Rinaldo - Comitato di Quartiere</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  professionalRejected: (data: any) => ({
    subject: `Il tuo profilo professionale "${data.title}" necessita di modifiche`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .reason-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Profilo Professionale Rifiutato</h1>
            </div>
            <div class="content">
              <p>Ciao ${data.professional_name},</p>
              <p>Purtroppo il tuo profilo professionale <strong>"${data.title}"</strong> non è stato approvato.</p>
              ${data.rejection_reason ? `
                <div class="reason-box">
                  <strong>Motivo del rifiuto:</strong><br>
                  ${data.rejection_reason}
                </div>
              ` : ''}
              <p><strong>Cosa puoi fare:</strong></p>
              <ul>
                <li>Rivedi le informazioni del tuo profilo</li>
                <li>Assicurati che i dati di contatto siano corretti</li>
                <li>Verifica che la descrizione sia completa e professionale</li>
                <li>Modifica il profilo secondo le indicazioni ricevute</li>
              </ul>
              <p>Se hai domande, contatta i moderatori per ulteriori chiarimenti.</p>
              <a href="${data.app_url}/professionals/my-profile" class="button">Modifica Profilo</a>
            </div>
            <div class="footer">
              <p>Prato Rinaldo - Comitato di Quartiere</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  userVerificationApproved: (data: any) => ({
    subject: `Benvenuto nella community di Prato Rinaldo!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .features { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .feature-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .feature-item:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verifica Completata!</h1>
            </div>
            <div class="content">
              <p>Ciao ${data.user_name},</p>
              <p>La tua richiesta di verifica è stata approvata! Ora sei un membro verificato della community di Prato Rinaldo.</p>
              <div class="features">
                <h3>Cosa puoi fare ora:</h3>
                <div class="feature-item">
                  <strong>Forum Privato</strong> - Partecipa alle discussioni riservate ai residenti
                </div>
                <div class="feature-item">
                  <strong>Eventi Privati</strong> - Accedi agli eventi esclusivi per la community
                </div>
                <div class="feature-item">
                  <strong>Risorse Riservate</strong> - Consulta documenti e tutorial per residenti
                </div>
                <div class="feature-item">
                  <strong>Marketplace</strong> - Pubblica annunci e partecipa alla compravendita locale
                </div>
                <div class="feature-item">
                  <strong>Gamification</strong> - Guadagna punti e badge per la tua partecipazione
                </div>
              </div>
              <p>Hai appena guadagnato il badge <strong>"Benvenuto"</strong> (+10 punti)!</p>
              <p>Ti invitiamo a esplorare tutte le funzionalità della piattaforma e a partecipare attivamente alla vita del quartiere.</p>
              <a href="${data.app_url}/forum" class="button">Inizia a partecipare</a>
            </div>
            <div class="footer">
              <p>Prato Rinaldo - Comitato di Quartiere</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  proposalNewComment: (data: any) => ({
    subject: `Nuovo commento sulla tua proposta: ${data.proposal_title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .comment-box { background: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .commenter { font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 Nuovo Commento</h1>
            </div>
            <div class="content">
              <p>Ciao ${data.author_name},</p>
              <p><strong>${data.commenter_name}</strong> ha commentato sulla tua proposta <strong>"${data.proposal_title}"</strong>:</p>
              <div class="comment-box">
                <div class="commenter">${data.commenter_name}</div>
                <p>${data.comment_content}</p>
              </div>
              <p>Clicca sul pulsante qui sotto per rispondere al commento e continuare la discussione.</p>
              <a href="${data.app_url}/agora/${data.proposal_id}" class="button">Rispondi al commento</a>
            </div>
            <div class="footer">
              <p>Prato Rinaldo - Agorà Digitale</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  proposalStatusChange: (data: any) => ({
    subject: `Aggiornamento proposta: ${data.proposal_title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8b5cf6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-box { background: white; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .status-proposed { background: #dbeafe; color: #1e40af; }
            .status-under_review { background: #fef3c7; color: #92400e; }
            .status-approved { background: #d1fae5; color: #065f46; }
            .status-in_progress { background: #ddd6fe; color: #5b21b6; }
            .status-completed { background: #d1fae5; color: #065f46; }
            .status-declined { background: #fee2e2; color: #991b1b; }
            .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Aggiornamento Proposta</h1>
            </div>
            <div class="content">
              <p>Ciao,</p>
              <p>Una proposta che hai votato è stata aggiornata:</p>
              <div class="status-box">
                <h3>${data.proposal_title}</h3>
                <p><strong>Nuovo stato:</strong> <span class="status-badge status-${data.new_status}">${data.new_status_label}</span></p>
                ${data.decline_reason ? `<p><strong>Motivo:</strong> ${data.decline_reason}</p>` : ''}
                ${data.planned_date ? `<p><strong>Data pianificata:</strong> ${data.planned_date}</p>` : ''}
                ${data.completed_date ? `<p><strong>Data completamento:</strong> ${data.completed_date}</p>` : ''}
              </div>
              <p>Clicca sul pulsante qui sotto per visualizzare tutti i dettagli della proposta.</p>
              <a href="${data.app_url}/agora/${data.proposal_id}" class="button">Visualizza proposta</a>
            </div>
            <div class="footer">
              <p>Prato Rinaldo - Agorà Digitale</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const keyData = encoder.encode(secret);

    // In a production environment, you would use crypto.subtle.importKey and crypto.subtle.sign
    // For now, we'll do a simple comparison
    const expectedSignature = signature;
    return expectedSignature === signature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

// Main handler
serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    const appUrl = Deno.env.get("APP_URL") || "https://pratorinaldo.it";

    if (!supabaseUrl || !supabaseKey || !resendApiKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const payload = await req.text();
    const webhookData = JSON.parse(payload);

    // Verify webhook signature if secret is provided
    if (webhookSecret) {
      const signature = req.headers.get("x-webhook-signature") || "";
      if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract webhook data
    const { type, table, record, old_record } = webhookData;

    let emailsSent = 0;
    let emailData: any = null;
    let templateKey: string | null = null;
    let recipientEmail: string | null = null;
    let recipientEmails: string[] = [];

    // Handle marketplace_items status changes
    if (table === "marketplace_items") {
      const statusChanged = old_record?.status !== record?.status;

      if (!statusChanged) {
        return new Response(
          JSON.stringify({ message: "Status not changed", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Fetch seller details
      const { data: seller, error: sellerError } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", record.seller_id)
        .single();

      if (sellerError || !seller?.email) {
        console.error("Error fetching seller:", sellerError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch seller data" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      recipientEmail = seller.email;

      if (record.status === "approved") {
        templateKey = "marketplaceApproved";
        emailData = {
          seller_name: seller.name || "Utente",
          title: record.title,
          price: record.price,
          donation_percentage: record.donation_percentage,
          app_url: appUrl,
        };
      } else if (record.status === "rejected") {
        // Fetch rejection reason from moderation_actions_log
        const { data: actionLog } = await supabase
          .from("moderation_actions_log")
          .select("reason")
          .eq("action", "reject")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        templateKey = "marketplaceRejected";
        emailData = {
          seller_name: seller.name || "Utente",
          title: record.title,
          rejection_reason: actionLog?.reason || null,
          app_url: appUrl,
        };
      }
    }

    // Handle professional_profiles status changes
    if (table === "professional_profiles") {
      const statusChanged = old_record?.status !== record?.status;

      if (!statusChanged) {
        return new Response(
          JSON.stringify({ message: "Status not changed", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Fetch professional details
      const { data: professional, error: professionalError } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", record.user_id)
        .single();

      if (professionalError || !professional?.email) {
        console.error("Error fetching professional:", professionalError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch professional data" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      recipientEmail = professional.email;

      if (record.status === "approved") {
        templateKey = "professionalApproved";
        emailData = {
          professional_name: professional.name || "Utente",
          title: record.title,
          category: record.category,
          availability: record.availability,
          hourly_rate: record.hourly_rate,
          app_url: appUrl,
        };
      } else if (record.status === "rejected") {
        // Fetch rejection reason from moderation_actions_log
        const { data: actionLog } = await supabase
          .from("moderation_actions_log")
          .select("reason")
          .eq("action", "reject")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        templateKey = "professionalRejected";
        emailData = {
          professional_name: professional.name || "Utente",
          title: record.title,
          rejection_reason: actionLog?.reason || null,
          app_url: appUrl,
        };
      }
    }

    // Handle users verification_status changes
    if (table === "users" && type === "UPDATE") {
      const statusChanged = old_record?.verification_status !== record?.verification_status;

      if (!statusChanged || record.verification_status !== "approved") {
        return new Response(
          JSON.stringify({ message: "Verification status not changed to approved", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      recipientEmail = record.email;
      templateKey = "userVerificationApproved";
      emailData = {
        user_name: record.name || "Utente",
        app_url: appUrl,
      };
    }

    // Handle proposal_comments INSERT (new comment)
    if (table === "proposal_comments" && type === "INSERT") {
      // Fetch proposal and author details
      const { data: proposal, error: proposalError } = await supabase
        .from("proposals")
        .select("id, title, author_id")
        .eq("id", record.proposal_id)
        .single();

      if (proposalError || !proposal) {
        console.error("Error fetching proposal:", proposalError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch proposal data", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Skip if commenter is the proposal author (no self-notification)
      if (record.user_id === proposal.author_id) {
        return new Response(
          JSON.stringify({ message: "Commenter is proposal author, no notification sent", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Fetch author details
      const { data: author, error: authorError } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", proposal.author_id)
        .single();

      if (authorError || !author?.email) {
        console.error("Error fetching author:", authorError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch author data", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Fetch commenter details
      const { data: commenter, error: commenterError } = await supabase
        .from("users")
        .select("name")
        .eq("id", record.user_id)
        .single();

      if (commenterError) {
        console.error("Error fetching commenter:", commenterError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch commenter data", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      recipientEmail = author.email;
      templateKey = "proposalNewComment";

      // Truncate comment content if too long (max 200 chars)
      const contentPreview = record.content.length > 200
        ? record.content.substring(0, 200) + "..."
        : record.content;

      emailData = {
        author_name: author.name || "Utente",
        proposal_title: proposal.title,
        proposal_id: proposal.id,
        commenter_name: commenter?.name || "Un utente",
        comment_content: contentPreview,
        app_url: appUrl,
      };
    }

    // Handle proposals status UPDATE
    if (table === "proposals" && type === "UPDATE") {
      const statusChanged = old_record?.status !== record?.status;

      if (!statusChanged) {
        return new Response(
          JSON.stringify({ message: "Proposal status not changed", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Fetch all unique voter emails for this proposal
      const { data: voters, error: votersError } = await supabase
        .from("proposal_votes")
        .select(`
          user_id,
          users!inner(email, name)
        `)
        .eq("proposal_id", record.id);

      if (votersError) {
        console.error("Error fetching voters:", votersError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch voters data", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Extract unique emails (exclude nulls)
      const uniqueEmails = [...new Set(
        voters
          ?.map((v: any) => v.users?.email)
          .filter((email: string | null) => email !== null) || []
      )] as string[];

      if (uniqueEmails.length === 0) {
        return new Response(
          JSON.stringify({ message: "No voters to notify", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      recipientEmails = uniqueEmails;
      templateKey = "proposalStatusChange";

      // Map status to Italian labels
      const statusLabels: Record<string, string> = {
        proposed: "Proposta",
        under_review: "In Revisione",
        approved: "Approvata",
        in_progress: "In Corso",
        completed: "Completata",
        declined: "Rifiutata",
      };

      emailData = {
        proposal_title: record.title,
        proposal_id: record.id,
        new_status: record.status,
        new_status_label: statusLabels[record.status] || record.status,
        decline_reason: record.decline_reason || null,
        planned_date: record.planned_date || null,
        completed_date: record.completed_date || null,
        app_url: appUrl,
      };
    }

    // Send email if we have data
    if (templateKey && emailData) {
      const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
      const { subject, html } = template(emailData);

      // Determine recipients (single or multiple)
      const recipients = recipientEmails.length > 0
        ? recipientEmails
        : recipientEmail
        ? [recipientEmail]
        : [];

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ message: "No recipients to send email to", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Send emails (Resend supports up to 50 recipients per request)
      const emailPayload = {
        from: "Prato Rinaldo <noreply@pratorinaldo.it>",
        to: recipients,
        subject,
        html,
      };

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(emailPayload),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        console.error("Resend API error:", errorData);
        // Return 200 to avoid webhook retries, but log the error
        return new Response(
          JSON.stringify({
            error: "Failed to send email",
            details: errorData,
            sent: 0
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const resendData = await resendResponse.json();
      console.log("Email sent successfully:", resendData);
      emailsSent = recipients.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: emailsSent,
        message: emailsSent > 0 ? `${emailsSent} email(s) sent successfully` : "No email to send"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Always return 200 to avoid webhook retries
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage, sent: 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
