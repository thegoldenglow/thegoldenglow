-- Create a function to execute SQL statements (admin only)
-- This allows bypassing the schema cache for operations
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- runs with privileges of function creator
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the query and capture the result
  EXECUTE sql_query INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'code', SQLSTATE);
END;
$$;
