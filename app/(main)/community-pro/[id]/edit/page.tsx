import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfessionalById } from '@/app/actions/service-profiles';
import ProfessionalEditForm from './professional-edit-form';

export default async function EditProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load professional profile
  const { professional } = await getProfessionalById(id);

  if (!professional) {
    notFound();
  }

  // Check ownership
  if (professional.user_id !== user.id) {
    notFound();
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Modifica Profilo Professionale</h1>
          <p className="text-muted-foreground">
            Aggiorna le informazioni del tuo profilo professionale
          </p>
        </div>

        <ProfessionalEditForm professional={professional as any} />
      </div>
    </div>
  );
}
