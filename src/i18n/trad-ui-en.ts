/**
 * TRADUCTIONS ANGLAISES — textes en dur des composants.
 * Clé = chaîne française EXACTE copiée depuis la source JSX/TSX.
 * Valeur = traduction anglaise.
 *
 * Conventions :
 * - Les clés contenant une espace insécable (entité &nbsp; dans le JSX)
 *   utilisent le caractère U+00A0 réel, écrit directement.
 * - // RECONSTITUTION : chaîne coupée en plusieurs morceaux JSX (ou sur
 *   plusieurs lignes) — la clé est la chaîne complète reconstituée
 *   (espaces de jonction normalisés en une seule espace) ; le
 *   développeur devra découper la traduction pour reconstruire le JSX.
 * - // INTERPOLATION : la clé contient un marqueur {nom} à la place de
 *   l'expression interpolée (ex. ${SITE.email} → {email}) ; conserver
 *   le marqueur {nom} à l'identique dans la traduction.
 * - Les astérisques de champ obligatoire vivent dans des <span> séparés
 *   dans la source : ils ne font pas partie des clés.
 */
export const TRAD_UI: Record<string, string> = {
  /* ============================== components/layout/Header.tsx ============================== */
  "Aller au contenu principal": "Skip to main content",
  "Stevens Akpovi — retour à l'accueil": "Stevens Akpovi — back to home",
  "Stevens Akpovi": "Stevens Akpovi",
  "Navigation principale": "Main navigation",
  "Ouvrir le menu": "Open menu",
  "Fermer le menu": "Close menu",
  "Menu de navigation": "Navigation menu",
  "Navigation plein écran — pages": "Full-screen navigation — pages",
  "Navigation plein écran — autres liens": "Full-screen navigation — other links",
  "Méthode": "Method",
  "Référencement SEO": "SEO",
  "Publicité Meta Ads": "Meta Ads Advertising",
  "Mes Réalisations": "My Work",
  "À propos": "About",
  "Contact": "Contact",
  "Mentions légales": "Legal Notice",
  "Autres Liens": "Other Links",
  // INTERPOLATION: <SITE.email> (aria-label du lien email)
  "Écrire un email à Stevens Akpovi — {email}": "Email Stevens Akpovi — {email}",
  "LinkedIn — Stevens Akpovi": "LinkedIn — Stevens Akpovi",
  "WhatsApp — Stevens Akpovi": "WhatsApp — Stevens Akpovi",

  /* ============================== components/layout/Footer.tsx ============================== */
  "Conception de Sites Web": "Website Design",
  "Services": "Services",
  "Services — pied de page": "Services — footer",
  "Professionnel": "Professional",
  "Professionnel — pied de page": "Professional — footer",
  "Portfolio": "Portfolio",
  "Votre activité mérite un site web qui travaille pour vous.": "Your business deserves a website that works for you.",
  // INTERPOLATION: <new Date().getFullYear()>
  "© Stevens Akpovi - {annee}": "© Stevens Akpovi - {annee}",

  /* ============================== components/marketing/Marketing.tsx ============================== */
  // Réassurance par défaut (découpée sur « · » à l'affichage)
  "30 minutes · Gratuit · Sans engagement": "30 minutes · Free · No commitment",

  /* ============================== components/marketing/StartProjectButton.tsx ============================== */
  "Démarrer Un Projet": "Start a Project",
  // INTERPOLATION: <label> (libellé du bouton)
  "{label} — page de demande de devis": "{label} — quote request page",

  /* ============================== components/forms/LeadForm.tsx ============================== */
  // Questions à choix unique (formulaire de devis)
  "Il n'est pas attrayant visuellement": "It doesn't look appealing",
  "Trop peu de visiteurs deviennent clients": "Too few visitors become customers",
  "Pas assez de visiteurs": "Not enough visitors",
  "Je n'ai pas encore de site web": "I don't have a website yet",
  "Problèmes techniques (bugs, lenteur, etc.)": "Technical issues (bugs, slowness, etc.)",
  "Moins de 50 000 $/mois": "Under $50,000/month",
  "50 000 – 100 000 $/mois": "$50,000 – $100,000/month",
  "100 000 – 200 000 $/mois": "$100,000 – $200,000/month",
  "200 000 – 500 000 $/mois": "$200,000 – $500,000/month",
  "Plus de 500 000 $/mois": "Over $500,000/month",
  "Dès que possible": "As soon as possible",
  "Dans les 1 à 3 prochains mois": "Within the next 1 to 3 months",
  "Dans 4 mois ou plus": "In 4 months or more",
  // Messages de validation (contrôles frontend)
  "Indiquez votre prénom.": "Please enter your first name.",
  "Indiquez votre nom.": "Please enter your last name.",
  "Indiquez une adresse email valide.": "Please enter a valid email address.",
  "Indiquez votre numéro de téléphone.": "Please enter your phone number.",
  "Choisissez la principale raison.": "Choose the main reason.",
  "Indiquez votre chiffre d'affaires mensuel.": "Please enter your monthly revenue.",
  "Indiquez votre nom complet.": "Please enter your full name.",
  "L'URL de votre site actuel est nécessaire pour l'audit.": "Your current website URL is required for the audit.",
  "Numéro de téléphone invalide.": "Invalid phone number.",
  "Indiquez le nom de votre entreprise ou activité.": "Please enter your company or business name.",
  "Indiquez comment vous m'avez découvert.": "Please tell me how you found me.",
  "Décrivez votre besoin en quelques mots (10 caractères minimum).": "Describe your need in a few words (10 characters minimum).",
  "Choisissez le service souhaité.": "Choose the service you want.",
  "Prenez quelques instants pour compléter votre message, puis renvoyez.": "Please take a few moments to complete your message, then submit again.",
  // Contenu du message de devis (composé depuis les réponses)
  // INTERPOLATION: <form.whyNow>
  "Pourquoi refaire le site maintenant : {whyNow}": "Why redesign the site now: {whyNow}",
  // INTERPOLATION: <form.revenue>
  "Chiffre d'affaires mensuel approximatif : {revenue}": "Approximate monthly revenue: {revenue}",
  // INTERPOLATION: <form.quoteTimeline>
  "Échéance envisagée : {quoteTimeline}": "Envisioned timeline: {quoteTimeline}",
  "Consentement SMS : accepté — des frais de messages et de données peuvent s'appliquer, STOP pour se désinscrire.": "SMS consent: accepted — message and data rates may apply, reply STOP to opt out.",
  "Erreur inconnue": "Unknown error",
  // Toasts de succès / échec
  "Message envoyé": "Message sent",
  "Merci ! Votre message est bien parti. Réservez maintenant votre créneau d'appel stratégique.": "Thank you! Your message has been sent. Now book your strategy call slot.",
  "Demande enregistrée": "Request received",
  "Votre demande a bien été envoyée. Un accusé de réception vous est adressé par email.": "Your request has been sent. A confirmation email is on its way to you.",
  // INTERPOLATION: <SITE.email>
  "Une erreur est survenue pendant l'envoi. Merci de réessayer ou de m'écrire directement à {email}.": "An error occurred while sending. Please try again or email me directly at {email}.",
  "Envoi impossible": "Sending failed",
  // Bloc de confirmation (devis / audit)
  "Votre demande a bien été enregistrée.": "Your request has been received.",
  "Merci pour votre confiance. Je reviens vers vous très rapidement pour préparer votre devis personnalisé.": "Thank you for your trust. I'll get back to you very soon to prepare your personalized quote.",
  "Merci pour votre confiance. Je reviens vers vous très rapidement avec les premières observations sur votre site.": "Thank you for your trust. I'll get back to you very soon with my first observations on your site.",
  "Un accusé de réception vous est adressé par email.": "A confirmation email has been sent to you.",
  "Envoyer Une Autre Demande": "Send Another Request",
  // aria-labels du formulaire
  "Formulaire de contact — laissez un message": "Contact form — leave a message",
  "Formulaire de demande de devis personnalisé": "Personalized quote request form",
  "Formulaire de demande d'audit gratuit": "Free audit request form",
  // Libellés de champs (l'astérisque est dans un <span> séparé)
  "Prénom": "First name",
  "Nom": "Last name",
  "Email professionnel": "Business email",
  "Téléphone": "Phone",
  "Email": "Email",
  "Consentement à recevoir des messages textes de Stevens Akpovi": "Consent to receive text messages from Stevens Akpovi",
  // RECONSTITUTION: texte du consentement SMS coupé sur 3 lignes dans le JSX
  "En cochant cette case, j'accepte de recevoir des messages textes de Stevens Akpovi. Des frais de messages et de données peuvent s'appliquer. Répondez STOP pour vous désinscrire.": "By checking this box, I agree to receive text messages from Stevens Akpovi. Message and data rates may apply. Reply STOP to opt out.",
  "Pourquoi voulez-vous refaire votre site web maintenant ?": "Why do you want to redesign your website now?",
  "Quel est votre chiffre d'affaires mensuel approximatif ?": "What is your approximate monthly revenue?",
  "Quand envisagez-vous de refaire votre site web ?": "When are you planning to redesign your website?",
  "Nom complet": "Full name",
  "Entreprise": "Company",
  "Votre nom et prénom": "Your first and last name",
  "+229 …": "+229 …",
  "vous@exemple.com": "you@example.com",
  "Nom de votre entreprise ou activité": "Your company or business name",
  "Comment m'avez-vous découvert ?": "How did you find me?",
  "Sélectionnez…": "Select…",
  "Comment puis-je vous aider ?": "How can I help you?",
  "Décrivez votre demande…": "Describe your request…",
  "URL de votre site actuel": "Your current website URL",
  "https://votre-site.com": "https://your-website.com",
  "Service souhaité": "Desired service",
  "— Choisir —": "— Select —",
  "Budget envisagé": "Planned budget",
  "Échéance souhaitée": "Desired timeline",
  "(optionnel)": "(optional)",
  "Votre site et vos objectifs": "Your website and your goals",
  "Indiquez l'adresse de votre site et ce qui vous préoccupe aujourd'hui…": "Enter your website address and what's concerning you today…",
  "Envoi en cours…": "Sending…",
  "Envoyer Mon Message": "Send My Message",
  "Obtenir Un Devis": "Get a Quote",
  "Envoyer Ma Demande D'Audit": "Send My Audit Request",
  // RECONSTITUTION: note de confidentialité coupée sur 2 lignes dans le JSX
  "Vos informations servent uniquement à traiter votre demande d'audit et ne sont jamais partagées.": "Your information is used only to process your audit request and is never shared.",

  /* ============================== components/pages/ContactPage.tsx ============================== */
  "Page contact": "Contact page",
  "CONTACT": "CONTACT",
  // RECONSTITUTION: coupée sur 2 lignes, contient une espace insécable avant « ? »
  "Une question, un projet, une idée ? Laissez-moi un message — je réponds personnellement à chaque demande.": "A question, a project, an idea? Leave me a message — I personally answer every request.",
  "Note moyenne de 4,9 sur 5": "Average rating of 4.9 out of 5",
  "4,9/5": "4.9/5",
  "Clients existants": "Existing clients",
  // RECONSTITUTION + INTERPOLATION: <SITE.email> dans un lien
  "Pour toute question, suivi ou précision sur un projet en cours, écrivez-moi directement à {email} — je réponds personnellement à chaque message.": "For any question, follow-up or clarification on an ongoing project, email me directly at {email} — I personally answer every message.",
  // RECONSTITUTION: « LinkedIn » et « WhatsApp » sont des liens dans le JSX
  "Vous pouvez aussi m'écrire sur LinkedIn ou WhatsApp.": "You can also message me on LinkedIn or WhatsApp.",
  "LinkedIn": "LinkedIn",
  "WhatsApp": "WhatsApp",
  "Nouveaux clients": "New clients",
  // RECONSTITUTION + INTERPOLATION: <SITE.calendlyMention.toLowerCase()> en fin de phrase
  "La première étape est de parler de votre projet. Vous pouvez demander un devis personnalisé, ou réserver un appel stratégique de 30 minutes — {calendlyMention}": "The first step is to talk about your project. You can request a personalized quote, or book a 30-minute strategy call — {calendlyMention}",
  "demander un devis personnalisé": "request a personalized quote",
  "réserver un appel stratégique de 30 minutes": "book a 30-minute strategy call",
  "Vous avez déjà un site ?": "Already have a website?",
  // RECONSTITUTION: coupée sur 4 lignes, espace insécable avant « : »
  "Décrivez-moi votre site actuel et vos objectifs dans le formulaire ci-dessous : je vous ferai part de mes premières observations concrètes — image, clarté des services, parcours de contact et référencement de base.": "Describe your current website and your goals in the form below: I'll share my first concrete observations — visuals, clarity of services, contact journey and basic SEO.",
  "Laissez-moi un message": "Leave me a message",
  "Décrivez votre besoin en quelques lignes.": "Describe your need in a few lines.",

  /* ============================== components/pages/DevisPage.tsx ============================== */
  "Attirer les bons visiteurs": "Attract the right visitors",
  "Transformer les visiteurs en clients": "Turn visitors into customers",
  "Présenter votre activité avec professionnalisme": "Present your business with professionalism",
  "Demande de devis personnalisé": "Personalized quote request",
  "DEMANDE DE DEVIS PERSONNALISÉ": "PERSONALIZED QUOTE REQUEST",
  "Optimisez Votre Site Web Pour Augmenter Vos Ventes": "Optimize Your Website to Increase Your Sales",
  // RECONSTITUTION: coupée sur 3 lignes dans le JSX
  "Je prends des sites web obsolètes et les transforme en sites web qui attirent davantage de visiteurs, transforment ces visiteurs en clients et valorisent votre image de marque.": "I take outdated websites and turn them into websites that attract more visitors, convert those visitors into customers and elevate your brand image.",
  "Formulaire de demande de devis": "Quote request form",
  // RECONSTITUTION: coupée autour du lien « Réservez un appel de 30 minutes », espace insécable avant « ? »
  "Vous préférez commencer par une conversation ? Réservez un appel de 30 minutes — gratuit et sans engagement.": "Prefer to start with a conversation? Book a 30-minute call — free and with no commitment.",
  "Réservez un appel de 30 minutes": "Book a 30-minute call",

  /* VOLET 20 (26/11/2026) — pages de devis DÉDIÉES par service
     (Référencement SEO, Publicité Meta Ads) : sur-titres, titres,
     introductions et bénéfices. Le variant « site » reprend les
     clés historiques ci-dessus. */
  "DEMANDE DE DEVIS — RÉFÉRENCEMENT SEO": "QUOTE REQUEST — SEO",
  "DEMANDE DE DEVIS — PUBLICITÉ META ADS": "QUOTE REQUEST — META ADS ADVERTISING",
  "Gagnez En Visibilité Sur Google Pour Attirer Plus De Clients": "Gain Visibility On Google To Attract More Clients",
  "Attirer Plus De Clients": "Attract More Clients",
  "Transformez Facebook Et Instagram En Sources De Clients": "Turn Facebook And Instagram Into Client Sources",
  "Sources De Clients": "Client Sources",
  "Je positionne votre site sur Google pour qu'il attire durablement les visiteurs les plus susceptibles de devenir vos clients — sans dépendre de la publicité.": "I position your website on Google so it durably attracts the visitors most likely to become your customers — without depending on advertising.",
  "Je conçois et pilote vos campagnes publicitaires Facebook et Instagram pour toucher les bonnes personnes, avec un message clair et des objectifs de vente précis.": "I design and manage your Facebook and Instagram advertising campaigns to reach the right people, with a clear message and precise sales goals.",
  "Apparaître sur les recherches de vos clients": "Show up when your customers search",
  "Attirer des visiteurs qualifiés, pas seulement du trafic": "Attract qualified visitors, not just traffic",
  "Construire une visibilité qui dure, sans publicité": "Build lasting visibility, without advertising",
  "Toucher exactement vos clients idéaux": "Reach exactly your ideal customers",
  "Des campagnes pensées pour générer des ventes": "Campaigns designed to generate sales",
  "Un pilotage clair : budget, résultats, prochaines étapes": "Clear management: budget, results, next steps",

  /* ============================== components/forms/LeadForm.tsx (VOLET 20 — devis par service) ============================== */
  "Service souhaité : {service}": "Desired service: {service}",
  "Pourquoi maintenant : {whyNow}": "Why now: {whyNow}",
  "Pourquoi souhaitez-vous améliorer votre référencement maintenant ?": "Why do you want to improve your SEO now?",
  "Quand envisagez-vous de démarrer votre référencement ?": "When are you planning to start your SEO?",
  "Pourquoi souhaitez-vous lancer des publicités maintenant ?": "Why do you want to launch advertising now?",
  "Quand envisagez-vous de lancer vos campagnes ?": "When are you planning to launch your campaigns?",
  "Mon site n'apparaît pas sur Google": "My website doesn't show up on Google",
  "Je veux plus de visiteurs sans dépendre de la publicité": "I want more visitors without depending on advertising",
  "Je veux devancer mes concurrents sur Google": "I want to outrank my competitors on Google",
  "Mon trafic a baissé avec le temps": "My traffic has declined over time",
  "Je veux attirer des clients rapidement": "I want to attract customers quickly",
  "Mes publications n'atteignent pas assez de monde": "My posts don't reach enough people",
  "Je veux vendre mes produits sur Facebook et Instagram": "I want to sell my products on Facebook and Instagram",
  "Mes publicités actuelles ne rapportent pas assez": "My current ads aren't paying off enough",

  /* ============================== components/pages/AuditPage.tsx ============================== */
  "Un regard professionnel et indépendant sur votre site": "A professional, independent look at your website",
  "Des points concrets à améliorer, expliqués simplement": "Concrete improvements to make, explained simply",
  "Entièrement gratuit, sans aucun engagement": "Entirely free, with no commitment whatsoever",
  "Demande d'audit gratuit de votre site web": "Free website audit request",
  "DEMANDE D'AUDIT GRATUIT": "FREE AUDIT REQUEST",
  "Découvrez Pourquoi Votre Site Ne Vous Apporte Pas Assez De Clients.": "Find Out Why Your Website Isn't Bringing You Enough Customers.",
  // RECONSTITUTION: coupée sur 3 lignes dans le JSX
  "J'examine personnellement votre site actuel et je vous renvoie des observations claires : ce qui fonctionne déjà, ce qui freine vos visiteurs, et ce qu'il faut améliorer en priorité.": "I personally review your current website and send you back clear observations: what already works, what's holding your visitors back, and what to improve first.",
  "Formulaire de demande d'audit": "Audit request form",
  // RECONSTITUTION: coupée autour du lien « Réservez un appel de 30 minutes », espace insécable avant « ? »
  "Vous préférez en parler de vive voix ? Réservez un appel de 30 minutes — gratuit et sans engagement.": "Prefer to talk it through? Book a 30-minute call — free and with no commitment.",

  /* ============================== components/pages/CallBookingPage.tsx ============================== */
  "APPEL STRATÉGIQUE · 30 MINUTES": "STRATEGY CALL · 30 MINUTES",
  "Réservez votre créneau en une minute.": "Book your slot in one minute.",
  // RECONSTITUTION: coupée sur 3 lignes dans le JSX
  "Les créneaux affichés ci-contre sont les vraies disponibilités du calendrier. Choisissez simplement l'heure qui vous convient — l'appel se déroule en visioconférence, à distance.": "The slots shown alongside are the calendar's real availability. Simply choose the time that suits you — the call takes place by video conference, remotely.",
  // RECONSTITUTION + INTERPOLATION: <SITE.calendlyMention> dans un <strong> en tête
  "{calendlyMention} Vous recevez automatiquement le lien de visioconférence après réservation, fourni par Calendly.": "{calendlyMention} You'll automatically receive the video conference link after booking, provided by Calendly.",
  "Parler de votre activité et de vos objectifs": "Talk about your business and your goals",
  "Identifier la solution adaptée à votre besoin": "Identify the solution that fits your needs",
  "Repartir avec des prochaines étapes claires": "Walk away with clear next steps",

  /* ============================== components/pages/MetaAdsPage.tsx ============================== */
  "Objectifs de campagne": "Campaign objectives",
  "Chaque campagne est structurée autour d'un objectif précis : faire connaître votre activité, générer des demandes ou guider vers une offre.": "Every campaign is structured around a specific objective: raising awareness of your business, generating inquiries or driving traffic to an offer.",
  "Ciblage de l'audience": "Audience targeting",
  "Vos publicités sont présentées aux personnes les plus susceptibles d'être intéressées par vos services, sur Facebook et Instagram.": "Your ads are shown to the people most likely to be interested in your services, on Facebook and Instagram.",
  "Structure des campagnes": "Campaign structure",
  "Les campagnes sont organisées et configurées proprement, pour rester lisibles et faciles à faire évoluer avec votre activité.": "Campaigns are organized and set up cleanly, so they stay readable and easy to scale with your business.",
  "Suivi des résultats": "Results tracking",
  "Les performances sont suivies et les campagnes ajustées, pour que votre budget publicitaire travaille pour vos objectifs.": "Performance is tracked and campaigns adjusted, so your ad budget works toward your goals.",
  "Compréhension de l'objectif": "Understanding the objective",
  "Je définis ce que la publicité doit apporter à votre activité : visibilité, demandes, promotion d'une offre.": "I define what advertising should bring to your business: visibility, inquiries, promotion of an offer.",
  "Définition des audiences": "Defining audiences",
  "J'identifie les audiences à toucher, en cohérence avec vos clients réels et votre marché.": "I identify the audiences to reach, in line with your real customers and your market.",
  "Mise en place des campagnes": "Setting up campaigns",
  "Les campagnes sont créées et structurées autour de vos objectifs, prêtes à diffuser votre message.": "Campaigns are created and structured around your objectives, ready to broadcast your message.",
  "Suivi et ajustements": "Tracking and adjustments",
  "Les résultats sont observés et les campagnes ajustées pour accompagner l'évolution de votre activité.": "Results are monitored and campaigns adjusted to support your business as it evolves.",
  "PUBLICITÉ · META ADS": "ADVERTISING · META ADS",
  "Meta Ads : faites connaître votre activité sur Facebook et Instagram.": "Meta Ads: get your business known on Facebook and Instagram.",
  "Développez votre présence sur Facebook et Instagram grâce à des campagnes publicitaires ciblées et structurées autour de vos objectifs — le complément naturel d'un site web pensé pour convertir.": "Grow your presence on Facebook and Instagram with targeted ad campaigns structured around your objectives — the natural complement to a website built to convert.",
  "Ce que comprennent vos campagnes publicitaires": "What your ad campaigns include",
  "CAMPAGNES CIBLÉES ET STRUCTURÉES": "TARGETED AND STRUCTURED CAMPAIGNS",
  "Ce que comprennent vos campagnes.": "What your campaigns include.",
  "Plateformes couvertes :": "Platforms covered:",
  "Facebook": "Facebook",
  "Instagram": "Instagram",
  "SEO ou Meta Ads : deux leviers de visibilité": "SEO or Meta Ads: two visibility levers",
  "VOTRE SITE EST PRÊT. MAINTENANT, FAISONS-LE CONNAÎTRE.": "YOUR WEBSITE IS READY. NOW LET'S MAKE IT KNOWN.",
  "Deux leviers de visibilité, au service du même objectif.": "Two visibility levers, serving the same goal.",
  // RECONSTITUTION: coupée sur 3 lignes dans le JSX
  "Une visibilité qui ne dépend pas de la publicité : votre site gagne en positionnement sur les recherches de vos futurs clients et continue de travailler pour vous sur la durée.": "Visibility that doesn't depend on advertising: your website climbs the search results your future customers use and keeps working for you over time.",
  "Découvrir le Référencement SEO": "Discover SEO",
  // RECONSTITUTION: coupée sur 3 lignes dans le JSX
  "Une visibilité ciblée sur Facebook et Instagram : vos campagnes présentent votre activité aux personnes les plus susceptibles d'être intéressées, avec un suivi des résultats.": "Targeted visibility on Facebook and Instagram: your campaigns introduce your business to the people most likely to be interested, with results tracking.",
  "Vous êtes sur la bonne page": "You're on the right page",
  "Comment je travaille vos campagnes publicitaires": "How I run your ad campaigns",
  "MA MÉTHODE": "MY METHOD",
  "Comment je travaille vos campagnes.": "How I run your campaigns.",
  // INTERPOLATION: <String(i + 1).padStart(2, "0")>
  "Étape {num}": "Step {num}",
  "Parlons de votre publicité": "Let's talk about your advertising",
  "PARLONS DE VOTRE PUBLICITÉ": "LET'S TALK ABOUT YOUR ADVERTISING",
  "Votre activité mérite d'être connue.": "Your business deserves to be known.",

  /* ============================== components/pages/SeoPage.tsx ============================== */
  "Audit de votre présence actuelle": "Audit of your current presence",
  "J'analyse votre site tel que les moteurs de recherche le comprennent : structure, titres, descriptions, images et éléments techniques de base.": "I analyze your website the way search engines understand it: structure, titles, descriptions, images and basic technical elements.",
  "Recherche de mots-clés": "Keyword research",
  "J'identifie les recherches réellement utilisées par vos futurs clients lorsqu'ils cherchent vos prestations.": "I identify the searches your future customers actually use when looking for your services.",
  "Optimisation des pages": "Page optimization",
  "Titres, descriptions, structure des contenus et images sont retravaillés pour faciliter la compréhension de votre site par les moteurs de recherche.": "Titles, descriptions, content structure and images are reworked to make your website easier for search engines to understand.",
  "Contenus orientés référencement": "SEO-driven content",
  "Les textes sont rédigés ou ajustés pour répondre aux questions de vos visiteurs et renforcer votre pertinence sur vos sujets clés.": "Copy is written or adjusted to answer your visitors' questions and strengthen your relevance on your key topics.",
  "Le référencement se construit dans la durée : les résultats sont suivis et les actions ajustées en fonction de votre marché.": "SEO is built over time: results are tracked and actions adjusted based on your market.",
  "Audit initial": "Initial audit",
  "État des lieux de votre site et de sa visibilité actuelle, et définition des priorités.": "A review of your website and its current visibility, plus defining priorities.",
  "Stratégie de référencement": "SEO strategy",
  "Choix des mots-clés et des pages à travailler, adaptés à votre marché et à vos objectifs.": "Selecting the keywords and pages to work on, tailored to your market and objectives.",
  "Mise en œuvre": "Implementation",
  "Optimisation technique et éditoriale de vos pages, dans la continuité de votre activité.": "Technical and editorial optimization of your pages, in line with your business.",
  "Suivi durable": "Ongoing tracking",
  "Accompagnement dans la durée : lecture des résultats et ajustements réguliers.": "Long-term support: reading results and making regular adjustments.",
  "RÉFÉRENCEMENT · SEO": "SEARCH · SEO",
  "Référencement SEO : être trouvé par ceux qui vous cherchent.": "SEO: be found by the people looking for you.",
  "Améliorez votre positionnement sur Google, renforcez votre visibilité et attirez des visiteurs sur la durée, sans dépendre de la publicité, grâce à une stratégie de référencement adaptée à votre marché.": "Improve your Google rankings, strengthen your visibility and attract visitors over time, without depending on advertising, with an SEO strategy tailored to your market.",
  "Ce que comprend une stratégie de référencement": "What an SEO strategy includes",
  "RÉFÉRENCEMENT APPROFONDI": "ADVANCED SEO",
  "Ce que comprend une stratégie de référencement.": "What an SEO strategy includes.",
  "SEO de base et référencement approfondi": "Basic SEO and advanced SEO",
  "DEUX NIVEAUX, UNE MÊME EXIGENCE": "TWO LEVELS, THE SAME STANDARD",
  "SEO de base ou référencement approfondi ?": "Basic SEO or advanced SEO?",
  "Optimisation SEO de base — incluse": "Basic SEO optimization — included",
  // RECONSTITUTION: coupée sur 3 lignes dans le JSX
  "Chaque site que je conçois est livré avec les optimisations essentielles : titres, descriptions, structure, images et éléments techniques de base. C'est le socle — sans facturation supplémentaire.": "Every website I design is delivered with the essential optimizations: titles, descriptions, structure, images and basic technical elements. That's the foundation — at no extra charge.",
  "Référencement approfondi — prestation dédiée": "Advanced SEO — a dedicated service",
  // RECONSTITUTION: coupée sur 4 lignes dans le JSX
  "Au-delà du socle : une stratégie de référencement complète, adaptée à votre marché, pour améliorer votre positionnement sur Google et attirer des visiteurs sur la durée, sans dépendre de la publicité. C'est le cœur de cette page.": "Beyond the foundation: a complete SEO strategy, tailored to your market, to improve your Google rankings and attract visitors over time, without depending on advertising. That's the heart of this page.",
  "Référencement international SEO": "International SEO",
  "RÉFÉRENCEMENT INTERNATIONAL SEO": "INTERNATIONAL SEO",
  "Une visibilité au-delà de vos frontières.": "Visibility beyond your borders.",
  // RECONSTITUTION: coupée sur 4 lignes dans le JSX
  "Vous visez des clients dans plusieurs pays ou plusieurs langues ? Le référencement international adapte votre présence à chaque marché : contenus adaptés à chaque audience, structure pensée pour les recherches locales et cohérence de votre image professionnelle d'un pays à l'autre.": "Targeting customers in several countries or several languages? International SEO adapts your presence to each market: content tailored to each audience, a structure designed for local searches, and consistency of your professional image from one country to another.",
  "Discuter De Mon Projet International": "Discuss My International Project",
  "Concrètement, pour votre activité": "In concrete terms, for your business",
  "Des contenus pensés pour chaque langue et chaque audience visée.": "Content designed for each language and each target audience.",
  "Une structure de site qui facilite la compréhension par les moteurs de recherche, marché après marché.": "A website structure that makes it easy for search engines to understand your site, market after market.",
  "Une stratégie cohérente avec votre positionnement de professionnel indépendant.": "A strategy consistent with your positioning as an independent professional.",
  "Un accompagnement à distance, au-delà des frontières.": "Remote support, beyond borders.",
  "Comment je travaille le référencement": "How I run your SEO",
  "Comment je travaille votre référencement.": "How I run your SEO.",
  "Vous préférez une visibilité immédiate ? Publicité Meta Ads": "Prefer immediate visibility? Meta Ads Advertising",
  "Parlons de votre visibilité": "Let's talk about your visibility",
  "PARLONS DE VOTRE VISIBILITÉ": "LET'S TALK ABOUT YOUR VISIBILITY",
  "Votre site mérite d'être trouvé.": "Your website deserves to be found.",

  /* ============================== components/pages/AboutPage.tsx ============================== */
  "QUI SUIS-JE ? · CONCEPTEUR DE SITES WEB": "WHO AM I? · WEBSITE DESIGNER",
  "Concepteur de sites web professionnels orientés conversion. Stratégie, design et parcours de décision — au service de votre activité.": "Designer of conversion-focused professional websites. Strategy, design and decision journeys — in service of your business.",
  "Me Contacter": "Contact Me",
  "Portrait professionnel de Stevens Akpovi, concepteur de sites web professionnels": "Professional portrait of Stevens Akpovi, professional website designer",
  "Espace de travail de Stevens Akpovi — conception de sites web professionnels": "Stevens Akpovi's workspace — professional website design",
  "Une conviction simple.": "A simple conviction.",
  "Faisons connaissance — 30 minutes suffisent pour commencer.": "Let's get to know each other — 30 minutes is all it takes to get started.",
  // INTERPOLATION: <String(i + 1).padStart(2, "0")>
  "Pilier {num}": "Pillar {num}",
  "QUESTIONS FRÉQUENTES": "FREQUENT QUESTIONS",

  /* ============================== components/pages/ProcessPage.tsx ============================== */
  "Processus": "Process",
  "Des sites web qui transforment vos visiteurs en clients.": "Websites that turn your visitors into customers.",
  "Réserver un appel stratégique de 30 minutes avec Stevens Akpovi": "Book a 30-minute strategy call with Stevens Akpovi",
  "Offre : site web professionnel, page de vente et refonte de site web": "Offer: professional website, sales page and website redesign",
  "DES SITES WEB QUI VENDENT": "WEBSITES THAT SELL",
  "Voici comment je crée des sites web qui génèrent des ventes.": "Here's how I create websites that generate sales.",
  // RECONSTITUTION: coupée sur 2 lignes dans le JSX
  "Chaque projet suit la même exigence : comprendre votre activité, concevoir un parcours clair et amener vos visiteurs à passer à l'action.": "Every project follows the same standard: understand your business, design a clear journey, and lead your visitors to take action.",
  "Voir Comment Je Travaille — la méthode de collaboration, étape par étape": "See How I Work — the collaboration method, step by step",
  "Voir Comment Je Travaille": "See How I Work",
  "Comment Je Travaille": "How I Work",
  "Sites web que j'ai créés — mes réalisations": "Websites I've created — my work",
  "MES RÉALISATIONS": "MY WORK",
  "Sites web que j'ai créés.": "Websites I've created.",
  "Voir Plus De Projets": "See More Projects",
  "PARLONS DE VOTRE PROJET": "LET'S TALK ABOUT YOUR PROJECT",
  "Franchissons ensemble la première étape.": "Let's take the first step together.",

  /* ============================== components/pages/ProjectPage.tsx ============================== */
  // INTERPOLATION: <String(index + 1).padStart(2, "0")>
  "PROJETS RÉALISÉS · PROJET {num}": "COMPLETED PROJECTS · PROJECT {num}",
  // INTERPOLATION: <project.cta> et <project.name>
  "{cta} — {name} (nouvel onglet)": "{cta} — {name} (opens in a new tab)",
  "LE SITE": "THE WEBSITE",
  "Le site, tel qu'il est en ligne.": "The website, exactly as it is live.",
  // RECONSTITUTION + INTERPOLATION: <project.category> en tête de paragraphe
  "{category}. Voici les aperçus de la version publiée — l'aperçu bureau et l'aperçu mobile, côte à côte.": "{category}. Here are the previews of the published version — the desktop preview and the mobile preview, side by side.",
  // INTERPOLATION: <project.name>
  "Aperçu desktop du site {name}": "Desktop preview of the {name} website",
  // INTERPOLATION: <project.name>
  "Aperçu mobile du site {name}": "Mobile preview of the {name} website",
  "PROJETS RÉALISÉS": "COMPLETED PROJECTS",
  "Découvrez les autres réalisations.": "Discover the other projects.",
  "IL EST TEMPS DE DONNER UNE NOUVELLE DIMENSION À VOTRE ACTIVITÉ": "IT'S TIME TO TAKE YOUR BUSINESS TO A NEW LEVEL",
  "Votre projet peut être la prochaine réalisation.": "Your project could be the next one.",
  // INTERPOLATION: <SITE.calendlyMention>
  "Réserver un appel de 30 minutes sur Calendly — {calendlyMention}": "Book a 30-minute call on Calendly — {calendlyMention}",

  /* ============================== components/pages/PortfolioPage.tsx ============================== */
  "PROJETS RÉALISÉS · EXPÉRIENCES DIGITALES": "COMPLETED PROJECTS · DIGITAL EXPERIENCES",
  "Discuter De Mon Projet": "Discuss My Project",
  "Réalisations de Stevens Akpovi": "Stevens Akpovi's work",
  "Voir Le Projet": "View the Project",
  // INTERPOLATION: <project.name>
  "Voir Le Projet — {name}": "View the Project — {name}",
  // INTERPOLATION: <project.name>
  "Aperçu du site {name} — Voir Le Projet": "Preview of the {name} website — View the Project",
  // INTERPOLATION: <project.name>
  "Aperçu du site {name}": "Preview of the {name} website",

  /* ============================== components/pages/LegalPage.tsx ============================== */
  "Éditeur du site": "Website publisher",
  // RECONSTITUTION: « Stevens Akpovi » est dans un <strong>
  "Le présent site est édité et exploité par Stevens Akpovi, concepteur de sites web professionnels, exerçant à distance.": "This website is published and operated by Stevens Akpovi, a professional website designer working remotely.",
  "Adresse email :": "Email address:",
  "LinkedIn :": "LinkedIn:",
  // RECONSTITUTION: coupée sur 2 lignes dans le JSX
  "WhatsApp : disponible via le lien de contact du site (le numéro n'est pas affiché en clair).": "WhatsApp: available via the site's contact link (the number is not displayed in plain text).",
  // INTERPOLATION: <SITE.legalRegistration>
  "Numéro d'enregistrement / identifiant professionnel : {legalRegistration}": "Registration number / professional ID: {legalRegistration}",
  "Pays d'exercice : Bénin — collaboration à distance, au-delà des frontières.": "Country of business: Benin — remote collaboration, beyond borders.",
  "Hébergement": "Hosting",
  // RECONSTITUTION + INTERPOLATION: <SITE.host.name> (strong) et <SITE.host.address>
  "Le site est une application Next.js hébergée en production sur la plateforme Vercel. Hébergeur : {hostName} — {hostAddress} — vercel.com": "This site is a Next.js application hosted in production on the Vercel platform. Host: {hostName} — {hostAddress} — vercel.com",
  "Propriété intellectuelle": "Intellectual property",
  // RECONSTITUTION: coupée sur 5 lignes dans le JSX
  "L'ensemble des contenus présents sur ce site — textes, identité visuelle, composition, illustrations, portraits et code — est protégé. Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation écrite préalable est interdite. Les réalisations présentées dans la section Réalisations demeurent la propriété de leurs titulaires respectifs et sont présentées à titre de références professionnelles.": "All content on this website — text, visual identity, layout, illustrations, portraits and code — is protected. Any reproduction, representation or use, in whole or in part, without prior written authorization is prohibited. The projects featured in the Work section remain the property of their respective owners and are presented as professional references.",
  "Données personnelles (RGPD)": "Personal data (GDPR)",
  // RECONSTITUTION: coupée sur 3 lignes dans le JSX
  "Les formulaires de demande (devis, audit gratuit) collectent uniquement les informations strictement nécessaires au traitement de votre demande : nom, adresse email, éventuellement téléphone, site web concerné et contenu de votre message.": "The request forms (quote, free audit) collect only the information strictly necessary to process your request: name, email address, possibly phone number, the website concerned and the content of your message.",
  // RECONSTITUTION: « Finalité : » est dans un <strong>
  "Finalité : réponse à votre demande commerciale et suivi de projet.": "Purpose: responding to your business request and project follow-up.",
  // RECONSTITUTION + INTERPOLATION: « Destinataire : » dans un <strong>, <SITE.email> entre parenthèses
  "Destinataire : Stevens Akpovi ({email}). Aucune donnée n'est vendue, louée ou partagée à des tiers.": "Recipient: Stevens Akpovi ({email}). No data is sold, rented or shared with third parties.",
  // RECONSTITUTION: « Durée de conservation : » est dans un <strong>
  "Durée de conservation : le temps nécessaire au traitement de la demande, puis archivage selon la durée légale applicable.": "Retention period: the time needed to process the request, then archived in accordance with the applicable legal period.",
  // RECONSTITUTION + INTERPOLATION: « Vos droits : » dans un <strong>, <SITE.email> en fin
  "Vos droits : accès, rectification, effacement et opposition — exerçables par email à {email}.": "Your rights: access, rectification, erasure and objection — which can be exercised by email at {email}.",
  // RECONSTITUTION: coupée sur 3 lignes dans le JSX
  "La réservation de rendez-vous s'effectue via Calendly : les données saisies sur cette plateforme relèvent de la politique de confidentialité de Calendly, disponible sur son site officiel.": "Appointment booking is handled through Calendly: data entered on that platform is governed by Calendly's privacy policy, available on its official website.",
  "Cookies": "Cookies",
  // RECONSTITUTION: coupée sur 5 lignes dans le JSX
  "Ce site n'utilise pas de cookies publicitaires ni de traceurs tiers à des fins de profilage. Seuls les échanges techniques indispensables au fonctionnement (session administrateur, soumission de formulaires) peuvent déposer des données éphémères. L'outil Calendly, intégré pour la réservation, est susceptible de déposer ses propres cookies conformément à sa politique.": "This website uses no advertising cookies or third-party trackers for profiling purposes. Only the technical exchanges essential to its operation (admin session, form submission) may store ephemeral data. Calendly, integrated for booking, may deposit its own cookies in accordance with its policy.",
  "Responsabilité": "Liability",
  // RECONSTITUTION: coupée sur 5 lignes dans le JSX
  "Les informations diffusées sur ce site sont fournies à titre de présentation professionnelle. Stevens Akpovi s'efforce d'en garantir l'exactitude sans pouvoir garantir l'absence d'erreur ou d'omission. Les liens externes proposés (réalisations, réseaux professionnels) renvoient vers des sites tiers dont le contenu n'engage pas l'éditeur du présent site.": "The information published on this website is provided for professional presentation purposes. Stevens Akpovi strives to ensure its accuracy but cannot guarantee it is free of errors or omissions. The external links provided (portfolio, professional networks) lead to third-party sites whose content does not bind the publisher of this site.",
  "INFORMATIONS LÉGALES": "LEGAL INFORMATION",
  "Éditeur, hébergement, propriété intellectuelle, données personnelles et cookies.": "Publisher, hosting, intellectual property, personal data and cookies.",
  "Dernière mise à jour : novembre 2026": "Last updated: November 2026",

  /* ============================== components/home/MarqueeBand.tsx ============================== */
  "Création De Sites Web": "Website Creation",
  "Sites Web Qui Génèrent Des Ventes": "Websites That Drive Sales",
  "Rédaction Professionnelle Incluse": "Professional Copywriting Included",
  "Attirer Les Bons Visiteurs": "Attract The Right Visitors",
  "Design Premium": "Premium Design",
  "Site Vitrine Professionnel": "Professional Business Website",
  "Page De Vente": "Sales Page",
  "Refonte De Site Web": "Website Redesign",
  "Transformer Les Visiteurs En Clients": "Turn Visitors Into Customers",
  "Présence Professionnelle En Ligne": "Professional Online Presence",
  "Expertises de Stevens Akpovi — création de sites web, rédaction professionnelle, référencement SEO, publicité": "Stevens Akpovi's expertise — website design, professional copywriting, SEO, advertising",

  /* ============================== components/home/FaqFinal.tsx ============================== */
  "Une question spécifique ? Prenons 30 minutes pour en discuter.": "A specific question? Let's take 30 minutes to discuss it.",
  "30 minutes · Gratuit · Sans engagement.": "30 minutes · Free · No commitment.",
  "Réserver Un Appel — 30 minutes, gratuit et sans engagement": "Book a Call — 30 minutes, free and with no commitment",

  /* ============================== components/home/HomePage.tsx ============================== */
  "À qui s'adressent les services de Stevens Akpovi": "Who Stevens Akpovi's services are for",

  /* ============================== components/calendly/CalendlyContext.tsx ============================== */
  "Calendly — Réservation d'un appel de 30 minutes avec Stevens Akpovi": "Calendly — Book a 30-minute call with Stevens Akpovi",
  "Réserver un appel de 30 minutes avec Stevens Akpovi": "Book a 30-minute call with Stevens Akpovi",
  "Appel découverte": "Discovery call",
  "Réservez votre créneau": "Book your slot",
  // RECONSTITUTION + INTERPOLATION: <SITE.calendlyMention> en tête, texte coupé sur 2 lignes
  "{calendlyMention} Les disponibilités affichées sont les vraies disponibilités de Calendly.": "{calendlyMention} The time slots shown are Calendly's real availability.",
  "Fermer la fenêtre de réservation": "Close the booking window",

/* ============================== lib/validation.ts (options des select + messages) ============================== */
/* Les VALEURS des options restent françaises dans les enregistrements
   (schéma zod inchangé) — seule l'AFFICHAGE est traduit. */
  "Site vitrine professionnel": "Professional showcase website",
  "Site web multipages": "Multi-page website",
  "Landing page (une page, une action précise)": "Landing page (one page, one clear action)",
  "Système d'acquisition client (plusieurs pages et parcours)": "Client acquisition system (multiple pages and journeys)",
  "Autre / je ne sais pas encore": "Other / I'm not sure yet",
  "Bouche à oreille": "Word of mouth",
  "Autre": "Other",
  "À définir ensemble": "To be defined together",
  "Moins de 150 000 FCFA": "Under 150,000 FCFA",
  "150 000 – 400 000 FCFA": "150,000 – 400,000 FCFA",
  "400 000 – 900 000 FCFA": "400,000 – 900,000 FCFA",
  "Plus de 900 000 FCFA": "Over 900,000 FCFA",
  "Dans le mois": "Within a month",
  "Dans 2 à 3 mois": "In 2 to 3 months",
  "Plus tard, je m'informe": "Later, just exploring",
  "Adresse email invalide": "Invalid email address",
  "Requête refusée": "Request denied",
  "L'URL de votre site actuel est nécessaire pour l'audit": "Your current website URL is required for the audit",
  "Indiquez le type de service souhaité.": "Please indicate the type of service you need.",
};
