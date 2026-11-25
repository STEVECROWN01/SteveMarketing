/**
 * TRADUCTIONS ANGLAISES — contenu du site (site-content.ts + lib/site.ts).
 * Clé = chaîne française EXACTE copiée depuis la source.
 * Valeur = traduction anglaise.
 * Toute chaîne absente retombe sur le français (comportement voulu).
 *
 * Conventions :
 *  - anglais américain, copywriting marketing naturel (non littéral) ;
 *  - casse, points finaux, tirets cadratins « — » et points de suspension conservés ;
 *  - les sauts de paragraphes « \n\n » des textes sources sont conservés à l'identique ;
 *  - listes et tableaux : ordre et nombre d'éléments strictement identiques ;
 *  - l'espace typographique française avant « ? » / « : » devient la ponctuation
 *    anglaise standard (pas d'espace avant ? et :) ;
 *  - aucune clé inventée : chaque clé existe littéralement dans la source ;
 *    les chaînes volontairement non traduites sont listées en fin de fichier.
 */
export const TRAD_SITE: Record<string, string> = {
  /* ==================== CTA_LABELS (libellés canoniques) ====================
     Réutilisés par référence : HERO.ctaPrimary (appel), HERO.ctaTertiary et
     SOLUTION.cta2 (realisations), QUESTIONING.cta et FINAL_CTA.cta3 (audit),
     FINAL_CTA.cta1 (appel) / cta2 (devis) — une seule clé couvre toutes les
     occurrences, y compris PAGES.appel.label dans lib/site.ts. */
  "Réserver Un Appel": "Book A Call",
  "Demander Un Devis Personnalisé": "Request A Custom Quote",
  "Voir Mes Réalisations": "View My Portfolio",
  "Demander Mon Audit Gratuit": "Request My Free Audit",

  /* ==================== HERO ==================== */
  "CONCEPTION DE SITES WEB PROFESSIONNELS": "PROFESSIONAL WEBSITE DESIGN",
  "Je crée des Sites Web Professionnels qui Génèrent des Ventes.": "I Build Professional Websites That Drive Sales.",
  /* HERO.h1Lines — le titre est TOUJOURS affiché en 3 lignes. Les trois
     traductions ci-dessous se recomposent, jointes par un espace, en
     « I Build Professional Websites That Drive Sales. » (= traduction de
     h1) afin de préserver le contrôle h1 === h1Lines.join(" ").
     VOLET 19 (26/11/2026) — correction demandée par l'éditeur :
     « Generate Sales » → « Drive Sales » (titre anglais du hero). */
  "Je crée des Sites Web": "I Build Professional",
  "Professionnels qui": "Websites That",
  "Génèrent des Ventes.": "Drive Sales.",
  /* HERO.h1Bold — segment en gras ; sous-chaîne de la traduction de h1. */
  "qui Génèrent des Ventes.": "That Drive Sales.",
  /* HERO.text — contient la traduction de textBold (1re phrase), et les
     traductions de textBoldSpans (« clean code », « remarkably fast
     turnaround ») comme sous-chaînes exactes, pour le gras inline. */
  "Votre activité mérite un site web qui travaille pour vous. Attirez les bons clients, valorisez bien vos services et transformez vos visiteurs en clients grâce à un site web professionnel conçu avec du code pur dans un délai très court.": "Your business deserves a website that works for you. Attract the right clients, showcase your services at their true value, and turn your visitors into customers with a professional website built with clean code and a remarkably fast turnaround.",
  "Votre activité mérite un site web qui travaille pour vous.": "Your business deserves a website that works for you.",
  "code pur": "clean code",
  "délai très court": "remarkably fast turnaround",
  "— PMEs / Professionnels": "— SMEs / Professionals",
  /* HERO.reassurance = FINAL_CTA.mention (même chaîne) — une seule clé. */
  "30 minutes · Gratuit · Sans engagement": "30 minutes · Free · No commitment",
  "Portrait professionnel de Stevens Akpovi, concepteur de sites web orientés conversion": "Professional portrait of Stevens Akpovi, conversion-focused website designer",
  "Stevens Akpovi, concepteur de sites web professionnels, dans son espace de travail": "Stevens Akpovi, professional website designer, in his workspace",

  /* ==================== 02 — LE PROBLÈME (PROBLEM) ==================== */
  "VOTRE ACTIVITÉ MÉRITE D'ÊTRE DAVANTAGE VISIBLE": "YOUR BUSINESS DESERVES TO BE MORE VISIBLE",
  "Disposez-vous réellement d'un site web capable d'aider votre activité ?": "Do you really have a website that can support your business?",
  "Vos compétences, vos services et votre expérience ont de la valeur.\n\nMais combien de personnes peuvent réellement découvrir votre activité, comprendre vos offres et vous contacter facilement ?\n\nSans un véritable espace professionnel sur Internet, vous limitez les possibilités de présenter vos services, de rassurer vos futurs clients et de recevoir de nouvelles demandes.\n\nCar votre présence sur les réseaux sociaux ne suffit pas toujours à présenter toute la valeur de votre activité.": "Your skills, your services, and your experience have real value.\n\nBut how many people can actually discover your business, understand your offers, and contact you easily?\n\nWithout a genuine professional space on the Internet, you limit your ability to present your services, reassure your future clients, and receive new inquiries.\n\nBecause your presence on social media is not always enough to convey the full value of your business.",
  "Aucune vitrine professionnelle pour présenter votre activité.": "No professional online showcase to present your business.",
  "Une dépendance excessive aux réseaux sociaux.": "Excessive dependence on social media.",
  "Des clients potentiels qui ne trouvent pas facilement vos informations.": "Potential clients who can't easily find your information.",
  "Une présentation qui ne reflète pas la qualité de votre travail.": "A presentation that doesn't reflect the quality of your work.",
  "Des demandes et des réservations difficiles à organiser.": "Inquiries and bookings that are hard to keep organized.",
  "Une activité qui dépend constamment de votre disponibilité pour expliquer vos services.": "A business that constantly depends on your availability to explain your services.",
  "Votre travail mérite d'être vu. Votre expertise mérite d'être valorisée. Votre entreprise mérite une présence digitale à la hauteur de ses ambitions.": "Your work deserves to be seen. Your expertise deserves to be valued. Your business deserves a digital presence that matches its ambitions.",
  "Construire Mon Site Professionnel": "Build My Professional Website",

  /* ==================== 03 — REMISE EN QUESTION (QUESTIONING) ==================== */
  "VOUS AVEZ DÉJÀ UN SITE ?": "ALREADY HAVE A WEBSITE?",
  "Votre site web vous rapporte-t-il réellement quelque chose ?": "Is your website actually bringing you anything in return?",
  "Un site web peut être en ligne depuis plusieurs années, avoir une belle apparence et pourtant ne pas contribuer suffisamment à la croissance de votre activité.\n\nPosez-vous ces questions :": "A website can be online for several years, look great, and still not contribute enough to the growth of your business.\n\nAsk yourself these questions:",
  "Votre site est-il à la hauteur de votre image professionnelle actuelle ?": "Does your website live up to your current professional image?",
  "Vos visiteurs comprennent-ils immédiatement vos services ?": "Do your visitors immediately understand your services?",
  "Votre site les encourage-t-il réellement à vous contacter ?": "Does your website actually encourage them to contact you?",
  "Votre entreprise peut-elle être trouvée lorsqu'on recherche vos prestations sur Google ?": "Can your business be found when people search for your services on Google?",
  "Votre site vous apporte-t-il des demandes de rendez-vous et de devis ?": "Is your website bringing you appointment and quote requests?",
  "Continue-t-il à présenter votre activité lorsque vous êtes absent ?": "Does it keep presenting your business when you're not available?",
  "Un site web ne devrait pas être une simple décoration numérique. Il devrait être un véritable outil au service de votre entreprise.": "A website should not be mere digital decoration. It should be a genuine tool serving your business.",

  /* ==================== 04 — LA TRANSFORMATION (TRANSFORMATION) ==================== */
  "ET SI VOTRE SITE DEVENAIT UN VÉRITABLE ATOUT ?": "WHAT IF YOUR WEBSITE BECAME A REAL ASSET?",
  "Imaginez une présence professionnelle qui travaille pour votre activité, même en votre absence.": "Imagine a professional presence that works for your business, even in your absence.",
  "Un visiteur découvre votre entreprise. Il consulte vos services, comprend votre proposition, découvre votre expertise et peut facilement vous contacter.\n\nVoilà ce qu'un site professionnel bien pensé peut rendre possible.": "A visitor discovers your company. They browse your services, understand your proposition, discover your expertise, and can easily contact you.\n\nThat's what a well-designed professional website makes possible.",
  "Une disponibilité permanente": "Round-the-clock availability",
  "Votre entreprise reste accessible en ligne, même en dehors de vos heures de travail.": "Your business remains accessible online, even outside your working hours.",
  "Une image professionnelle plus forte": "A stronger professional image",
  "Votre site valorise votre activité et aide vos visiteurs à mieux percevoir la qualité de vos services.": "Your website showcases your business and helps your visitors better perceive the quality of your services.",
  "Davantage de possibilités commerciales": "More business opportunities",
  "Les personnes intéressées peuvent découvrir vos offres, demander un devis et réserver un rendez-vous.": "Interested people can discover your offers, request a quote, and book an appointment.",
  "Un espace qui vous appartient": "A space that belongs to you",
  "Vous disposez d'une véritable vitrine professionnelle, indépendante de la visibilité parfois fluctuante des réseaux sociaux.": "You get a genuine professional showcase, independent of the sometimes fluctuating visibility of social media.",
  "Un outil qui évolue avec votre entreprise": "A tool that grows with your business",
  "Votre site peut grandir avec votre activité et accompagner vos nouvelles offres et ambitions.": "Your website can grow along with your business and support your new offers and ambitions.",
  "Je Veux Développer Ma Présence En Ligne": "I Want To Grow My Online Presence",

  /* ==================== 05 — COMMENT JE TRAVAILLE (SOLUTION) ==================== */
  "Comment Je Travaille": "How I Work",
  /* SOLUTION.text = ABOUT_APPROACH.title (même chaîne) — une seule clé. */
  "Je ne crée pas simplement des sites web. Je conçois des sites pensés pour convaincre et transformer vos visiteurs en clients.": "I don't just build websites. I design sites crafted to convince and convert your visitors into customers.",
  "Échange & Compréhension": "Discussion & Understanding",
  "Chaque projet commence par une compréhension réelle de votre activité.\n\nJe cherche à comprendre votre marché, vos services, vos clients et vos objectifs pour construire un site qui présente clairement votre valeur et facilite la prise de décision de vos visiteurs.": "Every project begins with a genuine understanding of your business.\n\nI seek to understand your market, your services, your clients, and your goals in order to build a website that presents your value clearly and makes it easy for your visitors to decide.",
  "Le Parcours de Vos Visiteurs": "Your Visitors' Journey",
  "Le premier élément, et le plus important à prendre en compte, est le parcours que suit un visiteur sur votre site web.\n\nQuelles questions se pose-t-il lorsqu'il arrive sur votre site ? Quelles hésitations ou objections faut-il lever ? Comment instaurer un climat de confiance avec lui ?\n\nJ'aborde toutes ces questions dès le premier jour du projet, lors d'un atelier d'environ 1h, au cours duquel je vous présente la structure du site web et nous échangeons nos idées.": "The first element, and the most important one to consider, is the journey a visitor takes across your website.\n\nWhat questions do they ask themselves when they land on your site? What hesitations or objections need to be overcome? How can you build trust with them?\n\nI address all of these questions on the very first day of the project, during a workshop of about one hour, where I present the website structure and we share our ideas.",
  "Conception Visuelle": "Visual Design",
  "En fonction du public que vous visez, plusieurs styles esthétiques peuvent être envisagés pour mieux correspondre à ses goûts et renforcer sa confiance.\n\nDans la troisième phase du projet, j'explorerai plusieurs pistes créatives et retiendrai la plus adaptée.\n\nJe peux réaliser ce travail tout en respectant votre charte graphique et vos contraintes existantes — ou choisir de les repenser entièrement.": "Depending on the audience you target, several aesthetic styles can be considered to better match its tastes and strengthen its trust.\n\nIn the third phase of the project, I explore several creative directions and retain the most suitable one.\n\nI can carry out this work while respecting your brand guidelines and existing constraints — or choose to rethink them entirely.",
  "Rédaction de Contenu": "Content Writing",
  "La clé d'une rédaction web efficace réside dans la concision et la pertinence de votre contenu.\n\nJe rédige les textes des sites web que je conçois et, lorsque cela est pertinent, je les optimise pour les moteurs de recherche (SEO).": "The key to effective web writing lies in the concision and relevance of your content.\n\nI write the copy for the websites I design and, where relevant, optimize it for search engines (SEO).",
  "Développement & Mise en Ligne": "Development & Launch",
  "Durant cette phase, je transforme les maquettes graphiques que j'ai conçues en un site web fonctionnel, grâce au code.\n\nJe veille à ce que votre site web offre un rendu impeccable sur tous les formats d'écran : ordinateurs, tablettes et smartphones.\n\nUne fois le développement initial terminé, je vous présente le site pour recueillir vos retours et intégrer les éventuels ajustements ou personnalisations souhaités. Après validation et finalisation, je procède à sa mise en ligne afin de le rendre accessible à vos visiteurs sur Internet.": "During this phase, I turn the visual mockups I have designed into a functional website, with code.\n\nI make sure your website renders flawlessly on every screen size: desktops, tablets, and smartphones.\n\nOnce the initial development is complete, I present the site to gather your feedback and incorporate any adjustments or customizations you may want. After validation and finalization, I put it online so your visitors can access it on the Internet.",
  "Attirer des visiteurs": "Attracting visitors",
  "Maintenant que votre site web est prêt, il est temps de le faire connaître.\n\nJ'optimise votre site pour les moteurs de recherche (SEO) et attire des visiteurs grâce aux campagnes publicitaires Meta Ads.": "Now that your website is ready, it's time to make it known.\n\nI optimize your site for search engines (SEO) and attract visitors through Meta Ads advertising campaigns.",
  "Démarrons Votre Projet": "Let's Start Your Project",

  /* ==================== MON APPROCHE (ABOUT_APPROACH) ====================
     title partagé avec SOLUTION.text — voir ci-dessus. */
  "MON APPROCHE": "MY APPROACH",
  "Stratégie": "Strategy",
  "Comprendre votre activité et déterminer le message à transmettre.": "Understanding your business and defining the message to convey.",
  "Créer une expérience élégante, cohérente et agréable à parcourir.": "Creating an elegant, consistent experience that is enjoyable to browse.",
  "Construire un parcours qui facilite les prises de contact, les réservations et les demandes commerciales.": "Building a journey that makes contacting you, booking, and business inquiries easy.",

  /* ==================== RÉSUMÉ 3 CARTES (SERVICES_SUMMARY) ==================== */
  "DES SOLUTIONS ADAPTÉES À VOS OBJECTIFS": "SOLUTIONS TAILORED TO YOUR GOALS",
  "Le bon site web pour le bon objectif commercial.": "The right website for the right business goal.",
  "Site Web Professionnel": "Professional Website",
  "Présentez votre entreprise, vos services et votre identité avec une véritable présence professionnelle sur Internet.": "Present your company, your services, and your identity with a genuine professional presence on the Internet.",
  "Page de vente": "Sales Page",
  "Présentez votre offre, valorisez ses bénéfices, répondez aux hésitations et facilitez le passage à l'action.": "Present your offer, highlight its benefits, address hesitations, and make taking action easy.",
  "Refonte de Site Web": "Website Redesign",
  "Modernisez votre site, améliorez son expérience et donnez une nouvelle dimension à votre présence digitale.": "Modernize your site, improve its experience, and take your digital presence to a new level.",
  "Discuter De Mon Projet": "Discuss My Project",

  /* ==================== 06 — SERVICES (page Services) ====================
     « Page de vente » et les textes partagés avec SERVICES_SUMMARY sont couverts
     par les clés ci-dessus (chaînes identiques dans la source). */
  "Site vitrine professionnel": "Professional showcase website",
  "Site web multipages": "Multi-page website",
  "Structurez vos différentes activités et offres dans une expérience cohérente et complète.": "Structure your different activities and offers into a consistent, complete experience.",
  "Landing page": "Landing Page",
  "Concentrez l'attention de vos visiteurs sur une seule offre et une action précise.": "Focus your visitors' attention on a single offer and one specific action.",
  /* Clé distincte de « Refonte de Site Web » (casse différente dans la source) ;
     même traduction volontairement. */
  "Refonte de site web": "Website Redesign",
  "Système d'acquisition client": "Client acquisition system",
  "Associez plusieurs pages et parcours commerciaux pour accompagner les visiteurs de leur première découverte jusqu'à la prise de contact.": "Combine multiple pages and sales funnels to guide visitors from their very first discovery all the way to getting in touch.",

  /* ==================== 07 — AVANTAGES INCLUS (INCLUDED) ==================== */
  "DAVANTAGE DE VALEUR, SANS FRAIS SUPPLÉMENTAIRES": "MORE VALUE, AT NO EXTRA COST",
  "Votre site est livré avec ses textes professionnels et ses bases de référencement.": "Your site is delivered with its professional copy and its SEO fundamentals.",
  "Rédaction professionnelle incluse": "Professional copywriting included",
  "Vous n'avez pas besoin de chercher un rédacteur supplémentaire.\n\nJe rédige les contenus de votre site pour mettre en valeur votre activité, présenter vos offres et encourager vos visiteurs à vous contacter.": "You don't need to look for an extra copywriter.\n\nI write your site's content to showcase your business, present your offers, and encourage your visitors to contact you.",
  "Optimisation SEO de base incluse": "Basic SEO optimization included",
  "Votre site bénéficie des optimisations essentielles pour faciliter sa compréhension par les moteurs de recherche : titres, descriptions, structure, images et éléments techniques de base.": "Your site benefits from the essential optimizations that make it easy for search engines to understand: titles, descriptions, structure, images, and basic technical elements.",
  "Deux éléments essentiels, intégrés à votre projet sans facturation supplémentaire.": "Two essential elements, included in your project at no extra cost.",
  "Parlons De Mon Futur Site": "Let's Talk About My Future Website",

  /* ==================== 08 — SERVICES COMPLÉMENTAIRES (COMPLEMENTARY) ====================
     La clé ci-dessous couvre aussi PAGES.publicite.description (lib/site.ts),
     chaîne strictement identique. */
  "DÉVELOPPER VOTRE VISIBILITÉ": "GROW YOUR VISIBILITY",
  "Votre site est prêt. Maintenant, faisons-le connaître.": "Your site is ready. Now let's make it known.",
  "Développez votre présence sur Facebook et Instagram grâce à des campagnes publicitaires ciblées et structurées autour de vos objectifs.": "Grow your presence on Facebook and Instagram with targeted advertising campaigns structured around your goals.",
  "Référencement approfondi sur les moteurs de recherche": "In-depth search engine optimization",
  "Améliorez votre positionnement sur Google, renforcez votre visibilité et attirez des visiteurs sur la durée, sans dépendre de la publicité, grâce à une stratégie de référencement adaptée à votre marché.": "Improve your positioning on Google, strengthen your visibility, and attract visitors over the long term, without depending on paid advertising, thanks to an SEO strategy tailored to your market.",
  "Discuter De Ma Stratégie Digitale": "Discuss My Digital Strategy",

  /* ==================== 09 — RÉALISATIONS (WORKS) ==================== */
  "PROJETS RÉALISÉS": "COMPLETED PROJECTS",
  "Des réalisations concrètes. Des expériences digitales pensées avec intention.": "Concrete achievements. Digital experiences designed with intention.",
  "Découvrez quelques projets auxquels j'ai donné vie.": "Discover a few of the projects I've brought to life.",
  "Votre projet peut être ma prochaine réalisation.": "Your project could be my next achievement.",

  /* ==================== 10 — MÉTHODE DE TRAVAIL (METHOD) ==================== */
  "COMMENT NOUS ALLONS TRAVAILLER ENSEMBLE": "HOW WE'LL WORK TOGETHER",
  "Un processus clair. Une collaboration structurée. Un résultat pensé pour votre activité.": "A clear process. A structured collaboration. A result designed for your business.",
  "Échange et compréhension": "Discussion and understanding",
  "Je discute de votre activité, de vos besoins et de vos objectifs.": "I discuss your business, your needs, and your goals.",
  "Stratégie et organisation": "Strategy and organization",
  "Je définis le message, les pages, les contenus et la structure de votre futur site.": "I define the message, the pages, the content, and the structure of your future site.",
  "Design et conception": "Design and conception",
  "Je construis une expérience visuelle cohérente avec votre identité et votre audience.": "I build a visual experience consistent with your identity and your audience.",
  "Développement": "Development",
  "Je transforme la conception en un site fonctionnel, performant et impeccable sur tous les formats d'écran.": "I turn the design into a functional, high-performing site that looks impeccable on every screen size.",
  "Tests et optimisation": "Testing and optimization",
  "Je vérifie le comportement du site, ses liens, ses formulaires et son affichage sur tous les appareils.": "I check the site's behavior, its links, its forms, and its display on all devices.",
  "Mise en ligne": "Launch",
  "Votre site est publié et prêt à accueillir ses premiers visiteurs.": "Your site is published and ready to welcome its first visitors.",
  "Démarrer Mon Projet": "Start My Project",

  /* ==================== 11 — À PROPOS (ABOUT) ====================
     ABOUT.text et ABOUT.textHome sont identiques dans la source — une seule clé. */
  "QUI SUIS-JE ?": "WHO AM I?",
  "Je suis Stevens Akpovi. Et je crois qu'un bon site web doit servir le business qu'il représente.": "I'm Stevens Akpovi. And I believe a good website should serve the business it represents.",
  "Je suis concepteur de sites web professionnels et passionné par la manière dont le numérique peut accompagner le développement des entreprises.\n\nMon travail consiste à transformer les besoins d'un professionnel en une expérience digitale claire, élégante et orientée vers ses objectifs.\n\nJe m'intéresse autant à la présentation visuelle qu'au message transmis et au chemin que suit un visiteur avant de prendre une décision.\n\nParce qu'un site réussi ne se résume pas à son apparence.\n\nIl doit donner une bonne première impression, présenter la valeur de votre activité et faciliter la relation avec vos futurs clients.": "I am a professional website designer, passionate about how digital can support the growth of businesses.\n\nMy work consists of turning a professional's needs into a clear, elegant digital experience oriented toward their goals.\n\nI pay as much attention to the visual presentation as to the message conveyed and the path a visitor follows before making a decision.\n\nBecause a successful website is about more than its appearance.\n\nIt must make a good first impression, present the value of your business, and make it easier to build relationships with your future clients.",
  "Faisons Connaissance": "Let's Get To Know Each Other",

  /* ==================== 12 — FAQ ==================== */
  "QUESTIONS FRÉQUENTES": "FREQUENTLY ASKED QUESTIONS",
  "Les réponses aux questions que l'on me pose le plus souvent.": "Answers to the questions I'm asked most often.",
  "Puis-je créer mon premier site web sans connaissances techniques ?": "Can I build my first website without any technical knowledge?",
  "Oui. Je vous accompagne depuis la définition de votre besoin jusqu'à la mise en ligne.": "Yes. I guide you from defining your needs all the way to launch.",
  "Je possède déjà un site. Puis-je demander une refonte ?": "I already have a website. Can I request a redesign?",
  "Oui. Je peux étudier votre site actuel et identifier les améliorations nécessaires.": "Yes. I can review your current site and identify the necessary improvements.",
  "La rédaction des textes est-elle facturée séparément ?": "Is the copywriting billed separately?",
  "Non. La rédaction professionnelle des textes du site est incluse dans votre projet.": "No. Professional copywriting of the site's content is included in your project.",
  "Le référencement est-il inclus ?": "Is SEO included?",
  "L'optimisation SEO de base est incluse. Une stratégie approfondie de référencement constitue une prestation complémentaire.": "Basic SEO optimization is included. An in-depth SEO strategy is a complementary service.",
  "Travaillez-vous à distance ?": "Do you work remotely?",
  "Oui. La collaboration se déroule à distance, avec des échanges organisés et un suivi structuré.": "Yes. The collaboration takes place remotely, with organized communication and structured follow-up.",
  "Comment réserver un échange ?": "How do I book a call?",
  "Il suffit de choisir un créneau disponible sur mon agenda en ligne (Calendly). Le premier échange dure 30 minutes, est gratuit et sans engagement.": "Just pick an available time slot on my online calendar (Calendly). The first call lasts 30 minutes and is free, with no commitment.",
  "Combien coûte un site web ?": "How much does a website cost?",
  "Le montant dépend du type de site, de son périmètre et de sa complexité. Un devis personnalisé est établi à partir de votre besoin.": "The cost depends on the type of site, its scope, and its complexity. A custom quote is prepared based on your needs.",
  "Pourrai-je gérer mon site après sa livraison ?": "Will I be able to manage my site after delivery?",
  "Oui. Les modalités de gestion et d'accès sont définies dans le cadre du projet.": "Yes. The management and access arrangements are defined as part of the project.",

  /* ==================== 13 — CONVERSION FINALE (FINAL_CTA) ====================
     cta1/cta2/cta3 = CTA_LABELS (clés ci-dessus) ; mention = HERO.reassurance. */
  "IL EST TEMPS DE DONNER UNE NOUVELLE DIMENSION À VOTRE ACTIVITÉ": "IT'S TIME TO TAKE YOUR BUSINESS TO A NEW LEVEL",
  "Votre activité mérite un site web qui travaille pour vous. Et cela peut commencer aujourd'hui.": "Your business deserves a website that works for you. And that can start today.",
  "Construisons une présence en ligne professionnelle qui donne à votre entreprise les moyens de mieux se présenter, de toucher de nouvelles personnes et de transformer davantage d'intérêt en clients.": "Let's build a professional online presence that gives your business the means to present itself better, reach new people, and turn more interest into clients.",

  /* ==================== CIBLES COMMERCIALES (TARGETS) ==================== */
  "POUR QUI JE CONÇOIS CES SITES": "WHO I DESIGN THESE WEBSITES FOR",
  "Des professionnels qui veulent transformer leur présence en ligne.": "Professionals who want to transform their online presence.",
  "Professionnels sans site web ou dont le site web ne génère pas suffisamment de demandes commerciales.": "Professionals without a website, or whose website doesn't generate enough business inquiries.",
  "PME sans véritable présence professionnelle en ligne ou ayant un site vieillissant ou inefficace.": "SMEs with no genuine professional online presence, or with an aging or ineffective website.",
  "Agences et indépendants souhaitant mieux présenter leurs services pour développer leur activité.": "Agencies and freelancers who want to present their services more effectively to grow their business.",

  /* ==================== lib/site.ts — SITE (infos de contact) ==================== */
  "Concepteur de sites web professionnels orientés conversion": "Conversion-focused professional website designer",
  "Je crée des sites web qui génèrent des ventes.": "I build websites that generate sales.",
  "J'accompagne entreprises, PME, agences, coachs, infopreneurs et freelances dans la création de sites web stratégiques qui valorisent leur activité, attirent les bons visiteurs et transforment leur intérêt en clients.": "I support businesses, SMEs, agencies, coaches, infopreneurs, and freelancers in creating strategic websites that showcase their business, attract the right visitors, and turn their interest into clients.",
  "Gratuit, 30 minutes et sans engagement.": "Free, 30 minutes, and no commitment.",
  "Activité exercée à titre indépendant — identifiant professionnel non communiqué par l'éditeur.": "Business operated on a self-employed basis — professional registration number not provided by the publisher.",
  /* Adresse de l'hébergeur : conservée à l'identique, seul « États-Unis »
     est traduit (« United States »). */
  "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis": "440 N Barranca Avenue #4133, Covina, CA 91723, United States",

  /* ==================== lib/site.ts — PAGES (titres + méta descriptions) ==================== */
  /* PAGES.appel.label (« Réserver Un Appel ») est couvert par CTA_LABELS. */
  "Accueil": "Home",
  "Stevens Akpovi — Votre site web qui travaille pour vous": "Stevens Akpovi — Your Website That Works For You",
  "Sites vitrines, multipages, landing pages et pages de vente pensés pour convertir. Copywriting et SEO de base inclus. Demandez votre devis personnalisé.": "Showcase websites, multi-page sites, landing pages, and sales pages designed to convert. Copywriting and basic SEO included. Request your custom quote.",
  "Méthode": "Method",
  "Méthode — Comment je travaille | Stevens Akpovi": "Method — How I Work | Stevens Akpovi",
  "La méthode de Stevens Akpovi : compréhension de votre activité, parcours de vos visiteurs, conception, rédaction, développement et mise en ligne.": "Stevens Akpovi's method: understanding your business, your visitors' journey, design, copywriting, development, and launch.",
  "Référencement SEO": "SEO",
  "Référencement SEO — Positionnement Google | Stevens Akpovi": "SEO — Google Rankings | Stevens Akpovi",
  "Améliorez votre positionnement sur Google et attirez des visiteurs sur la durée, sans dépendre de la publicité : référencement adapté à votre marché.": "Improve your Google rankings and attract visitors over the long term, without depending on paid advertising: SEO tailored to your market.",
  "Publicité Meta Ads": "Meta Ads",
  "Publicité Meta Ads — Facebook & Instagram | Stevens Akpovi": "Meta Ads — Facebook & Instagram | Stevens Akpovi",
  "Réalisations": "Portfolio",
  "Réalisations — Projets web | Stevens Akpovi": "Portfolio — Web Projects | Stevens Akpovi",
  "{name} — Projet web | Stevens Akpovi": "{name} — Web Project | Stevens Akpovi",
  "Découvrez les projets conçus par Stevens Akpovi : MR STEVE ENGLISH, PRÉ-LAUNCH MR STEVE ENGLISH et AFRIBAYIT.": "Discover the projects designed by Stevens Akpovi: MR STEVE ENGLISH, PRÉ-LAUNCH MR STEVE ENGLISH, and AFRIBAYIT.",
  "À propos": "About",
  "À propos — Stevens Akpovi, concepteur de sites web": "About — Stevens Akpovi, Professional Website Designer",
  "Je conçois des sites web professionnels qui servent le business qu'ils représentent. Collaboration à distance, au-delà des frontières.": "I design professional websites that serve the business they represent. Remote collaboration, beyond borders.",
  "Contactez Stevens Akpovi : laissez un message, demandez un devis personnalisé ou réservez un appel stratégique de 30 minutes — gratuit et sans engagement.": "Contact Stevens Akpovi: leave a message, request a custom quote, or book a 30-minute strategy call — free and with no commitment.",
  "Demander Un Devis": "Request A Quote",
  "Demander Un Devis — Stevens Akpovi": "Request A Quote — Stevens Akpovi",
  "Décrivez votre activité et votre projet : Stevens Akpovi vous répond avec un devis personnalisé, établi à partir de votre besoin.": "Describe your business and your project: Stevens Akpovi will get back to you with a custom quote, prepared based on your needs.",
  "Audit Gratuit": "Free Audit",
  "Audit Gratuit De Votre Site — Stevens Akpovi": "Free Website Audit — Stevens Akpovi",
  "Votre site vous rapporte-t-il assez de clients ? Recevez un audit concret : ce qui fonctionne, ce qui freine vos visiteurs, les priorités — gratuitement.": "Is your website bringing you enough clients? Get a concrete audit: what works, what's holding your visitors back, and the priorities — for free.",
  "Réserver Un Appel — 30 minutes | Stevens Akpovi": "Book A Call — 30 minutes | Stevens Akpovi",
  "Réservez votre créneau d'appel stratégique de 30 minutes avec Stevens Akpovi — gratuit et sans engagement, en visioconférence.": "Book your 30-minute strategy call with Stevens Akpovi — free, no commitment, via video call.",
  "Mentions légales": "Legal Notice",
  "Mentions légales | Stevens Akpovi": "Legal Notice | Stevens Akpovi",
  "Mentions légales, éditeur du site, données personnelles et cookies.": "Legal notice, site publisher, personal data, and cookies.",

  /* ==================== lib/site.ts — NAV_ITEMS (libellés de menu) ====================
     « Accueil », « Méthode », « À propos » sont couverts par PAGES ci-dessus.
     « Portfolio » et « Contact » sont identiques en anglais (voir notes finales). */
  "Référencement": "SEO",
  "Publicité": "Advertising",

  /* ==================== lib/site.ts — PROJECTS ====================
     Noms de projets (MR STEVE ENGLISH, PRÉ-LAUNCH MR STEVE ENGLISH, AFRIBAYIT,
     ALEXANDRE MOREL) non traduits — marques/noms propres. La catégorie
     « Page de vente » (prelaunch) est couverte par SERVICES_SUMMARY ci-dessus.
     « Voir Le Site » couvre les 3 projets qui l'utilisent. */
  "Site web professionnel pour coach": "Professional website for a coach",
  "Un espace professionnel consacré à la présentation d'une activité de coaching en anglais, de ses programmes et de son accompagnement.": "A professional space dedicated to presenting an English coaching practice, its programs, and its support services.",
  "Voir Le Site": "Visit The Site",
  "Une page commerciale conçue pour présenter une offre de coaching, valoriser ses bénéfices et guider le visiteur vers l'inscription.": "A sales page designed to present a coaching offer, highlight its benefits, and guide visitors toward signing up.",
  "Voir La Page De Vente": "View The Sales Page",
  "Plateforme immobilière": "Real estate platform",
  "Une expérience digitale dédiée au secteur immobilier, pensée pour présenter une plateforme et faciliter la découverte de ses offres.": "A digital experience dedicated to the real estate sector, designed to present a platform and make its listings easy to discover.",
  "Site web professionnel pour journaliste": "Professional website for a journalist",
  "Un espace professionnel consacré à un journaliste international : la présentation de son parcours, de ses reportages et documentaires, et de ses services en communication.": "A professional space dedicated to an international journalist: his career, his reports and documentaries, and his communication services.",
  /* ==================== VOLET 18 — COMPLÉMENT (chaînes repérées
     après la passe de branchement) ==================== */
  "Introduction — Stevens Akpovi, conception de sites web orientés conversion": "Introduction — Stevens Akpovi, conversion-focused website design",
  "Aperçu du site {name} — plateforme immobilière": "Preview of the {name} website — real estate platform",
  "Aperçu mobile du site {name}": "Mobile preview of the {name} website",
  "Portrait professionnel de Stevens Akpovi, concepteur de sites web": "Professional portrait of Stevens Akpovi, website designer",
  "Espace de travail de Stevens Akpovi — conception web en situation réelle": "Stevens Akpovi's workspace — web design in real conditions",
  "Illustration : croissance de l'activité grâce à une présence professionnelle en ligne": "Illustration: business growth through a professional online presence",
  "Comment je travaille — processus de collaboration": "How I work — collaboration process",
  "Illustration : professionnel sans site web, dépendant des réseaux sociaux": "Illustration: professional without a website, dependent on social media",
  "Illustration : site web inefficace qui n'apporte pas de résultats": "Illustration: ineffective website that delivers no results",
  "Questions à vous poser sur votre site web": "Questions to ask yourself about your website",
  "Découvrir Ma Méthode": "Discover My Method",
  "INCLUS SANS FRAIS SUPPLÉMENTAIRES": "INCLUDED AT NO EXTRA COST",
  "Projet {num}": "Project {num}",
  "Augmenter Vos Ventes": "Increase Your Sales",
  "Pas Assez De Clients.": "Not Enough Clients.",
};

