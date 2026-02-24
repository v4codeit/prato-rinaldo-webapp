# TASK: Community/Topics - Fix & Miglioramenti

**Creato:** 2026-02-24
**Stato:** Da implementare
**Priorita:** Alta

---

## TASK 1: Fix Notifiche/Unread mentre utente e nel topic
**Severita:** ALTA | **Complessita:** Media

### Problema
Quando l'utente e dentro un topic e sta leggendo i messaggi, riceve comunque incrementi di `unread_count` e notifiche push. Il `markTopicAsRead()` viene chiamato solo al mount del componente, non quando arrivano nuovi messaggi.

### File coinvolti
- `components/organisms/community/topic-chat.tsx` (fix principale)
- `app/actions/topic-messages.ts` (markTopicAsRead - gia corretto)
- `supabase/migrations/00030_topics_system.sql` (trigger - esclude gia autore)

### Subtask

- [ ] **1.1** Chiamare `markTopicAsRead()` quando arriva un nuovo messaggio E l'utente e vicino al fondo
  - In `topic-chat.tsx`, nel callback `onNewMessage` di `useTopicMessages()`
  - Condizione: `isNearBottomRef.current === true`
  - Se non e vicino al fondo → non chiamare (utente sta leggendo messaggi vecchi)

- [ ] **1.2** Chiamare `markTopicAsRead()` quando l'utente scrolla verso il fondo
  - Nel handler `handleScroll()` di topic-chat.tsx
  - Condizione: `isAtBottom === true` (scrollHeight - scrollTop - clientHeight < 100)
  - Debounce: evitare chiamate eccessive (max 1 ogni 2 secondi)

- [ ] **1.3** Chiamare `markTopicAsRead()` dopo che l'utente invia un messaggio
  - In `handleSendMessage()` dopo il `sendTopicMessage()` con successo
  - L'utente che invia ha sicuramente letto tutto fino a quel punto

- [ ] **1.4** Aggiungere debounce al markTopicAsRead
  - Creare ref `lastMarkAsReadRef` con timestamp dell'ultima chiamata
  - Ignorare chiamate se < 2000ms dall'ultima
  - Evita flood di server action calls durante scroll rapido

- [ ] **1.5** Verificare che l'unread badge nella sidebar si aggiorni correttamente
  - Testare: entrare in topic → ricevere messaggio → badge NON deve apparire
  - Testare: essere in altro topic → ricevere messaggio → badge DEVE apparire
  - Testare: scrollare in alto nel topic → ricevere messaggio → badge deve apparire (non vicino al fondo)

---

## TASK 2: Fix Auto-membership per nuovi topics
**Severita:** ALTA | **Complessita:** Bassa

### Problema
Quando un admin crea un nuovo topic, solo il creator viene aggiunto come membro. Gli utenti che soddisfano i requisiti di visibilita NON vengono aggiunti automaticamente. La funzione `syncTopicMembershipForNewTopic()` esiste gia in `lib/topics/auto-membership.ts` ma non viene mai chiamata.

### File coinvolti
- `app/actions/topics.ts` - `createTopic()` (fix principale)
- `lib/topics/auto-membership.ts` - `syncTopicMembershipForNewTopic()` (gia implementata)

### Subtask

- [ ] **2.1** Aggiungere chiamata a `syncTopicMembershipForNewTopic()` in `createTopic()`
  - Dopo l'aggiunta del creator come admin (riga ~281)
  - Prima del `revalidatePath()`
  - Import dinamico: `const { syncTopicMembershipForNewTopic } = await import('@/lib/topics/auto-membership')`
  - Chiamata: `await syncTopicMembershipForNewTopic(topic.id, userData.tenant_id, visibility)`

- [ ] **2.2** Gestire errori della sync senza bloccare la creazione
  - La sync auto-membership NON deve far fallire la creazione del topic
  - Wrap in try/catch con `console.error()` se fallisce
  - Il topic resta creato, gli utenti possono comunque essere aggiunti manualmente

- [ ] **2.3** Verificare la logica di `syncTopicMembershipForNewTopic()`
  - Confermare che i mapping sono corretti:
    - `public/authenticated/verified` → tutti gli utenti verificati come `writer`
    - `board_only` → membri comitato come `writer`
    - `admins_only` → admin/super_admin come `admin`
    - `members_only` → nessuno (selezione manuale)
  - Confermare che non duplica il creator (gia inserito come admin)

- [ ] **2.4** Test end-to-end
  - Creare topic con visibility `verified` → verificare che tutti gli utenti approvati siano membri
  - Creare topic con visibility `members_only` → verificare che solo il creator sia membro
  - Creare topic con visibility `admins_only` → verificare che tutti gli admin siano membri
  - Controllare member_count nel topic dopo creazione

---

## TASK 3: Fix Modifica messaggio (UX - prompt del browser)
**Severita:** ALTA | **Complessita:** Bassa

