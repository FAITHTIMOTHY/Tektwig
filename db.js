/**
 * Tektwig Recruitment Portal — Supabase Database Manager
 * Replaces the former IndexedDB local storage with a shared Supabase backend.
 * All data (jobs, applications, leads, inquiries, CVs) is now server-side.
 */

const SUPABASE_URL = 'https://ptvsiegxiiczrrwjprud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnNpZWd4aWljenJyd2pwcnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODU4NTQsImV4cCI6MjA5OTg2MTg1NH0.KEWUM_oFMKZbLhW9Oa5WO-Qnt8lVInPSshAdArCZ7WI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Restore session from sessionStorage if present to authenticate database queries
if (typeof window !== 'undefined') {
  const sessionDataStr = window.sessionStorage.getItem('tektwig_admin_session');
  if (sessionDataStr) {
    try {
      const sessionData = JSON.parse(sessionDataStr);
      if (sessionData && sessionData.access_token) {
        supabaseClient.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token || null
        });
      }
    } catch (err) {
      console.error('Failed to restore admin auth session:', err);
    }
  }
}

/* ==========================================================================
   Helpers: snake_case <-> camelCase field mapping
   ========================================================================== */

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value;
  }
  return result;
}

function rowToCamel(row) {
  return toCamelCase(row);
}

function rowsToCamel(rows) {
  return (rows || []).map(rowToCamel);
}

/* ==========================================================================
   Helper: Upload CV file to Supabase Storage
   ========================================================================== */

