-- Trigger per sincronizzare nuovi utenti da auth.users a public.users
-- Questo trigger viene eseguito automaticamente quando un utente si registra tramite Supabase Auth

-- Funzione che gestisce la creazione di un nuovo utente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Inserisce una nuova riga nella tabella public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    tenant_id,
    role,
    verification_status,
    onboarding_completed,
    onboarding_step,
    created_at
  )
  VALUES (
    NEW.id,                                                    -- ID dall'utente auth
    NEW.email,                                                 -- Email dall'utente auth
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),     -- Nome dai metadata, altrimenti email
    'prato-rinaldo-default',                                   -- Tenant di default
    'user',                                                    -- Ruolo di default
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'verified'
      ELSE 'pending'
    END,                                                       -- Stato di verifica
    false,                                                     -- Onboarding non completato
    1,                                                         -- Primo step dell'onboarding
    NOW()                                                      -- Data di creazione
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rimuove il trigger esistente se presente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crea il trigger che esegue la funzione dopo ogni INSERT su auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Commento per documentazione
COMMENT ON FUNCTION public.handle_new_user() IS 'Sincronizza automaticamente i nuovi utenti da auth.users a public.users';

