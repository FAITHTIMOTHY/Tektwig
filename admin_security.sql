-- ==========================================================
-- COMPLETE RLS POLICIES FOR TEKTWIG ADMIN PORTAL & PUBLIC WEBSITE
-- Enables public read/write access so the admin dashboard can view,
-- update, and delete records, and public visitors can submit forms.
-- ==========================================================

-- 1. Jobs Policies
DROP POLICY IF EXISTS "jobs_public_select" ON jobs;
DROP POLICY IF EXISTS "jobs_admin_insert" ON jobs;
DROP POLICY IF EXISTS "jobs_admin_update" ON jobs;
DROP POLICY IF EXISTS "jobs_admin_delete" ON jobs;
DROP POLICY IF EXISTS "jobs_select" ON jobs;
DROP POLICY IF EXISTS "jobs_insert" ON jobs;
DROP POLICY IF EXISTS "jobs_update" ON jobs;
DROP POLICY IF EXISTS "jobs_delete" ON jobs;

CREATE POLICY "jobs_public_select" ON jobs FOR SELECT USING (true);
CREATE POLICY "jobs_public_insert" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "jobs_public_update" ON jobs FOR UPDATE USING (true);
CREATE POLICY "jobs_public_delete" ON jobs FOR DELETE USING (true);

-- 2. Applications Policies
DROP POLICY IF EXISTS "apps_public_select" ON applications;
DROP POLICY IF EXISTS "apps_public_insert" ON applications;
DROP POLICY IF EXISTS "apps_public_update" ON applications;
DROP POLICY IF EXISTS "apps_public_delete" ON applications;
DROP POLICY IF EXISTS "apps_admin_select" ON applications;
DROP POLICY IF EXISTS "apps_admin_update" ON applications;
DROP POLICY IF EXISTS "apps_admin_delete" ON applications;
DROP POLICY IF EXISTS "apps_select" ON applications;
DROP POLICY IF EXISTS "apps_insert" ON applications;
DROP POLICY IF EXISTS "apps_update" ON applications;
DROP POLICY IF EXISTS "apps_delete" ON applications;

CREATE POLICY "apps_public_select" ON applications FOR SELECT USING (true);
CREATE POLICY "apps_public_insert" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "apps_public_update" ON applications FOR UPDATE USING (true);
CREATE POLICY "apps_public_delete" ON applications FOR DELETE USING (true);

-- 3. Enterprise Leads Policies
DROP POLICY IF EXISTS "leads_public_select" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_public_insert" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_public_update" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_public_delete" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_admin_select" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_admin_update" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_admin_delete" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_select" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_insert" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_update" ON enterprise_leads;
DROP POLICY IF EXISTS "leads_delete" ON enterprise_leads;

CREATE POLICY "leads_public_select" ON enterprise_leads FOR SELECT USING (true);
CREATE POLICY "leads_public_insert" ON enterprise_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_public_update" ON enterprise_leads FOR UPDATE USING (true);
CREATE POLICY "leads_public_delete" ON enterprise_leads FOR DELETE USING (true);

-- 4. Enterprise Applications Policies
DROP POLICY IF EXISTS "ent_apps_public_select" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_public_insert" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_public_update" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_public_delete" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_admin_select" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_admin_update" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_admin_delete" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_select" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_insert" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_update" ON enterprise_applications;
DROP POLICY IF EXISTS "ent_apps_delete" ON enterprise_applications;

CREATE POLICY "ent_apps_public_select" ON enterprise_applications FOR SELECT USING (true);
CREATE POLICY "ent_apps_public_insert" ON enterprise_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "ent_apps_public_update" ON enterprise_applications FOR UPDATE USING (true);
CREATE POLICY "ent_apps_public_delete" ON enterprise_applications FOR DELETE USING (true);

-- 5. Contact Inquiries Policies
DROP POLICY IF EXISTS "inquiries_public_select" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_public_insert" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_public_update" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_public_delete" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_admin_select" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_admin_delete" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_select" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_insert" ON contact_inquiries;
DROP POLICY IF EXISTS "inquiries_delete" ON contact_inquiries;

CREATE POLICY "inquiries_public_select" ON contact_inquiries FOR SELECT USING (true);
CREATE POLICY "inquiries_public_insert" ON contact_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "inquiries_public_update" ON contact_inquiries FOR UPDATE USING (true);
CREATE POLICY "inquiries_public_delete" ON contact_inquiries FOR DELETE USING (true);
