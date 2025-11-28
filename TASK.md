# TASK - Sistema Notifiche In-App + Push

> **Progetto:** Prato Rinaldo Community Platform
> **Feature:** Mobile Header Simplification + User Registration Notifications
> **Creato:** Novembre 2025
> **Status:** In Progress

---

## Overview

Implementazione di un sistema di notifiche in-app generico con:
- Campanella notifiche nell'header con badge unread count
- Drawer da destra per centro notifiche (mobile-friendly)
- Notifica automatica agli admin quando un nuovo utente si registra
- Integrazione con push notifications esistenti
- Real-time updates con Supabase Realtime

---

## Requisiti Chiave

| Requisito | Stato |
|-----------|-------|
| UI Notifiche: Drawer da destra | Pianificato |
| Canali: Push + In-App | Pianificato |
| Destinatari admin: Admin, Moderatori, Board | Pianificato |
| Attivazione: Redirect a /admin/users | Pianificato |
| Post-attivazione: verification_status + is_active + email | Pianificato |
| Real-time: Supabase Realtime | Pianificato |
| Sistema generico e riutilizzabile | Pianificato |

---

## Documentazione Correlata

- `docs/NOTIFICATION_SYSTEM_PLAN.md` - Piano dettagliato completo
- `types/notifications.ts` - TypeScript interfaces
- `CLAUDE.md` - Istruzioni generali progetto

---

## FASE 1: Database Migration

### File da creare
- [ ] `supabase/migrations/XXXXX_user_notifications.sql`

### Tasks
- [ ] Definire ENUM `notification_type`
  ```sql
  CREATE TYPE notification_type AS ENUM (
    'user_registration', 'user_approved', 'user_rejected',
    'proposal_new', 'proposal_status', 'event_reminder',
    'marketplace_new', 'announcement', 'system'
  );
  ```

- [ ] Definire ENUM `notification_status`
  ```sql
  CREATE TYPE notification_status AS ENUM (
    'unread', 'read', 'action_pending', 'action_completed', 'archived'
  );
  ```

- [ ] Creare tabella `user_notifications`
  - id, tenant_id, user_id
  - type, title, message
  - related_type, related_id
  - action_url, metadata (JSONB)
  - status, requires_action
  - created_at, read_at, action_completed_at

- [ ] Creare indexes per performance
  - idx_notifications_user_unread
  - idx_notifications_user_all
  - idx_notifications_type
  - idx_notifications_tenant
  - idx_notifications_related

- [ ] Configurare RLS policies
  - Users can view own notifications
  - Users can update own notifications
  - Service role can insert
  - Admins can view tenant notifications

- [ ] Creare funzioni helper
  - [ ] `get_unread_notification_count(p_user_id)`
  - [ ] `mark_notification_read(p_notification_id)`
  - [ ] `mark_notification_action_completed(p_notification_id, p_related_id)`
  - [ ] `get_admin_notification_recipients(p_tenant_id)`

- [ ] Creare trigger per nuovi utenti
  - [ ] Function `notify_admins_new_user()`
  - [ ] Trigger `on_new_user_notify_admins` AFTER INSERT ON users