### Problema
La modifica messaggio usa `window.prompt()` del browser che non supporta multilinea ed e un'esperienza pessima.

### File coinvolti
- `components/organisms/community/topic-chat.tsx`
- `components/organisms/community/chat-message.tsx`

### Subtask

- [ ] **3.1** Creare stato per inline editing in `topic-chat.tsx`
  - Nuovo state: `editingMessage: { id: string, content: string } | null`
  - Handler `handleStartEdit(messageId, currentContent)` → setta stato
  - Handler `handleSaveEdit(messageId, newContent)` → chiama `editTopicMessage()` + reset stato
  - Handler `handleCancelEdit()` → reset stato

- [ ] **3.2** Modificare `ChatMessage` per supportare inline edit mode
  - Prop: `isEditing?: boolean`, `editContent?: string`, `onEditChange?`, `onEditSave?`, `onEditCancel?`
  - Se `isEditing`: il bubble mostra textarea editabile al posto del content
  - Bottoni Save (check) e Cancel (X) sotto la textarea
  - Enter per salvare, Escape per annullare
  - Auto-focus e auto-select del testo

- [ ] **3.3** Rimuovere il `window.prompt()` dal handler `onEdit`
  - Sostituire con `handleStartEdit(messageId, currentContent)`

---

## TASK 4: Fix Eliminazione messaggio (UX - confirm del browser)
**Severita:** ALTA | **Complessita:** Bassa

### Problema
L'eliminazione messaggio usa `window.confirm()` nativo. Meglio un AlertDialog di shadcn/ui con preview del messaggio.

### File coinvolti
- `components/organisms/community/topic-chat.tsx`

### Subtask

- [ ] **4.1** Creare stato per il dialog di conferma eliminazione
  - Nuovo state: `deletingMessageId: string | null`
  - Handler `handleConfirmDelete(messageId)` → apre dialog
  - Handler `handleDelete()` → chiama `deleteTopicMessage()` + chiude

- [ ] **4.2** Aggiungere AlertDialog di shadcn/ui
  - Titolo: "Elimina messaggio"
  - Body: "Sei sicuro di voler eliminare questo messaggio? L'azione non puo essere annullata."
  - Preview troncata del messaggio da eliminare
  - Bottoni: "Annulla" (outline) / "Elimina" (destructive)

- [ ] **4.3** Mostrare placeholder "Messaggio eliminato" al posto del messaggio rimosso
  - Invece di rimuovere dal DOM, mostrare testo grigio italico
  - Pattern WhatsApp: "🚫 Questo messaggio e stato eliminato"
  - Se il messaggio ha reply, mantenere il thread visivamente coerente

---

## TASK 5: Indicatore stato connessione Realtime
**Severita:** ALTA | **Complessita:** Media

### Problema
`isConnected` dal hook `useTopicMessages()` esiste ma non viene mai mostrato nell'UI. Se la connessione Realtime cade, l'utente non lo sa.

### File coinvolti
- `components/organisms/community/topic-chat.tsx`
- `components/organisms/community/chat-header.tsx`
- `hooks/use-topic-messages.ts`

### Subtask

- [ ] **5.1** Passare `isConnected` al ChatHeader
  - `topic-chat.tsx` → prop `isConnected` al `ChatHeader`

- [ ] **5.2** Mostrare banner/indicatore di disconnessione
  - Se `!isConnected`: banner giallo sotto l'header "Riconnessione in corso..."
  - Con icona WifiOff e animazione pulsante
  - Quando riconnesso: banner verde "Connesso" che scompare dopo 2s

- [ ] **5.3** Re-fetch messaggi alla riconnessione
  - Quando `isConnected` torna `true` dopo essere stato `false`
  - Fetch messaggi dal timestamp dell'ultimo messaggio ricevuto
  - Merge con array locale senza duplicati

---

## TASK 6: Compressione immagini prima dell'upload
**Severita:** MEDIA | **Complessita:** Bassa

### Problema
Le immagini vengono uploadate a dimensione originale. `browser-image-compression` e gia nelle dipendenze ma non usato per topic images.

### File coinvolti
- `components/organisms/community/chat-input.tsx`
- `app/actions/topic-messages.ts`

### Subtask

- [ ] **6.1** Integrare `browser-image-compression` prima dell'upload
  - Max width/height: 1920px
  - Max file size: 1MB (compresso)
  - Qualita: 0.8
  - Mantenere aspect ratio
  - Solo per JPEG/PNG (GIF/WebP gia ottimizzati)

- [ ] **6.2** Mostrare indicatore di compressione
  - Durante la compressione: spinner o barra di progresso
  - Dopo: mostrare dimensione originale → compressa ("2.4MB → 380KB")

---

## TASK 7: Menzioni @utente (metadata.mentions gia nello schema)
**Severita:** MEDIA | **Complessita:** Alta

### Problema
Il campo `metadata.mentions` esiste nel database schema ma il frontend non lo implementa. Nessun modo per menzionare utenti.

