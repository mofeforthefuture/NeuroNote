-- ============================================================================
-- Give Credits to Specific User(s)
-- 
-- Use this script to give credits to specific users by email or user ID
-- ============================================================================

-- Option 1: Give credits to a user by email
-- Replace 'user@example.com' with the actual email
DO $$
DECLARE
  v_user_id UUID;
  v_credits_to_add INTEGER := 1000;
  v_new_balance INTEGER;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'user@example.com'; -- CHANGE THIS EMAIL
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: user@example.com';
  END IF;
  
  -- Ensure user_credits record exists
  INSERT INTO user_credits (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (v_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance
  SELECT balance INTO v_new_balance
  FROM user_credits
  WHERE user_id = v_user_id;
  
  -- Calculate new balance
  v_new_balance := COALESCE(v_new_balance, 0) + v_credits_to_add;
  
  -- Update balance
  UPDATE user_credits
  SET 
    balance = v_new_balance,
    lifetime_earned = lifetime_earned + v_credits_to_add,
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_type,
    reference_id,
    description,
    metadata,
    balance_after
  ) VALUES (
    v_user_id,
    v_credits_to_add,
    'bonus',
    'system',
    NULL,
    'Manual credit grant: ' || v_credits_to_add || ' credits',
    jsonb_build_object(
      'source', 'manual_grant',
      'credits_added', v_credits_to_add,
      'granted_at', NOW()
    ),
    v_new_balance
  );
  
  RAISE NOTICE 'Credits granted successfully!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Credits added: %', v_credits_to_add;
  RAISE NOTICE 'New balance: %', v_new_balance;
END $$;

-- Option 2: Give credits to a user by user ID (UUID)
-- Uncomment and replace the UUID below
/*
DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- CHANGE THIS UUID
  v_credits_to_add INTEGER := 1000;
  v_new_balance INTEGER;
BEGIN
  -- Ensure user_credits record exists
  INSERT INTO user_credits (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (v_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance
  SELECT balance INTO v_new_balance
  FROM user_credits
  WHERE user_id = v_user_id;
  
  -- Calculate new balance
  v_new_balance := COALESCE(v_new_balance, 0) + v_credits_to_add;
  
  -- Update balance
  UPDATE user_credits
  SET 
    balance = v_new_balance,
    lifetime_earned = lifetime_earned + v_credits_to_add,
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_type,
    reference_id,
    description,
    metadata,
    balance_after
  ) VALUES (
    v_user_id,
    v_credits_to_add,
    'bonus',
    'system',
    NULL,
    'Manual credit grant: ' || v_credits_to_add || ' credits',
    jsonb_build_object(
      'source', 'manual_grant',
      'credits_added', v_credits_to_add,
      'granted_at', NOW()
    ),
    v_new_balance
  );
  
  RAISE NOTICE 'Credits granted successfully!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Credits added: %', v_credits_to_add;
  RAISE NOTICE 'New balance: %', v_new_balance;
END $$;
*/

