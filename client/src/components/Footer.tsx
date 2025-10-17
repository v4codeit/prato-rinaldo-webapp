import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{APP_TITLE}</h3>
            <p className="text-sm text-muted-foreground">
              Piattaforma del comitato cittadini di Prato Rinaldo, frazione tra San Cesareo e Zagarolo.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold">Link Rapidi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/eventi">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Eventi
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/marketplace">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Marketplace
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h4 className="font-semibold">Informazioni</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/chi-siamo">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Chi Siamo
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contatti">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Contatti
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-3">
            <h4 className="font-semibold">Seguici</h4>
            <p className="text-sm text-muted-foreground">
              Resta aggiornato sulle novità della nostra comunità.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {APP_TITLE}. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
}

