'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface FeaturedBannerProps {
  title: string;
  emoji?: string;
  link?: string;
  description?: string;
  onClick?: () => void;
}

export function FeaturedBanner({ title, emoji, link, description, onClick }: FeaturedBannerProps) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-4 bg-primary/5 border-2 border-primary/20 rounded-xl hover:bg-primary/10 transition-colors">
      {emoji && <span className="text-2xl">{emoji}</span>}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base text-foreground truncate">
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link
        href={link as any}
        onClick={onClick}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={cn(onClick && "cursor-pointer")}>
      {content}
    </div>
  );
}
