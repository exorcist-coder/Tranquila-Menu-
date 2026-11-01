-- Atomic admin state transitions: a single PostgreSQL transaction per RPC call.
-- SECURITY INVOKER plus EXECUTE restricted to service_role; never callable by browsers.
CREATE OR REPLACE FUNCTION public.tranquila_admin_action(
  p_action text,
  p_branch text,
  p_actor uuid,
  p_item jsonb DEFAULT NULL,
  p_item_id text DEFAULT NULL,
  p_revision_id bigint DEFAULT NULL,
  p_fallback_menu jsonb DEFAULT NULL,
  p_available boolean DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $fn$
DECLARE
  v_role text;
  v_row public.tranquila_branch_cms%ROWTYPE;
  v_live jsonb;
  v_work jsonb;
  v_item jsonb;
  v_id text;
  v_array jsonb;
  v_found boolean;
  v_revision jsonb;
  v_action_name text;
  v_details jsonb;
BEGIN
  IF p_branch NOT IN ('tranquila','tranquila-nest') OR p_branch IS NULL THEN
    RAISE EXCEPTION 'Invalid hotel branch' USING ERRCODE='22023';
  END IF;
  SELECT role INTO v_role FROM public.tranquila_staff WHERE id=p_actor AND active=true;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Active staff account required' USING ERRCODE='42501'; END IF;
  IF p_action NOT IN ('save_draft','discard_draft','publish_draft','archive','restore','delete_permanently','restore_revision','set_availability')
      OR p_action IS NULL THEN
    RAISE EXCEPTION 'Unsupported admin action' USING ERRCODE='22023';
  END IF;
  IF p_action IN ('delete_permanently','restore_revision') AND v_role <> 'admin' THEN
    RAISE EXCEPTION 'Administrator role required' USING ERRCODE='42501';
  END IF;

  -- Serialize menu and inventory mutations in this hotel only.
  SELECT * INTO v_row FROM public.tranquila_branch_cms WHERE branch_id=p_branch FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Hotel menu configuration missing' USING ERRCODE='22023'; END IF;
  v_live := CASE WHEN v_row.published_initialized THEN v_row.published_menu ELSE p_fallback_menu END;
  v_work := CASE WHEN v_row.draft_initialized THEN v_row.menu ELSE p_fallback_menu END;
  IF jsonb_typeof(v_live->'items') IS DISTINCT FROM 'array'
     OR jsonb_typeof(v_work->'items') IS DISTINCT FROM 'array'
     OR jsonb_typeof(v_live->'categories') IS DISTINCT FROM 'array'
     OR jsonb_typeof(v_work->'categories') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Valid menu fallback required' USING ERRCODE='22023';
  END IF;

  v_id := nullif(trim(coalesce(p_item_id,p_item->>'id','')), '');
  IF p_action IN ('save_draft','discard_draft','publish_draft','archive','restore','delete_permanently','set_availability') THEN
    IF v_id IS NULL OR length(v_id)>150 THEN RAISE EXCEPTION 'Valid item ID required' USING ERRCODE='22023'; END IF;
  END IF;

  IF p_action='save_draft' THEN
    IF p_item IS NULL OR jsonb_typeof(p_item)<>'object' OR
       p_item->>'id' IS DISTINCT FROM v_id OR
       nullif(trim(p_item->>'name'),'') IS NULL OR
       nullif(trim(p_item->>'category'),'') IS NULL OR
       jsonb_typeof(p_item->'basePrice') IS DISTINCT FROM 'number' OR
       (p_item->>'basePrice')::numeric < 0 OR
       jsonb_typeof(p_item->'groups') IS DISTINCT FROM 'array' THEN
       RAISE EXCEPTION 'Invalid menu draft' USING ERRCODE='22023';
    END IF;
    v_item := p_item - 'available';
    INSERT INTO public.tranquila_item_drafts(branch_id,item_id,item,updated_by,updated_at)
    VALUES(p_branch,v_id,v_item,p_actor,now())
    ON CONFLICT(branch_id,item_id) DO UPDATE SET
      item=EXCLUDED.item,updated_by=EXCLUDED.updated_by,updated_at=now();
    v_action_name:='item_draft_saved';
    v_details:=jsonb_build_object('item_id',v_id,'name',v_item->>'name');

  ELSIF p_action='discard_draft' THEN
    DELETE FROM public.tranquila_item_drafts WHERE branch_id=p_branch AND item_id=v_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Draft not found' USING ERRCODE='22023'; END IF;
    v_action_name:='item_draft_discarded';
    v_details:=jsonb_build_object('item_id',v_id);

  ELSIF p_action='set_availability' THEN
    IF p_available IS NULL THEN RAISE EXCEPTION 'Availability value required' USING ERRCODE='22023'; END IF;
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v_live->'items') i WHERE i->>'id'=v_id)
       THEN RAISE EXCEPTION 'Item is not published in this hotel' USING ERRCODE='22023'; END IF;
    INSERT INTO public.tranquila_item_availability(branch_id,item_id,available,updated_by,updated_at)
    VALUES(p_branch,v_id,p_available,p_actor,now())
    ON CONFLICT(branch_id,item_id) DO UPDATE SET
      available=EXCLUDED.available,updated_by=EXCLUDED.updated_by,updated_at=now();
    v_action_name:=CASE WHEN p_available THEN 'item_restocked' ELSE 'item_marked_sold_out' END;
    v_details:=jsonb_build_object('item_id',v_id,'available',p_available);

  ELSIF p_action IN ('publish_draft','restore') THEN
    IF p_action='publish_draft' THEN
      SELECT item INTO v_item FROM public.tranquila_item_drafts WHERE branch_id=p_branch AND item_id=v_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Draft not found' USING ERRCODE='22023'; END IF;
      v_action_name:='item_published';
    ELSE
      SELECT item INTO v_item FROM public.tranquila_archived_items WHERE branch_id=p_branch AND item_id=v_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Archived item not found' USING ERRCODE='22023'; END IF;
      v_action_name:='item_restored';
    END IF;
    INSERT INTO public.tranquila_menu_backups(branch_id,menu,created_by,reason)
      VALUES(p_branch,v_live,p_actor,'Before '||v_action_name||': '||v_id);
    -- Replace existing item in place (preserving order), or append if new.
    SELECT coalesce(jsonb_agg(CASE WHEN value->>'id'=v_id THEN v_item ELSE value END ORDER BY ord),'[]'::jsonb),
           coalesce(bool_or(value->>'id'=v_id),false)
    INTO v_array,v_found
    FROM jsonb_array_elements(v_live->'items') WITH ORDINALITY AS x(value,ord);
    v_live:=jsonb_set(v_live,'{items}',CASE WHEN v_found THEN v_array ELSE v_array||jsonb_build_array(v_item) END);
    SELECT coalesce(jsonb_agg(CASE WHEN value->>'id'=v_id THEN v_item ELSE value END ORDER BY ord),'[]'::jsonb),
           coalesce(bool_or(value->>'id'=v_id),false)
    INTO v_array,v_found
    FROM jsonb_array_elements(v_work->'items') WITH ORDINALITY AS x(value,ord);
    v_work:=jsonb_set(v_work,'{items}',CASE WHEN v_found THEN v_array ELSE v_array||jsonb_build_array(v_item) END);
    UPDATE public.tranquila_branch_cms
    SET published_menu=v_live, menu=v_work, published_initialized=true,
        draft_initialized=true,published_at=now(),updated_at=now()
    WHERE branch_id=p_branch;
    IF p_action='publish_draft' THEN
      DELETE FROM public.tranquila_item_drafts WHERE branch_id=p_branch AND item_id=v_id;
      -- Re-publishing an archived ID should not leave a stale archive record.
      DELETE FROM public.tranquila_archived_items WHERE branch_id=p_branch AND item_id=v_id;
    ELSE
      DELETE FROM public.tranquila_archived_items WHERE branch_id=p_branch AND item_id=v_id;
    END IF;
    v_details:=jsonb_build_object('item_id',v_id,'count',jsonb_array_length(v_live->'items'));

  ELSIF p_action='archive' THEN
    SELECT value INTO v_item FROM jsonb_array_elements(v_live->'items') AS x(value)
      WHERE value->>'id'=v_id LIMIT 1;
    IF v_item IS NULL THEN RAISE EXCEPTION 'Published item not found' USING ERRCODE='22023'; END IF;
    INSERT INTO public.tranquila_archived_items(branch_id,item_id,item,archived_by,archived_at)
      VALUES(p_branch,v_id,v_item - 'available',p_actor,now())
    ON CONFLICT(branch_id,item_id) DO UPDATE SET
      item=EXCLUDED.item,archived_by=EXCLUDED.archived_by,archived_at=now();
    INSERT INTO public.tranquila_menu_backups(branch_id,menu,created_by,reason)
      VALUES(p_branch,v_live,p_actor,'Before item_archived: '||v_id);
    SELECT coalesce(jsonb_agg(value ORDER BY ord),'[]'::jsonb) INTO v_array
    FROM jsonb_array_elements(v_live->'items') WITH ORDINALITY AS x(value,ord)
    WHERE value->>'id'<>v_id;
    v_live:=jsonb_set(v_live,'{items}',v_array);
    SELECT coalesce(jsonb_agg(value ORDER BY ord),'[]'::jsonb) INTO v_array
    FROM jsonb_array_elements(v_work->'items') WITH ORDINALITY AS x(value,ord)
    WHERE value->>'id'<>v_id;
    v_work:=jsonb_set(v_work,'{items}',v_array);
    UPDATE public.tranquila_branch_cms
    SET published_menu=v_live,menu=v_work,published_initialized=true,
        draft_initialized=true,published_at=now(),updated_at=now()
    WHERE branch_id=p_branch;
    DELETE FROM public.tranquila_item_drafts WHERE branch_id=p_branch AND item_id=v_id;
    v_action_name:='item_archived';
    v_details:=jsonb_build_object('item_id',v_id,'count',jsonb_array_length(v_live->'items'));

  ELSIF p_action='delete_permanently' THEN
    DELETE FROM public.tranquila_archived_items WHERE branch_id=p_branch AND item_id=v_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Archive the item before permanently deleting it' USING ERRCODE='22023'; END IF;
    v_action_name:='item_permanently_deleted';
    v_details:=jsonb_build_object('item_id',v_id);

  ELSIF p_action='restore_revision' THEN
    IF p_revision_id IS NULL OR p_revision_id < 1 THEN
      RAISE EXCEPTION 'Valid revision required' USING ERRCODE='22023';
    END IF;
    SELECT menu INTO v_revision FROM public.tranquila_menu_backups WHERE branch_id=p_branch AND id=p_revision_id;
    IF NOT FOUND OR jsonb_typeof(v_revision->'items')<>'array' OR jsonb_typeof(v_revision->'categories')<>'array' THEN
      RAISE EXCEPTION 'Recovery snapshot not found or invalid' USING ERRCODE='22023';
    END IF;
    INSERT INTO public.tranquila_menu_backups(branch_id,menu,created_by,reason)
      VALUES(p_branch,v_live,p_actor,'Before restoring revision '||p_revision_id);
    UPDATE public.tranquila_branch_cms
    SET published_menu=v_revision,menu=v_revision,published_initialized=true,draft_initialized=true,
        published_at=now(),updated_at=now()
    WHERE branch_id=p_branch;
    v_action_name:='menu_revision_restored';
    v_details:=jsonb_build_object('revision_id',p_revision_id);
  END IF;

  -- If this INSERT fails, PostgreSQL automatically rolls back every prior write
  -- in this function call (including draft/menu/archive/inventory mutations).
  INSERT INTO public.tranquila_audit_log(staff_id,action,details)
  VALUES(p_actor,v_action_name,v_details||jsonb_build_object('branch_id',p_branch));
  RETURN jsonb_build_object('ok',true,'action',p_action,'branch',p_branch,'item_id',v_id);
END
$fn$;

REVOKE ALL ON FUNCTION public.tranquila_admin_action(text,text,uuid,jsonb,text,bigint,jsonb,boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tranquila_admin_action(text,text,uuid,jsonb,text,bigint,jsonb,boolean)
  TO service_role;
SELECT pg_notify('pgrst','reload schema');