### File coinvolti
- `components/organisms/community/chat-input.tsx` (autocomplete)
- `components/organisms/community/chat-message.tsx` (render menzioni)
- `app/actions/topic-messages.ts` (salvare menzioni in metadata)
- `app/actions/topic-members.ts` (getTopicMembers per autocomplete)

### Subtask

- [ ] **7.1** Implementare autocomplete @menzioni nel ChatInput
  - Trigger: digitare `@` dopo uno spazio o a inizio riga
  - Dropdown con lista membri del topic (filtrata per testo dopo @)
  - Frecce su/giu per navigare, Enter/click per selezionare
  - Inserisce `@NomeUtente` nel testo

- [ ] **7.2** Estrarre menzioni dal testo prima dell'invio
  - Regex per trovare tutti i `@NomeUtente` nel contenuto
  - Risolvere nomi → userId tramite lista membri
  - Salvare in `metadata.mentions: string[]` (array di userId)

- [ ] **7.3** Renderizzare menzioni come testo evidenziato
  - In ChatMessage, trovare `@NomeUtente` e renderizzare con colore distinto (teal/blue)
  - Cliccabile → mostra profilo utente (futuro)

- [ ] **7.4** Notifica push per menzioni
  - Quando un utente viene menzionato, inviare push notification anche se topic e mutato
  - Testo: "{AuthorName} ti ha menzionato in {TopicName}"

---

## TASK 8: Markdown base nei messaggi
**Severita:** BASSA | **Complessita:** Bassa

### Problema
I messaggi sono solo testo plain. Supportare formattazione base migliora leggibilita.

### File coinvolti
- `components/organisms/community/chat-message.tsx`

### Subtask

- [ ] **8.1** Implementare parsing markdown leggero
  - **bold** (`**testo**` o `__testo__`)
  - *italic* (`*testo*` o `_testo_`)
  - `code inline` (`` `codice` ``)
  - ~~strikethrough~~ (`~~testo~~`)
  - NO: headers, liste, link (troppo complesso per chat)
  - Usare regex, non libreria esterna (keep it light)

- [ ] **8.2** Sanitizzare output
  - Escaping HTML per prevenire XSS
  - Solo i tag generati dal parser sono sicuri

---

## TASK 9: Drag & drop immagini nella chat
**Severita:** BASSA | **Complessita:** Bassa

### Problema
Le immagini si possono allegare solo tramite il bottone clip. Manca drag & drop direttamente nell'area chat.

### File coinvolti
- `components/organisms/community/topic-chat.tsx`
- `components/organisms/community/chat-input.tsx`

### Subtask

- [ ] **9.1** Aggiungere handler `onDrop` sull'area messaggi
  - `onDragOver` → mostrare overlay "Rilascia per allegare"
  - `onDrop` → estrarre file immagine dal DataTransfer
  - Validare tipo e dimensione (stesse regole del file picker)
  - Passare a ChatInput per il flusso di upload standard

- [ ] **9.2** Overlay visuale durante il drag
  - Border tratteggiato azzurro sull'area messaggi
  - Icona upload + testo "Rilascia immagini qui"
  - Nascondere quando drag esce dall'area

---

## TASK 10: Link preview (OG Cards)
**Severita:** MEDIA | **Complessita:** Media

### Problema
I link nei messaggi sono testo semplice. Mostrare anteprima con titolo, descrizione e immagine OG migliora l'esperienza.

### File coinvolti
- `app/actions/topic-messages.ts` (fetch OG metadata server-side)
- `components/organisms/community/chat-message.tsx` (render preview card)

### Subtask

- [ ] **10.1** Creare server action `fetchLinkPreview(url)`
  - Fetch HTML della pagina (con timeout 5s)
  - Estrarre: `og:title`, `og:description`, `og:image`, `og:site_name`
  - Fallback: `<title>` e `<meta name="description">`
  - Salvare in `metadata.link_previews: LinkPreview[]`
  - Cache risultati per evitare ri-fetch

- [ ] **10.2** Renderizzare link preview card sotto il messaggio
  - Card con: immagine (se presente), titolo, descrizione, dominio
  - Cliccabile → apre URL in nuova tab
  - Max 1 preview per messaggio (primo link trovato)

---

## Ordine di implementazione consigliato

| Fase | Task | Motivo |
|------|------|--------|
| **Fase 1** | Task 1 (unread fix) + Task 2 (auto-membership) | Bug critici, impatto immediato |
| **Fase 2** | Task 3 (inline edit) + Task 4 (delete dialog) | UX base, bassa complessita |
| **Fase 3** | Task 5 (connection status) + Task 6 (compressione img) | Robustezza e performance |
| **Fase 4** | Task 7 (menzioni) | Feature richiesta, alta complessita |
| **Fase 5** | Task 8 (markdown) + Task 9 (drag&drop) + Task 10 (link preview) | Polish e features avanzate |
