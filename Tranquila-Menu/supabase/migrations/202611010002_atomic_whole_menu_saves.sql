-- Whole-menu category/template saves must not commit independently of their audit.
CREATE OR REPLACE FUNCTION public.tranquila_admin_save_menu(
  p_branch text,
  p_actor uuid,
  p_menu jsonb,
  p_publish boolean,
  p_fallback_menu jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $fn$
DECLARE
  v_row public.tranquila_branch_cms%ROWTYPE;
  v_previous jsonb;
  v_action text;
BEGIN
  IF p_branch NOT IN ('tranquila','tranquila-nest') OR p_branch IS NULL THEN
    RAISE EXCEPTION 'Invalid hotel branch' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.tranquila_staff WHERE id=p_actor AND active=true) THEN
    RAISE EXCEPTION 'Active staff account required' USING ERRCODE='42501';
  END IF;
  IF jsonb_typeof(p_menu->'items') IS DISTINCT FROM 'array' OR
     jsonb_typeof(p_menu->'categories') IS DISTINCT FROM 'array' OR
     jsonb_array_length(p_menu->'items')>500 OR
     jsonb_array_length(p_menu->'categories')>50 THEN
    RAISE EXCEPTION 'Invalid menu document' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_row FROM public.tranquila_branch_cms WHERE branch_id=p_branch FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Hotel menu configuration missing' USING ERRCODE='22023'; END IF;
  v_previous := CASE WHEN p_publish THEN
    CASE WHEN v_row.published_initialized THEN v_row.published_menu ELSE p_fallback_menu END
  ELSE
    CASE WHEN v_row.draft_initialized THEN v_row.menu ELSE p_fallback_menu END END;
  IF jsonb_typeof(v_previous->'items') IS DISTINCT FROM 'array' OR
     jsonb_typeof(v_previous->'categories') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Valid menu fallback required' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.tranquila_menu_backups(branch_id,menu,created_by,reason)
    VALUES(p_branch,v_previous,p_actor,CASE WHEN p_publish THEN 'before menu publish' ELSE 'before menu draft save' END);
  IF p_publish THEN
    UPDATE public.tranquila_branch_cms SET
      menu=p_menu, published_menu=p_menu, draft_initialized=true,
      published_initialized=true,published_at=now(),updated_at=now()
    WHERE branch_id=p_branch;
    v_action:='menu_published';
  ELSE
    UPDATE public.tranquila_branch_cms SET menu=p_menu,draft_initialized=true,updated_at=now()
    WHERE branch_id=p_branch;
    v_action:='menu_draft_saved';
  END IF;
  INSERT INTO public.tranquila_audit_log(staff_id,action,details)
    VALUES(p_actor,v_action,jsonb_build_object('branch_id',p_branch,
        'item_count',jsonb_array_length(p_menu->'items'),
        'category_count',jsonb_array_length(p_menu->'categories')));
  RETURN jsonb_build_object('ok',true,'action',v_action,'branch',p_branch);
END
$fn$;

REVOKE ALL ON FUNCTION public.tranquila_admin_save_menu(text,uuid,jsonb,boolean,jsonb)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tranquila_admin_save_menu(text,uuid,jsonb,boolean,jsonb)
  TO service_role;
SELECT pg_notify('pgrst','reload schema');
