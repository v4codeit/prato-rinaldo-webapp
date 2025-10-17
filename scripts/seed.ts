import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  tenants,
  badges,
  forumCategories,
  announcements,
  events,
  articles,
} from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL non configurato");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function seed() {
  console.log("🌱 Inizio seeding del database...");

  try {
    // 1. Crea tenant di default
    const tenantId = "prato-rinaldo-default";
    console.log("📦 Creazione tenant...");
    await db.insert(tenants).values({
      id: tenantId,
      name: "Prato Rinaldo",
      slug: "prato-rinaldo",
      description: "Comitato cittadini di Prato Rinaldo - Frazione tra San Cesareo e Zagarolo",
      logo: null,
      contactEmail: "info@pratorinaldo.it",
      isActive: true,
    }).onDuplicateKeyUpdate({ set: { name: "Prato Rinaldo" } });

    // 2. Crea badges
    console.log("🏆 Creazione badges...");
    const badgeData = [
      {
        id: nanoid(),
        tenantId,
        name: "Benvenuto",
        description: "Hai completato la registrazione e sei stato verificato",
        icon: "👋",
        points: 10,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Primo Post",
        description: "Hai creato il tuo primo post nel forum",
        icon: "✍️",
        points: 20,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Partecipante Attivo",
        description: "Hai partecipato a 5 eventi",
        icon: "🎉",
        points: 50,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Venditore",
        description: "Hai venduto il tuo primo oggetto nel marketplace",
        icon: "🛍️",
        points: 30,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Volontario",
        description: "Hai offerto servizi gratuiti alla comunità",
        icon: "❤️",
        points: 100,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Contributore",
        description: "Hai donato al comitato tramite il marketplace",
        icon: "💝",
        points: 75,
      },
    ];

    for (const badge of badgeData) {
      await db.insert(badges).values(badge);
    }

    // 3. Crea categorie forum
    console.log("💬 Creazione categorie forum...");
    const forumCategoryData = [
      {
        id: nanoid(),
        tenantId,
        name: "Annunci Generali",
        description: "Annunci e comunicazioni importanti per la comunità",
        order: 1,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Manutenzione e Lavori",
        description: "Discussioni su manutenzione stradale, illuminazione, verde pubblico",
        order: 2,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Eventi e Iniziative",
        description: "Organizzazione eventi, feste e iniziative comunitarie",
        order: 3,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Sicurezza",
        description: "Segnalazioni e discussioni sulla sicurezza del quartiere",
        order: 4,
      },
      {
        id: nanoid(),
        tenantId,
        name: "Chiacchiere",
        description: "Discussioni libere tra residenti",
        order: 5,
      },
    ];

    for (const category of forumCategoryData) {
      await db.insert(forumCategories).values(category);
    }

    // 4. Crea annunci di esempio
    console.log("📢 Creazione annunci...");
    const dummyUserId = "system";
    const announcementData = [
      {
        id: nanoid(),
        tenantId,
        authorId: dummyUserId,
        title: "Benvenuti sulla nuova piattaforma!",
        content: "Siamo felici di presentarvi la nuova piattaforma digitale del comitato cittadini di Prato Rinaldo. Qui potrete trovare tutte le informazioni sugli eventi, partecipare alle discussioni e molto altro!",
        category: "generale",
        isPinned: true,
      },
      {
        id: nanoid(),
        tenantId,
        authorId: dummyUserId,
        title: "Prossima riunione del comitato",
        content: "La prossima riunione del comitato si terrà il 15 del mese presso la sala comunale. Tutti i residenti sono invitati a partecipare.",
        category: "riunioni",
        isPinned: false,
      },
    ];

    for (const announcement of announcementData) {
      await db.insert(announcements).values(announcement);
    }

    // 5. Crea eventi di esempio
    console.log("📅 Creazione eventi...");
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15, 18, 0);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const eventData = [
      {
        id: nanoid(),
        tenantId,
        organizerId: dummyUserId,
        title: "Festa di Primavera",
        description: "Grande festa di primavera con musica, cibo e divertimento per tutta la famiglia!",
        location: "Piazza Centrale, Prato Rinaldo",
        startDate: nextMonth,
        endDate: new Date(nextMonth.getTime() + 4 * 60 * 60 * 1000),
        isPrivate: false,
        status: "published",
        maxAttendees: 100,
        requiresPayment: false,
        price: 0,
      },
      {
        id: nanoid(),
        tenantId,
        organizerId: dummyUserId,
        title: "Assemblea Residenti",
        description: "Assemblea mensile dei residenti per discutere le questioni del quartiere",
        location: "Sala Comunale",
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000),
        isPrivate: true,
        status: "published",
        maxAttendees: 50,
        requiresPayment: false,
        price: 0,
      },
    ];

    for (const event of eventData) {
      await db.insert(events).values(event);
    }

    // 6. Crea articoli di esempio
    console.log("📰 Creazione articoli...");
    const articleData = [
      {
        id: nanoid(),
        tenantId,
        authorId: dummyUserId,
        title: "Nuovi lavori di asfaltatura in programma",
        slug: "nuovi-lavori-asfaltatura",
        excerpt: "Il comune ha approvato i lavori di rifacimento del manto stradale per via Roma",
        content: "Il comune ha finalmente approvato i lavori di rifacimento del manto stradale per via Roma. I lavori inizieranno il mese prossimo e dureranno circa 2 settimane. Durante questo periodo potrebbero esserci disagi alla circolazione.",
        status: "published",
        publishedAt: new Date(),
      },
      {
        id: nanoid(),
        tenantId,
        authorId: dummyUserId,
        title: "Successo per la raccolta fondi",
        slug: "successo-raccolta-fondi",
        excerpt: "La raccolta fondi per il parco giochi ha superato l'obiettivo",
        content: "Siamo felici di annunciare che la raccolta fondi per la realizzazione del nuovo parco giochi ha superato l'obiettivo prefissato! Grazie a tutti coloro che hanno contribuito. I lavori inizieranno a breve.",
        status: "published",
        publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const article of articleData) {
      await db.insert(articles).values(article);
    }

    console.log("✅ Seeding completato con successo!");
  } catch (error) {
    console.error("❌ Errore durante il seeding:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("🎉 Database popolato!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Errore fatale:", error);
    process.exit(1);
  });

