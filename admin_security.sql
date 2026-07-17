-- ==========================================================
-- UPDATE RLS POLICIES FOR TEKTWIG AUTH + 2FA
-- Enforces that only authenticated users can read/modify admin tables.
-- ==========================================================

-- 1. Jobs Policies (Public read, authenticated write)
DROP POLICY IF EXISTS "jobs_select" ON jobs;
DROP POLICY IF EXISTS "jobs_insert" ON jobs;
DROP POLICY IF EXISTS "jobs_update" ON jobs;
DROP POLICY IF EXISTS "jobs_delete" ON jobs;

CREATE POLICY "jobs_public_select" ON jobs FOR SELECT USING (true);
CREATE POLICY "jobs_admin_insert" ON jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "jobs_admin_update" ON jobs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "jobs_admin_delete" ON jobs FOR DELETE TO authenticated USING (true);

-- 2. Applications Policies (Authenticated read/write, public insert)
DROP POLICY IF EXISTS "apps_select" ON applications;
DROP POLICY IF EXISTS "apps_insert" ON applications;
DROP POLICY IF EXISTS "apps_update" ON applications;
DROP POLICY IF EXISTS "apps_delete" ON applications;

CREATE POLICY "apps_public_insert" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "apps_admin_select" ON applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "apps_admin_update" ON applications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "apps_admin_delete" ON applications FOR DELETE TO authenticated USING (true);

-- 3. Enterprise Leads Policies (Authenticated read/write, public insert)
DROP POLICY IF EXISTS "leads_select" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_insert" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_update" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_delete" ON enterprise_leads;

CREATE POLICY "leads_public_insert" ON enterprise_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_admin_select" ON enterprise_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_admin_update" ON enterprise_leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "leads_admin_delete" ON enterprise_leads FOR DELETE TO authenticated USING (true);

-- 4. Enterprise Applications Policies (Authenticated read/write, public insert)
DROP POLICY IF EXISTS "ent_apps_select" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_insert" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_update" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_delete" ON enterprise_applications;

CREATE POLICY "ent_apps_public_insert" ON enterprise_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "ent_apps_admin_select" ON enterprise_applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "ent_apps_admin_update" ON enterprise_applications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ent_apps_admin_delete" ON enterprise_applications FOR DELETE TO authenticated USING (true);

-- 5. Contact Inquiries Policies (Authenticated read/write, public insert)
DROP POLICY IF EXISTS "inquiries_select" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_insert" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_delete" ON contact_inquiries;

CREATE POLICY "inquiries_public_insert" ON contact_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "inquiries_admin_select" ON contact_inquiries FOR SELECT TO authenticated USING (true);
CREATE POLICY "inquiries_admin_delete" ON contact_inquiries FOR DELETE TO authenticated USING (true);
