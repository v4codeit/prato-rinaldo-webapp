import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { User } from 'lucide-react';

export interface UserCardProps {
  name: string;
  email?: string;
  avatar?: string | null;
  role?: string;
  bio?: string | null;
  className?: string;
  onClick?: () => void;
}

/**
 * UserCard - Molecule component
 * Display user info with avatar, name, role
 * Used in directories, member lists, etc.
 */
export function UserCard({
  name,
  email,
  avatar,
  role,
  bio,
  className,
  onClick,
}: UserCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{name}</h3>
              {role && (
                <Badge variant="secondary" className="text-xs">
                  {role}
                </Badge>
              )}
            </div>
            {email && (
              <p className="text-sm text-muted-foreground truncate">{email}</p>
            )}
            {bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
