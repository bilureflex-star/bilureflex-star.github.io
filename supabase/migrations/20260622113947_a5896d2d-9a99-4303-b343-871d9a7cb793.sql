CREATE OR REPLACE FUNCTION public.is_document_collaborator(_doc uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.document_collaborators WHERE document_id = _doc AND user_id = _user);
$fn$;

DROP POLICY IF EXISTS "Access own or shared documents" ON public.documents;
CREATE POLICY "Access own or shared documents" ON public.documents
FOR SELECT USING (user_id = auth.uid() OR public.is_document_collaborator(id, auth.uid()));