-- Create a function to execute arbitrary SQL queries for administrative purposes
-- This function allows bypassing the schema cache by running queries directly
-- against the database

CREATE OR REPLACE FUNCTION postgrest_rpc(query TEXT) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- runs with the privileges of the function creator
AS $$
BEGIN
  EXECUTE query;
END;
$$;
