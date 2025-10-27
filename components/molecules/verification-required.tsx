import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/utils/constants';
import { ShieldAlert } from 'lucide-react';

interface VerificationRequiredProps {
  title?: string;
  message: string;
}

export function VerificationRequired({
  title = 'Verifica richiesta',
  message,
}: VerificationRequiredProps) {
  return (
    <div className="container flex min-h-[600px] items-center justify-center py-12">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href={ROUTES.PROFILE}>Vai al Profilo</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
