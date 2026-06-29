CREATE TYPE public.collab_role AS ENUM ('viewer', 'editor');

CREATE TABLE public.document_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.collab_role NOT NULL DEFAULT 'viewer',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, user_id)
);

CREATE INDEX idx_doc_collab_document ON public.document_collaborators(document_id);
CREATE INDEX idx_doc_collab_user ON public.document_collaborators(user_id);

CREATE TABLE public.document_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_by uuid,
  label text,
  title text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_versions_document ON public.document_versions(document_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_document_owner(_doc uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.documents WHERE id = _doc AND user_id = _user);
$fn$;

CREATE OR REPLACE FUNCTION public.can_access_document(_doc uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.documents WHERE id = _doc AND user_id = _user)
      OR EXISTS (SELECT 1 FROM public.document_collaborators WHERE document_id = _doc AND user_id = _user);
$fn$;

CREATE OR REPLACE FUNCTION public.can_edit_document(_doc uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.documents WHERE id = _doc AND user_id = _user)
      OR EXISTS (SELECT 1 FROM public.document_collaborators WHERE document_id = _doc AND user_id = _user AND role = 'editor');
$fn$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_collaborators TO authenticated;
GRANT ALL ON public.document_collaborators TO service_role;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View collaborators of accessible documents"
ON public.document_collaborators FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_document_owner(document_id, auth.uid()));

CREATE POLICY "Owner manages collaborators - insert"
ON public.document_collaborators FOR INSERT TO authenticated
WITH CHECK (public.is_document_owner(document_id, auth.uid()));

CREATE POLICY "Owner manages collaborators - update"
ON public.document_collaborators FOR UPDATE TO authenticated
USING (public.is_document_owner(document_id, auth.uid()))
WITH CHECK (public.is_document_owner(document_id, auth.uid()));

CREATE POLICY "Owner or self removes collaborator"
ON public.document_collaborators FOR DELETE TO authenticated
USING (public.is_document_owner(document_id, auth.uid()) OR user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_versions TO authenticated;
GRANT ALL ON public.document_versions TO service_role;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View versions of accessible documents"
ON public.document_versions FOR SELECT TO authenticated
USING (public.can_access_document(document_id, auth.uid()));

CREATE POLICY "Editors create versions"
ON public.document_versions FOR INSERT TO authenticated
WITH CHECK (public.can_edit_document(document_id, auth.uid()));

CREATE POLICY "Owner deletes versions"
ON public.document_versions FOR DELETE TO authenticated
USING (public.is_document_owner(document_id, auth.uid()));

DROP POLICY IF EXISTS "Users manage own documents" ON public.documents;

CREATE POLICY "Access own or shared documents"
ON public.documents FOR SELECT TO authenticated
USING (public.can_access_document(id, auth.uid()));

CREATE POLICY "Create own documents"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or editor updates documents"
ON public.documents FOR UPDATE TO authenticated
USING (public.can_edit_document(id, auth.uid()))
WITH CHECK (public.can_edit_document(id, auth.uid()));

CREATE POLICY "Owner deletes documents"
ON public.documents FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.add_collaborator(_document_id uuid, _email text, _role public.collab_role)
RETURNS TABLE(user_id uuid, email text, full_name text, role public.collab_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _target uuid;
BEGIN
  IF NOT public.is_document_owner(_document_id, auth.uid()) THEN
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
END; $fn$;

CREATE OR REPLACE FUNCTION public.get_document_collaborators(_document_id uuid)
RETURNS TABLE(user_id uuid, email text, full_name text, role public.collab_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT dc.user_id, p.email, p.full_name, dc.role
  FROM public.document_collaborators dc
  JOIN public.profiles p ON p.id = dc.user_id
  WHERE dc.document_id = _document_id
    AND public.can_access_document(_document_id, auth.uid())
  ORDER BY p.email;
$fn$;