- [ ] Abilitare Realtime
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
  ```

### Comandi da eseguire
```bash
# Dopo aver creato la migration
pnpm exec supabase db push
pnpm supabase:gen-types
```

---

## FASE 2: Types e Constants

### File da creare/modificare
- [x] `types/notifications.ts` - COMPLETATO

### File da modificare
- [ ] `lib/utils/constants.ts`
  - [ ] Aggiungere `NOTIFICATION_TYPES` constant
  - [ ] Aggiungere `NOTIFICATION_STATUS` constant

---

## FASE 3: Hook useNotifications

### File da creare
- [ ] `hooks/use-notifications.ts`

### Funzionalità
- [ ] Fetch notifications dal database
- [ ] Subscription Supabase Realtime (INSERT, UPDATE)
- [ ] Calcolo unreadCount
- [ ] markAsRead(notificationId)
- [ ] markAllAsRead()
- [ ] markActionCompleted(notificationId)
- [ ] refetch()
- [ ] Optimistic updates con rollback

### Pattern da seguire
- Basarsi su `hooks/use-topic-messages.ts` per pattern Realtime
- Basarsi su `hooks/use-unread-count.ts` per pattern count

---

## FASE 4: Componenti UI

### File da creare

#### 4.1 NotificationBell
- [ ] `components/organisms/header/notification-bell.tsx`
  - Props: unreadCount, onClick, className
  - Badge con count (99+ se > 99)
  - Accessibilità: aria-label

#### 4.2 NotificationDrawer
- [ ] `components/organisms/header/notification-drawer.tsx`
  - Usa Sheet component (side="right")
  - Header con titolo, "Segna tutte lette", Settings button
  - Tabs: Tutte, Non lette, Azioni
  - ScrollArea per lista
  - Navigazione on click

#### 4.3 NotificationItem
- [ ] `components/organisms/notifications/notification-item.tsx`
  - Icona per tipo (UserPlus, Calendar, etc.)
  - Titolo, messaggio, timestamp
  - Badge "Azione richiesta" se action_pending
  - Indicatore unread (dot blu)
  - Freccia se action_url presente

#### 4.4 NotificationList
- [ ] `components/organisms/notifications/notification-list.tsx`
  - Loading skeleton
  - Empty state
  - Lista NotificationItem

---

## FASE 5: Server Actions

### File da creare
- [ ] `app/actions/notifications.ts`

### Functions
- [ ] `getNotifications(limit)` - Fetch notifications per user
- [ ] `getUnreadNotificationCount()` - Count unread
- [ ] `markNotificationAsRead(id)` - Mark single as read
- [ ] `markNotificationActionCompleted(id, relatedId)` - Mark action done
- [ ] `markAllNotificationsAsRead()` - Bulk mark read
- [ ] `createNotification(input)` - Admin only, for testing

---

## FASE 6: Header Integration

### File da modificare
- [ ] `components/organisms/header/header.tsx`
  - [ ] Import NotificationBell, NotificationDrawer
  - [ ] Aggiungere state `notificationsOpen`
  - [ ] Integrare useNotifications hook
  - [ ] Sostituire campanella statica con NotificationBell
  - [ ] Aggiungere NotificationDrawer
  - [ ] Mostrare solo per utenti autenticati

### Pattern attuale da sostituire
```tsx
// DA RIMUOVERE (linee 39-44)
<div className="relative">
  <Button variant="ghost" size="icon">
    <Bell className="h-5 w-5" />
  </Button>
  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
