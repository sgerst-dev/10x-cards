-- Migration: Add stored procedure for saving generated flashcards
-- This function performs both insert and update operations in a single transaction

CREATE OR REPLACE FUNCTION save_generated_flashcards(
  p_user_id UUID,
  p_generation_id UUID,
  p_flashcards JSONB
)
RETURNS TABLE (
  id UUID,
  front VARCHAR(250),
  back VARCHAR(500),
  source flashcard_source,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_accepted_count INT;
  v_accepted_edited_count INT;
  v_current_accepted_count INT;
  v_current_accepted_edited_count INT;
BEGIN
  -- Check if generation session exists and belongs to user
  SELECT 
    COALESCE(accepted_count, 0),
    COALESCE(accepted_edited_count, 0)
  INTO 
    v_current_accepted_count,
    v_current_accepted_edited_count
  FROM generation_sessions
  WHERE generation_sessions.id = p_generation_id 
    AND generation_sessions.user_id = p_user_id;

  -- If not found, raise exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation session not found';
  END IF;

  -- Protection against saving flashcards multiple times
  IF v_current_accepted_count > 0 OR v_current_accepted_edited_count > 0 THEN
    RAISE EXCEPTION 'Flashcards from this generation session have already been saved';
  END IF;

  -- Calculate counts
  SELECT 
    COUNT(*) FILTER (WHERE (value->>'source')::TEXT = 'ai_generated'),
    COUNT(*) FILTER (WHERE (value->>'source')::TEXT = 'ai_edited')
  INTO 
    v_accepted_count,
    v_accepted_edited_count
  FROM jsonb_array_elements(p_flashcards) AS value;

  -- Insert flashcards and return results
  RETURN QUERY
  INSERT INTO flashcards (user_id, generation_id, front, back, source)
  SELECT 
    p_user_id,
    p_generation_id,
    (value->>'front')::TEXT,
    (value->>'back')::TEXT,
    (value->>'source')::flashcard_source
  FROM jsonb_array_elements(p_flashcards) AS value
  RETURNING 
    flashcards.id,
    flashcards.front,
    flashcards.back,
    flashcards.source,
    flashcards.created_at,
    flashcards.updated_at;

  -- Update generation session
  UPDATE generation_sessions
  SET 
    accepted_count = v_accepted_count,
    accepted_edited_count = v_accepted_edited_count
  WHERE generation_sessions.id = p_generation_id 
    AND generation_sessions.user_id = p_user_id;

END;
$$;
