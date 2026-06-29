-- documents
DROP POLICY IF EXISTS "Access own or shared documents" ON public.documents;
DROP POLICY IF EXISTS "Create own documents" ON public.documents;
DROP POLICY IF EXISTS "Owner or editor updates documents" ON public.documents;
DROP POLICY IF EXISTS "Owner deletes documents" ON public.documents;

CREATE POLICY "Access own or shared documents" ON public.documents
FOR SELECT USING (public.can_access_document(id, auth.uid()));
CREATE POLICY "Create own documents" ON public.documents
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or editor updates documents" ON public.documents
FOR UPDATE USING (public.can_edit_document(id, auth.uid()))
WITH CHECK (public.can_edit_document(id, auth.uid()));
CREATE POLICY "Owner deletes documents" ON public.documents
FOR DELETE USING (auth.uid() = user_id);

-- document_collaborators
DROP POLICY IF EXISTS "View collaborators of accessible documents" ON public.document_collaborators;
DROP POLICY IF EXISTS "Owner manages collaborators - insert" ON public.document_collaborators;
DROP POLICY IF EXISTS "Owner manages collaborators - update" ON public.document_collaborators;
DROP POLICY IF EXISTS "Owner or self removes collaborator" ON public.document_collaborators;

CREATE POLICY "View collaborators of accessible documents" ON public.document_collaborators
FOR SELECT USING (user_id = auth.uid() OR public.is_document_owner(document_id, auth.uid()));
CREATE POLICY "Owner manages collaborators - insert" ON public.document_collaborators
FOR INSERT WITH CHECK (public.is_document_owner(document_id, auth.uid()));
CREATE POLICY "Owner manages collaborators - update" ON public.document_collaborators
FOR UPDATE USING (public.is_document_owner(document_id, auth.uid()))
WITH CHECK (public.is_document_owner(document_id, auth.uid()));
CREATE POLICY "Owner or self removes collaborator" ON public.document_collaborators
FOR DELETE USING (public.is_document_owner(document_id, auth.uid()) OR user_id = auth.uid());

-- document_versions
DROP POLICY IF EXISTS "View versions of accessible documents" ON public.document_versions;
DROP POLICY IF EXISTS "Editors create versions" ON public.document_versions;
DROP POLICY IF EXISTS "Owner deletes versions" ON public.document_versions;

CREATE POLICY "View versions of accessible documents" ON public.document_versions
FOR SELECT USING (public.can_access_document(document_id, auth.uid()));
CREATE POLICY "Editors create versions" ON public.document_versions
FOR INSERT WITH CHECK (public.can_edit_document(document_id, auth.uid()));
CREATE POLICY "Owner deletes versions" ON public.document_versions
FOR DELETE USING (public.is_document_owner(document_id, auth.uid()));