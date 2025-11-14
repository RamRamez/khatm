-- Insert a sample general campaign
INSERT INTO campaigns (name, type, surah_id, is_active, created_at)
VALUES (
  'ختم قرآن کریم',
  'general',
  NULL,
  true,
  NOW()
);

-- Note: To create an admin user, you need to sign up through the forgot password flow
-- or use the Supabase dashboard to create a user manually.
-- The app will automatically create an admin record when a user signs up.

-- If you want to manually create an admin user in Supabase dashboard:
-- 1. Go to Authentication > Users in Supabase dashboard
-- 2. Click "Add user" and create with email and password
-- 3. Copy the user ID
-- 4. Run this query with the actual user ID:

-- INSERT INTO admins (id, email, created_at)
-- VALUES ('YOUR-USER-ID-HERE', 'admin@example.com', NOW());

-- Or you can use this stored procedure to create a complete admin:
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email TEXT,
  user_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    ''
  )
  RETURNING id INTO new_user_id;

  -- Create admin record
  INSERT INTO admins (id, email, created_at)
  VALUES (new_user_id, user_email, NOW());

  result := json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email
  );

  RETURN result;
END;
$$;

-- Create an admin user (change email and password as needed)
SELECT create_admin_user('admin@example.com', 'admin123456');
