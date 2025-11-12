/*
  # Fix get_suggested_candidates function

  1. Drop existing function with incorrect signature
  2. Create new function with correct return type and array operators
  3. Function returns suggested candidates based on skill matching
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_suggested_candidates(uuid);

-- Create the function with correct signature and operators
CREATE OR REPLACE FUNCTION get_suggested_candidates(job_id uuid)
RETURNS TABLE (
  candidate_id uuid,
  candidate_name text,
  candidate_email text,
  experience_years integer,
  expected_rate numeric,
  matching_skills text[],
  match_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as candidate_id,
    c.name as candidate_name,
    c.email as candidate_email,
    c.experience_years,
    c.expected_rate,
    ARRAY(
      SELECT unnest(c.skills) 
      INTERSECT 
      SELECT unnest(jo.required_skills)
    ) as matching_skills,
    CASE 
      WHEN array_length(c.skills, 1) > 0 AND array_length(jo.required_skills, 1) > 0 THEN
        ROUND(
          (array_length(ARRAY(
            SELECT unnest(c.skills) 
            INTERSECT 
            SELECT unnest(jo.required_skills)
          ), 1)::numeric / array_length(jo.required_skills, 1)::numeric) * 100
        )::integer
      ELSE 0
    END as match_score
  FROM candidates c
  CROSS JOIN job_orders jo
  WHERE jo.id = job_id
    AND c.status = 'available'
    AND c.skills && jo.required_skills  -- Use && for array overlap
    AND NOT EXISTS (
      SELECT 1 FROM submissions s 
      WHERE s.candidate_id = c.id 
      AND s.job_order_id = job_id
    )
  ORDER BY match_score DESC, c.experience_years DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;