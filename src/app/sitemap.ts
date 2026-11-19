import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  /* SITEMAP À UNE SEULE ENTRÉE (audit serveur du 19/11 — cinquième
     volet de l'audit intégral) : le site est une application à routage
     par fragment (#/methode, #/contact…). Les crawleurs IGNARENT les
     fragments d'URL : « https://…/#/methode » est lu comme
     « https://…/ » — la version précédente du sitemap listait 11 URLs
     qui se réduisaient toutes à la même page racine (10 entrées
     inutiles, bruit de duplication dans Search Console). Le sitemap
     honnête d'un site à une seule URL indexable est d'une entrée :
     la racine, qui porte tout le contenu. Les pages virtuelles
     restent atteignables par la navigation (et les moteurs qui
     exécutent le JavaScript en voient le contenu sur l'URL racine),
     mais aucune n'est une URL indexable distincte.
     lastModified : date du build (le contenu change au fil des
     déploiements, « monthly » reste une fréquence raisonnable). */
  return [
    {
      url: `${SITE.url}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
