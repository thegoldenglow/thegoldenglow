-- Remove the dangerous execute_sql function that allows arbitrary SQL execution
-- This function poses a critical security vulnerability as it allows:
-- 1. Arbitrary SQL execution with elevated privileges (SECURITY DEFINER)
-- 2. No input validation or access control
-- 3. Potential for complete database compromise

DROP FUNCTION IF EXISTS execute_sql(TEXT);

-- Log the removal for audit purposes
DO $$
BEGIN
    RAISE NOTICE 'Removed dangerous execute_sql function for security reasons';
END
$$;