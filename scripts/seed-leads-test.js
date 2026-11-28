/* VOLET 31 — fausses demandes en BASE LOCALE UNIQUEMENT (db/custom.db,
 * jamais GitHub) pour tester les cartes mobiles du panneau Demandes. */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const donnees = [
    { id: "test-sonde-001", type: "quote", status: "new", name: "Aïcha DOSSOU-Hérault-Sur-Mer", email: "aicha.dossou.tres.long.adresse@email-exemple-benin.com", phone: "+229 97 88 12 45 66", company: "Cabinet Essentiel & Bio — naturopathie et bien-être au naturel", website: null, activity: "Santé naturelle", serviceType: "Site vitrine professionnel avec prise de rendez-vous", budget: "1 000 € – 2 500 €", timeline: "Dans le mois", message: "Bonjour Stevens, je cherche un site professionnel pour ma clinique de naturopathie avec possibilité de prise de rendez-vous en ligne et paiement des consultations. J'ai vu votre portfolio et votre méthode m'a convaincue — pouvez-vous m'envoyer une proposition détaillée pour un site vitrine de qualité ?", source: "#/demander-un-devis" },
    { id: "test-sonde-002", type: "audit", status: "contacted", name: "Jean-Baptiste Kouadio", email: "jb.kouadio@toilettage-canin-lome.com", phone: null, company: "Toilettage Canin de Lomé", website: "https://toilettage-canin-lome.example.com", activity: "Toilettage animalier", serviceType: null, budget: null, timeline: null, message: "Hello Stevens, I found your website on Google and I would like a free audit of my current grooming website. It loads slowly on mobile and I don't get many calls. Can you tell me what is wrong with it and how much it would cost to fix?", source: "#/audit-gratuit" },
    { id: "test-sonde-003", type: "contact", status: "won", name: "Cabinet Couvreur Pro 92", email: "contact@couvreur-pro-92-pantin.example.fr", phone: "01 84 60 12 33", company: "Couvreur Pro 92 — couverture et zinguerie", website: "https://couvreur-pro-92.example.fr", activity: "Couverture", serviceType: "Acquisition de clients (Google)", budget: "2 500 € – 5 000 €", timeline: "Dès que possible", message: "Bonjour, nous souhaitons développer notre acquisition de clients sur Google pour notre entreprise de couverture en Île-de-France. Pouvez-vous nous rappeler pour en discuter ?", source: "#/contact" },
  ];
  for (const l of donnees) {
    await db.lead.upsert({ where: { id: l.id }, update: l, create: { ...l, emailSent: false } });
  }
  const total = await db.lead.count();
  console.log("Demandes en base locale :", total);
  await db.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
