-- Create a function to execute SQL queries for the authentication system
CREATE OR REPLACE FUNCTION execute_sql(sql_query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  param_values text[] := '{}';
  i integer;
  query_with_params text;
  param_placeholder text;
BEGIN
  -- Extract parameters from the jsonb array
  IF jsonb_array_length(params) > 0 THEN
    FOR i IN 0..jsonb_array_length(params)-1 LOOP
      param_values := param_values || params->i::text;
    END LOOP;
    
    -- Replace placeholders in the query with parameters
    query_with_params := sql_query;
    FOR i IN 1..array_length(param_values, 1) LOOP
      param_placeholder := '$' || i::text;
      query_with_params := replace(query_with_params, param_placeholder, param_values[i]);
    END LOOP;
    
    -- Execute the query with parameters
    EXECUTE query_with_params INTO result;
  ELSE
    -- Execute the query without parameters
    EXECUTE sql_query INTO result;
  END IF;
  
  -- Return the result as jsonb
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE,
    'query', sql_query
  );
END;
$$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION execute_sql(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text, jsonb) TO anon; 