import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

// ---------------------------------------------------------------------------
// À COMPLÉTER avant la mise en ligne : tout ce qui est entre [crochets] ci-dessous.
// ---------------------------------------------------------------------------
const SITE_NAME = "Reelverse";
const EDITOR_PSEUDO = "Reelverse (pseudonyme de l’éditeur)";
const CONTACT_EMAIL = "contact@reelverse.me";
const HOST_NAME = "Vercel Inc.";
const HOST_ADDRESS = "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis";
const HOST_CONTACT = "https://vercel.com";
const MIN_AGE = 16;
const LAST_UPDATE = "7 octobre 2026";

const NAV_LINKS = [
  { to: "/legal", label: "Mentions légales" },
  { to: "/privacy", label: "Confidentialité" },
  { to: "/terms", label: "Conditions d’utilisation" },
];

function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#0B0B0E] text-[#F3F4F6] font-sans antialiased">
      <header className="border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center font-black text-white text-base tracking-tighter">
              R
            </span>
            <span className="font-black tracking-tight">
              REEL<span className="text-[#E50914]">VERSE</span>
            </span>
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-[#9CA3AF] hover:text-[#F3F4F6]"
          >
            Retour au jeu
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <nav className="flex flex-wrap gap-2 mb-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  isActive
                    ? "bg-[#E50914] border-[#E50914] text-white"
                    : "bg-[#121217] border-white/[0.08] text-[#9CA3AF] hover:text-[#F3F4F6]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-[#9CA3AF] mt-2">
          Dernière mise à jour : {LAST_UPDATE}
        </p>

        <div className="mt-8 space-y-8">{children}</div>
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <TmdbAttribution />
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black tracking-tight text-[#F3F4F6]">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-[#C9CCD3] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#E50914] hover:underline"
    >
      {children}
    </a>
  );
}

