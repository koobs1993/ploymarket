-- Default platform admin: admin@goatfunded.com / password123
-- Sign in with username "admin" (maps to admin@goatfunded.com in the app).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid;
  admin_email text := 'admin@goatfunded.com';
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt('password123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"admin","is_admin":true}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      admin_id,
      format('{"sub":"%s","email":"%s"}', admin_id, admin_email)::jsonb,
      'email',
      admin_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE public.profiles
    SET
      is_admin = true,
      display_name = COALESCE(display_name, 'admin')
    WHERE id = admin_id;
  END IF;
END $$;
