-- Create a function to run dynamic SQL queries
-- This function will be used by better-auth to execute SQL queries
CREATE OR REPLACE FUNCTION run_sql_query(query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  param_values text[] := '{}';
  i integer;
BEGIN
  -- Extract parameters from the jsonb array
  IF jsonb_array_length(params) > 0 THEN
    FOR i IN 0..jsonb_array_length(params)-1 LOOP
      param_values := param_values || jsonb_extract_path_text(params, i::text)::text;
    END LOOP;
  END IF;

  -- Execute the dynamic SQL with parameters
  EXECUTE query INTO result USING param_values;
  
  -- Return the result as jsonb
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE,
    'query', query
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION run_sql_query(text, jsonb) TO authenticated; 