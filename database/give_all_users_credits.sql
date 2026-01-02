-- ============================================================================
-- Give All Users 1000 Credits
-- 
-- This script adds 1000 credits to all existing users' accounts.
-- It creates proper transaction records for audit purposes.
-- 
-- WARNING: This will affect ALL users in the system.
-- Run this only if you want to give credits to everyone.
-- ============================================================================

DO $$
DECLARE
  v_user_record RECORD;
  v_new_balance INTEGER;
  v_credits_to_add INTEGER := 1000;
  v_users_updated INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting credit distribution: % credits per user', v_credits_to_add;
  
  -- Loop through all users
  FOR v_user_record IN 
    SELECT id FROM auth.users
  LOOP
    -- Ensure user_credits record exists
    INSERT INTO user_credits (user_id, balance, lifetime_earned, lifetime_spent)
    VALUES (v_user_record.id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current balance
    SELECT balance INTO v_new_balance
    FROM user_credits
    WHERE user_id = v_user_record.id;
    
    -- Calculate new balance
    v_new_balance := COALESCE(v_new_balance, 0) + v_credits_to_add;
    
    -- Update balance
    UPDATE user_credits
    SET 
      balance = v_new_balance,
      lifetime_earned = lifetime_earned + v_credits_to_add,
      updated_at = NOW()
    WHERE user_id = v_user_record.id;
    
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
      v_user_record.id,
      v_credits_to_add,
      'bonus',
      'system',
      NULL,
      'Welcome bonus: 1000 credits',
      jsonb_build_object(
        'source', 'bulk_credit_distribution',
        'credits_added', v_credits_to_add,
        'distributed_at', NOW()
      ),
      v_new_balance
    );
    
    v_users_updated := v_users_updated + 1;
  END LOOP;
  
  RAISE NOTICE 'Credit distribution complete!';
  RAISE NOTICE 'Users updated: %', v_users_updated;
  RAISE NOTICE 'Total credits distributed: %', v_users_updated * v_credits_to_add;
END $$;

-- Verify the distribution
SELECT 
  COUNT(*) as total_users,
  SUM(balance) as total_credits,
  AVG(balance) as avg_credits_per_user,
  MIN(balance) as min_credits,
  MAX(balance) as max_credits
FROM user_credits;