</div>
```

---

## FASE 7: Admin Users Page - Sezione "Da Verificare"

### File da modificare
- [ ] `app/(admin)/admin/users/users-client.tsx`

### Tasks
- [ ] Filtrare utenti con `verification_status === 'pending'`
- [ ] Creare sezione Card in cima alla pagina
  - Border amber, bg amber-50
  - Icona UserPlus
  - Titolo "Utenti da verificare (X)"
  - Descrizione esplicativa
- [ ] Creare componente PendingUserCard
  - Avatar, nome, email
  - Data registrazione (formatDistanceToNow)
  - Bottoni: Dettagli, Rifiuta, Approva
- [ ] Dialog per vedere dettagli utente completi
- [ ] Gestire highlight da URL (`?highlight=userId`)

---

## FASE 8: User Activation Flow

### File da modificare
- [ ] `app/actions/users.ts` - `updateVerificationStatus()`

### Tasks
- [ ] Aggiungere update di `is_active` basato su status
  ```tsx
  is_active: status === 'approved'
  ```

- [ ] Aggiungere invio email attivazione (se approved)
  ```tsx
  if (status === 'approved' && targetUser?.email) {
    await sendUserActivationEmail({ email, name });
  }
  ```

- [ ] Aggiungere mark notification completed
  ```tsx
  await supabase
    .from('user_notifications')
    .update({ status: 'action_completed', action_completed_at: now })
    .eq('related_type', 'user')
    .eq('related_id', userId)
    .eq('type', 'user_registration');
  ```

---

## FASE 9: Push Integration (Edge Function)

### File da creare
- [ ] `supabase/functions/send-admin-notification/index.ts`

### Tasks
- [ ] Struttura Edge Function
- [ ] Check user preferences (push_enabled, push_announcements)
- [ ] Fetch active subscriptions
- [ ] Build push payload
- [ ] Send via @nicosantangelo/webpush
- [ ] Handle errors (expired, failed)
- [ ] Log results

### Webhook Configuration (Supabase Dashboard)
- [ ] Name: `push-admin-notifications`
- [ ] Table: `user_notifications`
- [ ] Events: INSERT
- [ ] Filter: `requires_action=eq.true`
- [ ] Function: `send-admin-notification`

### Deploy
```bash
pnpm exec supabase functions deploy send-admin-notification
```

---

## FASE 10: Email Template

### File da modificare
- [ ] `app/actions/email-notifications.ts`

### Tasks
- [ ] Creare/aggiornare `sendUserActivationEmail()`
  - To: user email
  - Subject: "Il tuo account Prato Rinaldo è stato attivato!"
  - Body: Benvenuto, link al bacheca

---

## Testing Checklist

### Database
- [ ] Migration applicata senza errori
- [ ] Types generati correttamente
- [ ] RLS policies funzionanti
- [ ] Trigger notify_admins_new_user() funziona
- [ ] Realtime subscription attiva

### UI
- [ ] Campanella visibile solo per utenti autenticati
- [ ] Badge count corretto
- [ ] Drawer si apre/chiude correttamente
- [ ] Tabs funzionano (Tutte, Non lette, Azioni)
- [ ] Click su notifica naviga correttamente
- [ ] Mark as read funziona
- [ ] Mark all as read funziona

### Admin Flow
- [ ] Sezione "Da verificare" appare se ci sono pending users
- [ ] PendingUserCard mostra info corrette
- [ ] Bottone Approva funziona
- [ ] Bottone Rifiuta funziona
- [ ] Notifica diventa "action_completed" dopo approvazione
- [ ] is_active viene settato correttamente
- [ ] Email di attivazione inviata

### Push
- [ ] Edge Function deployata
- [ ] Webhook configurato
- [ ] Push ricevuto su device admin
- [ ] Click su push naviga correttamente

### Realtime
- [ ] Nuova notifica appare senza refresh
- [ ] Badge si aggiorna in tempo reale
- [ ] Update notifica riflesso immediatamente

---

## Note Implementazione

### Pattern da Seguire
- **Server/Client separation**: Seguire pattern Next.js 16
- **Optimistic updates**: Update UI prima della risposta server
- **Error handling**: Toast per errori, rollback su failure
- **Accessibilità**: aria-labels, keyboard navigation

### File di Riferimento
- `hooks/use-topic-messages.ts` - Pattern Realtime subscription
- `hooks/use-unread-count.ts` - Pattern count tracking
- `components/organisms/notifications/notification-settings.tsx` - Pattern settings UI
- `supabase/functions/send-push-notification/index.ts` - Pattern Edge Function push

### Ordine di Implementazione Consigliato
1. Database (fondamento)
2. Types/Constants (tipi per tutto il resto)
3. Server Actions (logica backend)
4. Hook (state management)
5. Components (UI)
6. Header Integration (collegamento)
7. Admin Page (uso della notifica)
8. User Activation (completamento flow)
9. Push (enhancement)
10. Email (enhancement)

---

## Changelog

| Data | Descrizione |
|------|-------------|
| Nov 2025 | Creazione piano iniziale |
| Nov 2025 | types/notifications.ts completato |

---

## Prossimo Step

**FASE 1: Database Migration** - Creare la migration SQL con tutti i componenti database.