/* ============================================================================
 * NOTES FINALES — CHAÎNES VOLONTAIREMENT NON TRADUITES (pour vérification)
 * ============================================================================
 * - URLs et identifiants techniques : SITE.url, SITE.calendly, SITE.linkedin,
 *   SITE.whatsapp (https://wa.me/…), SITE.host.url, PAGES.*.hash (#/accueil…),
 *   URL des 4 projets, DEFAULT_SITE_URL, DEFAULT_CALENDLY_URL.
 * - Email : stevensakpovi@gmail.com.
 * - Chemins de fichiers (ASSETS.*, PROJECTS.*.desktop/mobile/…) : tous les
 *   « /assets/… » restent inchangés.
 * - Identifiants de projets : mrsteveenglish, prelaunch, afribayit,
 *   journalistefr ; clés d'objets (accueil, processus, referencement,
 *   publicite, realisations, aPropos, contact, admin…) : non visibles.
 * - Noms propres / marques : « Stevens Akpovi » (SITE.name), « Vercel Inc. »
 *   (SITE.host.name), « MR STEVE ENGLISH », « PRÉ-LAUNCH MR STEVE ENGLISH »,
 *   « AFRIBAYIT », « ALEXANDRE MOREL », « Meta Ads » (titre de carte
 *   COMPLEMENTARY — nom de produit, identique en anglais), « LinkedIn »,
 *   « WhatsApp », « Calendly », « Google », « Facebook », « Instagram »
 *   (traités à l'intérieur des phrases traduites).
 * - Chaînes identiques en anglais (repli français = anglais, clé inutile) :
 *   « Portfolio » (NAV_ITEMS), « Contact » (PAGES.contact.label + NAV_ITEMS),
 *   « Contact — Stevens Akpovi » (PAGES.contact.title), « Design » et
 *   « Conversion » (piliers ABOUT_APPROACH).
 * - Cas particulier : adresse de l'hébergeur « 440 N Barranca Avenue #4133,
 *   Covina, CA 91723, États-Unis » — conservée à l'identique, seul le pays est
 *   traduit (« United States »).
 * - Chaînes interpolées (template literals avec ${…}) : AUCUNE chaîne visible
 *   de site-content.ts / lib/site.ts n'est interpolée — aucun marqueur
 *   {variable} n'a donc été nécessaire.
 * - « 4,9/5 » : cette chaîne n'existe pas dans les deux fichiers sources
 *   (règle applicable si elle apparaissait ailleurs : « 4.9/5 »).
 * ============================================================================
 */