export function TmdbAttribution({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] text-[#9CA3AF] leading-relaxed ${className}`}>
      Ce produit utilise l’API TMDB mais n’est ni approuvé ni certifié par{" "}
      <ExternalLink href="https://www.themoviedb.org">TMDB</ExternalLink>. Les
      affiches et photos proviennent de TMDB et appartiennent à leurs ayants
      droit.
    </p>
  );
}

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="text-[11px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function LegalNoticePage() {
  return (
    <LegalLayout title="Mentions légales">
      <Section title="Éditeur du site">
        <p>
          {SITE_NAME} est un projet personnel, gratuit et non commercial, édité
          par <strong>{EDITOR_PSEUDO}</strong>, personne physique agissant à
          titre non professionnel.
        </p>
        <p>
          Contact : <strong>{CONTACT_EMAIL}</strong>
        </p>
        <p>Directeur de la publication : {EDITOR_PSEUDO}.</p>
      </Section>

      <Section title="Hébergeur">
        <p>
          Le site (interface web) est hébergé par <strong>{HOST_NAME}</strong>,{" "}
          {HOST_ADDRESS}. {HOST_CONTACT}.
        </p>
        <p>
          Le serveur applicatif et la base de données sont exploités par
          l’éditeur. Le trafic vers ce serveur et la gestion du nom de domaine
          passent par Cloudflare, Inc., 101 Townsend Street, San Francisco, CA
          94107, États-Unis (https://www.cloudflare.com).
        </p>
        <p>
          L’éditeur, qui agit à titre non professionnel, a communiqué son
          identité à l’hébergeur, conformément à l’article 6, III, 2° de la loi
          n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie
          numérique.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          Le code, le design et le nom {SITE_NAME} sont la propriété de
          l’éditeur. Les films, séries, affiches, photographies, noms de
          personnes et de personnages restent la propriété de leurs ayants droit
          respectifs. {SITE_NAME} est un jeu de collection créé par un fan : il
          n’est affilié à aucun studio, producteur ou diffuseur.
        </p>
        <p>
          Les données et images relatives aux films, séries et personnes
          proviennent de{" "}
          <ExternalLink href="https://www.themoviedb.org">
            The Movie Database (TMDB)
          </ExternalLink>
          .
        </p>
        <TmdbAttribution />
      </Section>

      <Section title="Signaler un contenu">
        <p>
          Pour signaler un contenu illicite, une atteinte à vos droits ou
          demander le retrait d’une image, écrivez à {CONTACT_EMAIL} en
          précisant l’adresse de la page concernée et le motif de votre demande.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <Section title="Qui est responsable de vos données ?">
        <p>
          Le responsable du traitement est {EDITOR_PSEUDO} (voir les mentions
          légales). Pour toute question sur vos données :{" "}
          <strong>{CONTACT_EMAIL}</strong>.
        </p>
      </Section>

      <Section title="Quelles données sont collectées ?">
        <List
          items={[
            <>
              <strong>Compte :</strong> adresse e-mail, pseudo, mot de passe
              (stocké sous forme chiffrée, jamais en clair) et, si vous
              l’ajoutez, votre photo de profil.
            </>,
            <>
              <strong>Connexion Google ou Discord :</strong> si vous utilisez
              ces boutons, nous recevons votre adresse e-mail vérifiée et un
              identifiant propre au service. Nous ne recevons pas votre mot de
              passe et ne publions rien en votre nom.
            </>,
            <>
              <strong>Données de jeu :</strong> cartes possédées, pièces, packs,
              historique d’ouverture, échanges, annonces du marché, liste de
              souhaits, amis, joueurs bloqués, série de connexions.
            </>,
            <>
              <strong>Données techniques :</strong> adresse IP et journaux du
              serveur, conservés pour la sécurité et le fonctionnement du
              service.
            </>,
          ]}
        />
      </Section>

      <Section title="Pourquoi et sur quelle base légale ?">
        <List
          items={[
            "Créer et gérer votre compte, faire fonctionner le jeu : exécution du contrat (conditions d’utilisation).",
            "Envoyer l’e-mail de réinitialisation de mot de passe : exécution du contrat.",
            "Sécuriser le service, détecter la fraude et les abus : intérêt légitime de l’éditeur.",
          ]}
        />
        <p>
          Vos données ne sont ni vendues, ni utilisées à des fins publicitaires,
          ni soumises à une décision automatisée produisant des effets
          juridiques.
        </p>
      </Section>

      <Section title="Cookies et stockage local">
        <p>
          {SITE_NAME} utilise uniquement des éléments strictement nécessaires à
          son fonctionnement, qui ne demandent pas de consentement :
        </p>
        <List
          items={[
            "Un cookie de session (HttpOnly) qui vous garde connecté.",
            "Un cookie temporaire utilisé pendant la connexion via Google ou Discord, pour sécuriser l’échange.",
            "Le stockage du navigateur, pour mémoriser des préférences d’affichage (filtres, tri).",
          ]}
        />
        <p>Il n’y a ni cookie publicitaire, ni outil de mesure d’audience.</p>
      </Section>

      <Section title="Qui reçoit vos données ?">
        <List
          items={[
            <>L’hébergeur du site : {HOST_NAME}</>,
            <>
              Cloudflare, qui assure le transit du trafic et la gestion du nom
              de domaine.
            </>,
            <>
              Google et Discord, uniquement si vous choisissez de vous connecter
              avec eux, selon leurs propres politiques de confidentialité.
            </>,
            <>
              <ExternalLink href="https://www.themoviedb.org">
                TMDB
              </ExternalLink>{" "}
              : les affiches et photos sont chargées directement depuis ses
              serveurs. Votre navigateur lui transmet donc, comme à tout site,
              votre adresse IP lors du chargement des images.
            </>,
          ]}
        />
        <p>
          Les autres joueurs voient votre pseudo, votre photo de profil et les
          informations de jeu que vous rendez publiques (collection, vitrine,
          annonces).
        </p>
      </Section>

      <Section title="Transferts hors de l’Union européenne">
        <p>
          Vercel et Cloudflare sont des sociétés américaines : certaines données
          techniques (par exemple votre adresse IP) peuvent être traitées aux
          États-Unis. Ces transferts s’appuient sur les garanties prévues par le
          RGPD, notamment les clauses contractuelles types de la Commission
          européenne ou le Data Privacy Framework, selon les cas.
        </p>
      </Section>

      <Section title="Combien de temps ?">
        <p>
          Vos données de compte et de jeu sont conservées tant que votre compte
          existe. Elles sont supprimées lorsque vous supprimez votre compte. Les
          journaux techniques sont conservés pour une durée limitée, au plus 12
          mois.
        </p>
      </Section>

      <Section title="Vos droits">
        <p>
          Vous pouvez demander l’accès à vos données, leur rectification, leur
          effacement, leur portabilité, la limitation du traitement ou vous y
          opposer. Une grande partie de ces actions est disponible directement
          dans le jeu (modification du profil, export et suppression du compte).
          Pour tout le reste, écrivez à {CONTACT_EMAIL} : nous répondons sous un
          mois.
        </p>
        <p>
          Vous pouvez aussi saisir la{" "}
          <ExternalLink href="https://www.cnil.fr/fr/plaintes">
            CNIL
          </ExternalLink>{" "}
          si vous estimez que vos droits ne sont pas respectés.
        </p>
      </Section>

      <Section title="Âge minimum">
        <p>
          Le service est réservé aux personnes âgées d’au moins {MIN_AGE} ans.
          Si vous pensez qu’un compte appartient à une personne plus jeune,
          signalez-le à {CONTACT_EMAIL} : il sera supprimé.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Conditions d’utilisation">
      <Section title="1. Objet">
        <p>
          {SITE_NAME} est un jeu de collection de cartes sur le thème du cinéma
          et des séries. Ces conditions encadrent son utilisation. En créant un
          compte, vous déclarez les avoir lues et acceptées.
        </p>
      </Section>

      <Section title="2. Accès et compte">
        <List
          items={[
            `Le service est réservé aux personnes âgées d’au moins ${MIN_AGE} ans.`,
            "Un compte est personnel. Vous êtes responsable de la confidentialité de votre mot de passe et de l’activité de votre compte.",
            "Les informations fournies à l’inscription doivent être exactes. Un joueur ne peut avoir qu’un seul compte.",
          ]}
        />
      </Section>

      <Section title="3. Cartes, packs et pièces virtuelles">
        <p>
          Les cartes, les packs et les pièces sont des éléments virtuels propres
          au jeu. Ils n’ont aucune valeur monétaire, ne peuvent pas être
          échangés contre de l’argent et ne constituent ni un bien ni un droit
          de propriété. L’éditeur peut en ajuster la répartition, les raretés et
          les quantités pour équilibrer le jeu.
        </p>
        <p>
          Le jeu est actuellement gratuit. Si une offre payante était proposée à
          l’avenir, elle ferait l’objet de conditions spécifiques, présentées
          avant tout achat.
        </p>
      </Section>

      <Section title="4. Règles de conduite">
        <p>Il est interdit de :</p>
        <List
          items={[
            "tricher, exploiter une faille, utiliser des robots ou des scripts automatiques, ou créer plusieurs comptes pour obtenir des avantages ;",
            "vendre ou acheter des éléments du jeu contre de l’argent réel en dehors du jeu ;",
            "choisir un pseudo ou une photo de profil illicite, injurieux, haineux, usurpant l’identité d’autrui ou portant atteinte aux droits de tiers ;",
            "harceler d’autres joueurs ou perturber le fonctionnement du service.",
          ]}
        />
        <p>
          En cas de manquement, l’éditeur peut retirer un contenu, remettre à
          zéro des éléments obtenus de manière abusive, suspendre ou supprimer
          le compte, sans préavis si la situation l’exige.
        </p>
      </Section>

      <Section title="5. Échanges et marché">
        <p>
          Les échanges entre joueurs et le marché portent uniquement sur des
          éléments virtuels du jeu. Une fois confirmé, un échange ou un achat
          est définitif. L’éditeur peut annuler une transaction obtenue par
          fraude ou par exploitation d’un défaut du service.
        </p>
      </Section>

      <Section title="6. Contenus tiers et propriété intellectuelle">
        <p>
          Les données, affiches et photos sont fournies par TMDB et
          appartiennent à leurs ayants droit. {SITE_NAME} n’est affilié à aucun
          studio ni diffuseur. Le code, le design et le nom {SITE_NAME} restent
          la propriété de l’éditeur.
        </p>
        <TmdbAttribution />
        <p>
          La photo de profil que vous ajoutez reste la vôtre. Vous nous
          autorisez seulement à l’afficher dans le jeu. Vous garantissez avoir
          le droit de l’utiliser.
        </p>
      </Section>

      <Section title="7. Disponibilité et responsabilité">
        <p>
          Le service est fourni « en l’état », sans garantie de disponibilité
          continue. Il peut être interrompu pour maintenance ou évolution. Il
          peut aussi contenir des erreurs ou être réinitialisé pendant sa phase
          de développement. L’éditeur ne peut être tenu responsable des dommages
          indirects liés à son utilisation, dans les limites permises par la
          loi.
        </p>
      </Section>

      <Section title="8. Suppression du compte">
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis votre profil.
          La suppression efface définitivement vos cartes, vos pièces et vos
          données de jeu.
        </p>
      </Section>

      <Section title="9. Évolution des conditions et droit applicable">
        <p>
          Ces conditions peuvent évoluer. En cas de changement important, les
          joueurs en sont informés dans le jeu. Elles sont soumises au droit
          français. En cas de litige, les juridictions françaises sont
          compétentes, sans préjudice des droits dont vous bénéficiez en tant
          que consommateur.
        </p>
        <p>Contact : {CONTACT_EMAIL}</p>
      </Section>
    </LegalLayout>
  );
}
