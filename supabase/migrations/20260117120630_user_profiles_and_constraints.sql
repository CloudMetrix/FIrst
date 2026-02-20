-- User Profiles and Data Isolation Enhancement
-- Migration: 20260117120630_user_profiles_and_constraints.sql
-- Purpose: Add user_profiles table and enforce proper data isolation

-- 1. Create user_profiles table as intermediary between auth.users and public schema
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes for user_profiles
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- 3. Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy for user_profiles (Pattern 1: Core User Tables)
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 5. Create trigger function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$;

-- 6. Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Create mock auth users for testing (with complete field structure)
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    user_uuid UUID := gen_random_uuid();
BEGIN
    -- Only create if no users exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email LIKE '%@example.com') THEN
        -- Create admin user
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES
            (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             'admin@example.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
             '{"full_name": "Admin User", "role": "admin"}'::jsonb,
             '{"provider": "email", "providers": ["email"]}'::jsonb,
             false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
            (user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             'user@example.com', crypt('user123', gen_salt('bf', 10)), now(), now(), now(),
             '{"full_name": "Regular User", "role": "user"}'::jsonb,
             '{"provider": "email", "providers": ["email"]}'::jsonb,
             false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);
        
        RAISE NOTICE 'Mock users created: admin@example.com / admin123, user@example.com / user123';
        RAISE NOTICE 'User profiles will be created automatically by trigger';
    END IF;
END $$;

-- 8. Migrate existing data to user_profiles BEFORE adding foreign key constraints
-- Create user profiles for existing user_ids in the database
DO $$
DECLARE
    existing_user_id UUID;
    user_email TEXT;
BEGIN
    -- Get all unique user_ids from existing tables
    FOR existing_user_id IN
        SELECT DISTINCT user_id FROM public.contracts WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM public.invoices WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM public.alert_configurations WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM public.alert_history WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM public.contract_documents WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM public.schema_configurations WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM public.field_definitions WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM public.dynamic_field_values WHERE user_id IS NOT NULL
    LOOP
        -- Check if this user exists in auth.users
        SELECT email INTO user_email FROM auth.users WHERE id = existing_user_id;
        
        IF user_email IS NOT NULL THEN
            -- Create user profile if it doesn't exist
            INSERT INTO public.user_profiles (id, email, full_name, role)
            VALUES (
                existing_user_id,
                user_email,
                split_part(user_email, '@', 1),
                'user'
            )
            ON CONFLICT (id) DO NOTHING;
        ELSE
            -- User doesn't exist in auth.users, create a placeholder auth user first
            INSERT INTO auth.users (
                id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
                is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
                recovery_token, recovery_sent_at, email_change_token_new, email_change,
                email_change_sent_at, email_change_token_current, email_change_confirm_status,
                reauthentication_token, reauthentication_sent_at, phone, phone_change,
                phone_change_token, phone_change_sent_at
            ) VALUES (
                existing_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
                'migrated_' || existing_user_id || '@placeholder.com', crypt(gen_random_uuid()::text, gen_salt('bf', 10)),
                now(), now(), now(),
                '{"full_name": "Migrated User", "role": "user"}'::jsonb,
                '{"provider": "email", "providers": ["email"]}'::jsonb,
                false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
            )
            ON CONFLICT (id) DO NOTHING;
            
            -- Now create the user profile (trigger will handle it, but we ensure it exists)
            INSERT INTO public.user_profiles (id, email, full_name, role)
            VALUES (
                existing_user_id,
                'migrated_' || existing_user_id || '@placeholder.com',
                'Migrated User',
                'user'
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'User profiles migration completed';
END $$;

-- 9. NOW add foreign key constraints to existing tables (after data migration)
-- Note: user_id columns already exist in all tables, we're just adding the FK constraint
ALTER TABLE public.contracts
ADD CONSTRAINT fk_contracts_user_id
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.invoices
ADD CONSTRAINT fk_invoices_user_id
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.alert_configurations
ADD CONSTRAINT fk_alert_configurations_user_id
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.alert_history
ADD CONSTRAINT fk_alert_history_user_id
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.contract_documents
ADD CONSTRAINT fk_contract_documents_user_id
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.schema_configurations
ADD CONSTRAINT fk_schema_configurations_user_id
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.field_definitions
ADD CONSTRAINT fk_field_definitions_user_id
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.dynamic_field_values
ADD CONSTRAINT fk_dynamic_field_values_user_id
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- 10. Create function to update user_profiles updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 11. Create trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_timestamp
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- 12. Create cleanup function for test data
CREATE OR REPLACE FUNCTION public.cleanup_test_users()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_ids_to_delete UUID[];
BEGIN
    -- Get all test user IDs
    SELECT ARRAY_AGG(id) INTO auth_user_ids_to_delete
    FROM auth.users
    WHERE email LIKE '%@example.com';

    -- Delete in dependency order (children first)
    DELETE FROM public.dynamic_field_values WHERE user_id = ANY(auth_user_ids_to_delete);
    DELETE FROM public.field_definitions WHERE user_id = ANY(auth_user_ids_to_delete);
    DELETE FROM public.schema_configurations WHERE user_id = ANY(auth_user_ids_to_delete);
    DELETE FROM public.contract_documents WHERE user_id = ANY(auth_user_ids_to_delete);
    DELETE FROM public.alert_history WHERE user_id = ANY(auth_user_ids_to_delete);
    DELETE FROM public.alert_configurations WHERE user_id = ANY(auth_user_ids_to_delete);
    DELETE FROM public.invoices WHERE user_id = ANY(auth_user_ids_to_delete);
    DELETE FROM public.contracts WHERE user_id = ANY(auth_user_ids_to_delete);
    DELETE FROM public.user_profiles WHERE id = ANY(auth_user_ids_to_delete);
    DELETE FROM auth.users WHERE id = ANY(auth_user_ids_to_delete);
    
    RAISE NOTICE 'Test users and related data cleaned up successfully';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key constraint prevents deletion: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Cleanup failed: %', SQLERRM;
END;
$$;