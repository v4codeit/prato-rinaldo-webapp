import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';

const footerLinks = {
  about: [
    { label: 'Chi Siamo', href: '/about' as const },
    { label: 'La Community', href: '/community' as const },
    { label: 'Statuto', href: '/statute' as const },
  ],
  quick: [
    { label: 'Eventi', href: ROUTES.EVENTS },
    { label: 'Articoli', href: ROUTES.ARTICLES },
    { label: 'Marketplace', href: ROUTES.MARKETPLACE },
    { label: 'Community Pro', href: ROUTES.COMMUNITY_PRO },
    { label: 'Bacheca Pubblica', href: ROUTES.FEED },
  ] as const,
  info: [
    { label: 'Contatti', href: '/contacts' as const },
    { label: 'Privacy Policy', href: '/privacy' as const },
    { label: 'Termini di Servizio', href: '/terms' as const },
  ],
} as const;

type SocialLinks = {
  facebook: string;
  instagram: string;
  twitter: string;
};

export function Footer({ socialLinks }: { socialLinks: SocialLinks }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/assets/logos/logo-pratorinaldo.png"
                alt={APP_NAME}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                sizes="32px"
              />
              <h3 className="font-semibold">{APP_NAME}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Piattaforma digitale per la community del Comitato di Quartiere Prato Rinaldo.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Link Rapidi</h3>
            <ul className="space-y-2">
              {footerLinks.quick.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as any}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="font-semibold mb-4">Chi Siamo</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4">Informazioni</h3>
            <ul className="space-y-2">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {APP_NAME}. Tutti i diritti riservati.
            </p>
            <div className="flex items-center gap-4">
              {/* Social media links - dynamic from database */}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}

              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}

              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