async function uploadCVFile(file, fileName) {
  if (!file) return null;

  // Generate unique path to prevent collisions
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${Date.now()}_${safeName}`;

  const { data, error } = await supabaseClient.storage
    .from('cv-uploads')
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false
    });

  if (error) {
    console.error('CV upload error:', error);
    throw new Error('Failed to upload CV file: ' + error.message);
  }

  return data.path;
}

/* ==========================================================================
   Helper: Get public URL for a stored CV file
   ========================================================================== */

function getCVPublicUrl(filePath) {
  if (!filePath) return null;
  const { data } = supabaseClient.storage
    .from('cv-uploads')
    .getPublicUrl(filePath);
  return data.publicUrl;
}

/* ==========================================================================
   Helper: Prepare application payload for DB insert
   Strips the raw File/Blob and adds the storage path instead.
   ========================================================================== */

async function prepareApplicationPayload(appData) {
  const payload = { ...appData };

  // Upload CV file to storage if present
  if (payload.cvFile) {
    const cvPath = await uploadCVFile(payload.cvFile, payload.cvFileName || 'resume');
    payload.cvFilePath = cvPath;
  }

  // Remove fields that don't map to DB columns
  delete payload.cvFile;

  // Convert to snake_case for the database
  return toSnakeCase(payload);
}

/* ==========================================================================
   Helper: Enrich application record with CV download URL
   ========================================================================== */

function enrichApplicationRecord(record) {
  if (!record) return record;
  const camelRecord = rowToCamel(record);

  // Generate public download URL for the CV
  if (camelRecord.cvFilePath) {
    camelRecord.cvFileUrl = getCVPublicUrl(camelRecord.cvFilePath);
  }

  // Backward compatibility: set cvFile to null (no longer a Blob)
  camelRecord.cvFile = null;

  return camelRecord;
}

/* ==========================================================================
   Public DB Operations API — window.TektwigDB
   Same API surface as the former IndexedDB implementation.
   ========================================================================== */

window.TektwigDB = {

  // ── Jobs ──────────────────────────────────────────────────────────────────

  getJobs: async () => {
    const { data, error } = await supabaseClient
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return rowsToCamel(data);
  },

  getJob: async (id) => {
    const { data, error } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) throw error;
    return rowToCamel(data);
  },

  addJob: async (job) => {
    const payload = toSnakeCase({ ...job });
    delete payload.id; // Auto-generated by DB
    if (!payload.created_at) payload.created_at = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from('jobs')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  updateJob: async (job) => {
    const payload = toSnakeCase({ ...job });
    const jobId = payload.id;
    delete payload.id; // Can't update identity column

    const { error } = await supabaseClient
      .from('jobs')
      .update(payload)
      .eq('id', jobId);
    if (error) throw error;
    return true;
  },

  deleteJob: async (id) => {
    const { error } = await supabaseClient
      .from('jobs')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return true;
  },

  // ── Applications ──────────────────────────────────────────────────────────

  getApplications: async () => {
    const { data, error } = await supabaseClient
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data.map(enrichApplicationRecord);
  },

  getApplication: async (id) => {
    const { data, error } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) throw error;
    return enrichApplicationRecord(data);
  },

  saveApplication: async (appData) => {
    // 1. Upload CV file if present
    let cvFilePath = null;
    if (appData.cvFile) {
      cvFilePath = await uploadCVFile(appData.cvFile, appData.cvFileName || 'resume');
    }

    // 2. Insert into the appropriate table using only valid columns
    if (appData.isThirdParty) {
      const payload = {
        lead_ref_id: appData.leadRefId || null,
        name: appData.name,
        email: appData.email,
        phone: appData.phone || null,
        job_title: appData.jobTitle,
        experience: appData.experience || 0,
        portfolio: appData.portfolio || null,
        cover_letter: appData.coverLetter || null,
        cv_file_path: cvFilePath,
        cv_file_name: appData.cvFileName || null,
        cv_file_type: appData.cvFileType || null,
        status: appData.status || 'Pending Review',
        applied_at: appData.appliedAt || new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('enterprise_applications')
        .insert(payload);
      if (error) throw error;
      return null;
    } else {
      const payload = {
        name: appData.name,
        email: appData.email,
        phone: appData.phone || null,
        job_id: appData.jobId ? parseInt(appData.jobId) : null,
        job_title: appData.jobTitle,
        experience: appData.experience || 0,
        portfolio: appData.portfolio || null,
        cover_letter: appData.coverLetter || null,
        cv_file_path: cvFilePath,
        cv_file_name: appData.cvFileName || null,
        cv_file_type: appData.cvFileType || null,
        status: appData.status || 'Pending Review',
        applied_at: appData.appliedAt || new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('applications')
        .insert(payload);
      if (error) throw error;
      return null;
    }
  },

  updateApplicationStatus: async (id, newStatus) => {
    const { error } = await supabaseClient
      .from('applications')
      .update({ status: newStatus })
      .eq('id', parseInt(id));
    if (error) throw error;
    return true;
  },

  deleteApplication: async (id) => {
    const { error } = await supabaseClient
      .from('applications')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return true;
  },

  // ── Enterprise Applications ───────────────────────────────────────────────

  getEnterpriseApplications: async () => {
    const { data, error } = await supabaseClient
      .from('enterprise_applications')
      .select('*')
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data.map(enrichApplicationRecord);
  },

  getEnterpriseApplicationsForLead: async (leadRefId) => {
    const { data, error } = await supabaseClient
      .from('enterprise_applications')
      .select('*')
      .eq('lead_ref_id', leadRefId)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data.map(enrichApplicationRecord);
  },

  getEnterpriseApplication: async (id) => {
    const { data, error } = await supabaseClient
      .from('enterprise_applications')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) throw error;
    return enrichApplicationRecord(data);
  },

  updateEnterpriseApplicationStatus: async (id, newStatus) => {
    const { error } = await supabaseClient
      .from('enterprise_applications')
      .update({ status: newStatus })
      .eq('id', parseInt(id));
    if (error) throw error;
    return true;
  },

  deleteEnterpriseApplication: async (id) => {
    const { error } = await supabaseClient
      .from('enterprise_applications')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return true;
  },

  // ── Enterprise Leads ──────────────────────────────────────────────────────

  getEnterpriseLeads: async () => {
    const { data, error } = await supabaseClient
      .from('enterprise_leads')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return rowsToCamel(data);
  },

  getEnterpriseLead: async (id) => {
    const { data, error } = await supabaseClient
      .from('enterprise_leads')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) throw error;
    return rowToCamel(data);
  },

  saveEnterpriseLead: async (leadData) => {
    const payload = toSnakeCase({ ...leadData });
    delete payload.id;
    if (!payload.submitted_at) payload.submitted_at = new Date().toISOString();
    if (!payload.status) payload.status = 'New';

    const { error } = await supabaseClient
      .from('enterprise_leads')
      .insert(payload);
    if (error) throw error;
    return null;
  },

  updateEnterpriseLead: async (leadData) => {
    const payload = toSnakeCase({ ...leadData });
    const leadId = payload.id;
    delete payload.id;

    const { error } = await supabaseClient
      .from('enterprise_leads')
      .update(payload)
      .eq('id', leadId);
    if (error) throw error;
    return true;
  },

  updateLeadStatus: async (id, newStatus) => {
    const { error } = await supabaseClient
      .from('enterprise_leads')
      .update({ status: newStatus })
      .eq('id', parseInt(id));
    if (error) throw error;
    return true;
  },

  deleteEnterpriseLead: async (id) => {
    const { error } = await supabaseClient
      .from('enterprise_leads')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return true;
  },

  // ── Contact Inquiries ─────────────────────────────────────────────────────

  saveContactInquiry: async (inquiryData) => {
    const payload = toSnakeCase({ ...inquiryData });
    delete payload.id;
    if (!payload.submitted_at) payload.submitted_at = new Date().toISOString();

    const { error } = await supabaseClient
      .from('contact_inquiries')
      .insert(payload);
    if (error) throw error;
    return null;
  },

  getContactInquiries: async () => {
    const { data, error } = await supabaseClient
      .from('contact_inquiries')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return rowsToCamel(data);
  },

  deleteContactInquiry: async (id) => {
    const { error } = await supabaseClient
      .from('contact_inquiries')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return true;
  }
};
