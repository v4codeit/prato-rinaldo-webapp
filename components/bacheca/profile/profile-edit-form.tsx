'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Crown } from 'lucide-react';
import { updateProfile } from '@/app/actions/users';
import type { UserProfile } from '@/types/bacheca';

interface ProfileEditFormProps {
  userProfile: UserProfile;
}

/**
 * Profile Edit Form Component
 *
 * Allows users to edit their profile information with validation and real-time feedback.
 * Displays verification status and membership type badges.
 *
 * Features:
 * - Client-side validation (name required, bio max 500 chars, phone format)
 * - Server action with useTransition for loading state
 * - Toast notifications for success/error
 * - Disabled email field (display only)
 * - Verification status badge
 * - Membership type display
 *
 * @example
 * <ProfileEditForm userProfile={user} />
 */
export function ProfileEditForm({ userProfile }: ProfileEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: userProfile.name || '',
    bio: userProfile.bio || '',
    phone: userProfile.phone || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Il nome deve contenere almeno 2 caratteri';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'La bio non può superare 500 caratteri';
    }

    if (formData.phone && !/^[+]?[\d\s()-]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato telefono non valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Correggi gli errori nel modulo');
      return;
    }

    startTransition(async () => {
      try {
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('bio', formData.bio);
        formDataObj.append('phone', formData.phone);

        const result = await updateProfile(formDataObj);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Profilo aggiornato con successo!');
          router.refresh();
        }
      } catch (error) {
        toast.error('Errore durante l\'aggiornamento del profilo');
      }
    });
  };

  // Verification status config
  const verificationConfig = {
    pending: {
      icon: Clock,
      label: 'In attesa',
      variant: 'secondary' as const,
      color: 'text-yellow-600',
    },
    approved: {
      icon: CheckCircle2,
      label: 'Verificato',
      variant: 'default' as const,
      color: 'text-green-600',
    },
    rejected: {
      icon: XCircle,
      label: 'Rifiutato',
      variant: 'destructive' as const,
      color: 'text-red-600',
    },
  };

  const verificationStatus = verificationConfig[userProfile.verification_status as keyof typeof verificationConfig];
  const VerificationIcon = verificationStatus.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Modifica Profilo</CardTitle>
            <CardDescription>
              Aggiorna le tue informazioni personali
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant={verificationStatus.variant} className="w-fit">
              <VerificationIcon className={`h-3 w-3 mr-1 ${verificationStatus.color}`} />
              {verificationStatus.label}
            </Badge>
            {userProfile.membership_type && (
              <Badge variant="outline" className="w-fit">
                <Crown className="h-3 w-3 mr-1 text-amber-600" />
                {userProfile.membership_type}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Il tuo nome"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={errors.name ? 'border-destructive' : ''}
              disabled={isPending}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Email (disabled) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userProfile.email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              L'email non può essere modificata
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+39 123 456 7890"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              className={errors.phone ? 'border-destructive' : ''}
              disabled={isPending}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">
              Bio
              <span className="text-muted-foreground text-xs ml-2">
                ({formData.bio.length}/500 caratteri)
              </span>
            </Label>
            <Textarea
              id="bio"
              placeholder="Raccontaci qualcosa di te..."
              value={formData.bio}
              onChange={(e) => {
                setFormData({ ...formData, bio: e.target.value });
                if (errors.bio) setErrors({ ...errors, bio: '' });
              }}
              className={`resize-none min-h-[100px] ${errors.bio ? 'border-destructive' : ''}`}
              disabled={isPending}
              maxLength={500}
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              'Salva Modifiche'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
