
-- 1. Private (non-API-exposed) schema for SECURITY DEFINER helpers
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- 2. RLS helper functions (moved into private schema)
CREATE OR REPLACE FUNCTION private.is_document_owner(_doc uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.documents WHERE id = _doc AND user_id = _user); $$;

CREATE OR REPLACE FUNCTION private.is_document_collaborator(_doc uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.document_collaborators WHERE document_id = _doc AND user_id = _user); $$;

CREATE OR REPLACE FUNCTION private.can_access_document(_doc uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.documents WHERE id = _doc AND user_id = _user)
      OR EXISTS (SELECT 1 FROM public.document_collaborators WHERE document_id = _doc AND user_id = _user);
$$;

CREATE OR REPLACE FUNCTION private.can_edit_document(_doc uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.documents WHERE id = _doc AND user_id = _user)
      OR EXISTS (SELECT 1 FROM public.document_collaborators WHERE document_id = _doc AND user_id = _user AND role = 'editor');
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

-- 3. Privileged implementations for the share RPCs (moved into private schema)
CREATE OR REPLACE FUNCTION private.add_collaborator(_document_id uuid, _email text, _role public.collab_role)
RETURNS TABLE(user_id uuid, email text, full_name text, role public.collab_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _target uuid;
BEGIN
  IF NOT private.is_document_owner(_document_id, auth.uid()) THEN
    RAISE EXCEPTION 'Apenas o dono pode compartilhar este documento';
  END IF;

  SELECT id INTO _target FROM public.profiles WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF _target IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado com este e-mail';
  END IF;
  IF _target = auth.uid() THEN
    RAISE EXCEPTION 'Você já é o dono deste documento';
  END IF;

  INSERT INTO public.document_collaborators (document_id, user_id, role, invited_by)
  VALUES (_document_id, _target, _role, auth.uid())
  ON CONFLICT (document_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN QUERY
    SELECT dc.user_id, p.email, p.full_name, dc.role
    FROM public.document_collaborators dc
    JOIN public.profiles p ON p.id = dc.user_id
    WHERE dc.document_id = _document_id AND dc.user_id = _target;
END; $$;

CREATE OR REPLACE FUNCTION private.get_document_collaborators(_document_id uuid)
RETURNS TABLE(user_id uuid, email text, full_name text, role public.collab_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT dc.user_id, p.email, p.full_name, dc.role
  FROM public.document_collaborators dc
  JOIN public.profiles p ON p.id = dc.user_id
  WHERE dc.document_id = _document_id
    AND private.can_access_document(_document_id, auth.uid())
  ORDER BY p.email;
$$;

-- 4. Grants on private functions (RLS needs them executable; not exposed via API)
REVOKE ALL ON FUNCTION private.is_document_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_document_collaborator(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_access_document(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_edit_document(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.add_collaborator(uuid, text, public.collab_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.get_document_collaborators(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.is_document_owner(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_document_collaborator(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_access_document(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_edit_document(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.add_collaborator(uuid, text, public.collab_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_document_collaborators(uuid) TO authenticated, service_role;

-- 5. Repoint all RLS policies to the private helpers (and widen collaborator visibility)
DROP POLICY IF EXISTS "Access own or shared documents" ON public.documents;
CREATE POLICY "Access own or shared documents" ON public.documents
FOR SELECT USING (user_id = auth.uid() OR private.is_document_collaborator(id, auth.uid()));

DROP POLICY IF EXISTS "Owner or editor updates documents" ON public.documents;
CREATE POLICY "Owner or editor updates documents" ON public.documents
FOR UPDATE USING (private.can_edit_document(id, auth.uid()))
WITH CHECK (private.can_edit_document(id, auth.uid()));

DROP POLICY IF EXISTS "Owner manages collaborators - insert" ON public.document_collaborators;
CREATE POLICY "Owner manages collaborators - insert" ON public.document_collaborators
FOR INSERT WITH CHECK (private.is_document_owner(document_id, auth.uid()));

DROP POLICY IF EXISTS "Owner manages collaborators - update" ON public.document_collaborators;
CREATE POLICY "Owner manages collaborators - update" ON public.document_collaborators
FOR UPDATE USING (private.is_document_owner(document_id, auth.uid()))
WITH CHECK (private.is_document_owner(document_id, auth.uid()));

DROP POLICY IF EXISTS "Owner or self removes collaborator" ON public.document_collaborators;
CREATE POLICY "Owner or self removes collaborator" ON public.document_collaborators
FOR DELETE USING (private.is_document_owner(document_id, auth.uid()) OR user_id = auth.uid());

-- Finding 3: all participants can see the collaborator list
DROP POLICY IF EXISTS "View collaborators of accessible documents" ON public.document_collaborators;
CREATE POLICY "View collaborators of accessible documents" ON public.document_collaborators
FOR SELECT USING (private.can_access_document(document_id, auth.uid()));

DROP POLICY IF EXISTS "Editors create versions" ON public.document_versions;
CREATE POLICY "Editors create versions" ON public.document_versions
FOR INSERT WITH CHECK (private.can_edit_document(document_id, auth.uid()));

DROP POLICY IF EXISTS "Owner deletes versions" ON public.document_versions;
CREATE POLICY "Owner deletes versions" ON public.document_versions
FOR DELETE USING (private.is_document_owner(document_id, auth.uid()));

DROP POLICY IF EXISTS "View versions of accessible documents" ON public.document_versions;
CREATE POLICY "View versions of accessible documents" ON public.document_versions
FOR SELECT USING (private.can_access_document(document_id, auth.uid()));

-- 6. Replace the public share RPCs with SECURITY INVOKER wrappers (no longer SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.add_collaborator(_document_id uuid, _email text, _role public.collab_role)
RETURNS TABLE(user_id uuid, email text, full_name text, role public.collab_role)
LANGUAGE sql SECURITY INVOKER SET search_path TO 'public'
AS $$ SELECT * FROM private.add_collaborator(_document_id, _email, _role); $$;

CREATE OR REPLACE FUNCTION public.get_document_collaborators(_document_id uuid)
RETURNS TABLE(user_id uuid, email text, full_name text, role public.collab_role)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$ SELECT * FROM private.get_document_collaborators(_document_id); $$;

REVOKE ALL ON FUNCTION public.add_collaborator(uuid, text, public.collab_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_document_collaborators(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_collaborator(uuid, text, public.collab_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_document_collaborators(uuid) TO authenticated, service_role;

-- 7. Drop the now-unused public SECURITY DEFINER helper functions
DROP FUNCTION IF EXISTS public.is_document_collaborator(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_document_owner(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_access_document(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_edit_document(uuid, uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 8. The new-user trigger function is SECURITY DEFINER but only runs from the trigger;
--    it must not be callable directly via the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
