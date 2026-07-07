/**
 * Tektwig Recruitment Portal - Admin Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  let allApplications = [];
  let allJobs = [];
  let filteredApplications = [];
  let activeCandidate = null;

  // Cache DOM elements
  const tbody = document.getElementById('admin-applicants-tbody');
  const searchInput = document.getElementById('admin-search-input');
  const roleFilter = document.getElementById('admin-role-filter');
  const statusFilter = document.getElementById('admin-status-filter');
  const sortSelect = document.getElementById('admin-sort-select');
  const btnExportCSV = document.getElementById('btn-export-csv');
  
  // Modal Elements
  const detailModalBackdrop = document.getElementById('candidate-detail-backdrop');
  const btnCloseDetail = document.getElementById('btn-close-detail-modal');
  const btnDownloadCV = document.getElementById('btn-download-cv');
  const btnSaveStatus = document.getElementById('btn-save-status');
  const btnDeleteCandidate = document.getElementById('btn-delete-candidate');
  const detailStatusSelect = document.getElementById('detail-status-select');
  
  // Modal Fields
  const detailCandName = document.getElementById('detail-cand-name');
  const detailJobTitle = document.getElementById('detail-job-title');
  const detailCandEmail = document.getElementById('detail-cand-email');
  const detailCandPhone = document.getElementById('detail-cand-phone');
  const detailCandDate = document.getElementById('detail-cand-date');
  const detailCandExp = document.getElementById('detail-cand-exp');
  const detailCandPortfolio = document.getElementById('detail-cand-portfolio');
  const detailCVFilename = document.getElementById('detail-cv-filename');
  const detailCandLetter = document.getElementById('detail-cand-letter');

  // Job management panel toggles
  const btnToggleJobs = document.getElementById('btn-toggle-jobs-panel');
  const jobsPanel = document.getElementById('jobs-management-panel');
  const adminJobsList = document.getElementById('admin-jobs-list');
  const addJobForm = document.getElementById('admin-add-job-form');

  // Mobile Toggle navigation (from app.js)
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });
  }

  // Toggle Jobs Postings panel
  btnToggleJobs.addEventListener('click', () => {
    if (jobsPanel.style.display === 'none') {
      jobsPanel.style.display = 'block';
      jobsPanel.scrollIntoView({ behavior: 'smooth' });
      btnToggleJobs.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        <span>Hide Jobs Panel</span>
      `;
    } else {
      jobsPanel.style.display = 'none';
      btnToggleJobs.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        <span>Manage Job Postings</span>
      `;
    }
  });

  // Fetch jobs and applications, compute metrics
  async function initDashboard() {
    try {
      if (window.TektwigDB) {
        allJobs = await window.TektwigDB.getJobs();
        allApplications = await window.TektwigDB.getApplications();
        
        populateRoleFilters();
        renderJobsList();
        updateMetrics();
        applyFiltersAndRender();
      } else {
        console.error('TektwigDB not loaded.');
      }
    } catch (err) {
      console.error('Error initializing dashboard:', err);
    }
  }

  // Populate dynamic role options in the filters
  function populateRoleFilters() {
    // Keep standard placeholder
    roleFilter.innerHTML = '<option value="all">All Roles</option>';
    
    allJobs.forEach(job => {
      const option = document.createElement('option');
      option.value = job.id;
      option.textContent = job.title;
      roleFilter.appendChild(option);
    });
  }

  // Update statistics banner metrics
  function updateMetrics() {
    const counts = {
      total: allApplications.length,
      pending: 0,
      reviewing: 0,
      interviewing: 0,
      offered: 0
    };

    allApplications.forEach(app => {
      if (app.status === 'Pending Review') counts.pending++;
      else if (app.status === 'Reviewing') counts.reviewing++;
      else if (app.status === 'Interviewing') counts.interviewing++;
      else if (app.status === 'Offered') counts.offered++;
    });

    document.getElementById('metric-total').textContent = counts.total;
    document.getElementById('metric-pending').textContent = counts.pending;
    document.getElementById('metric-reviewing').textContent = counts.reviewing;
    document.getElementById('metric-interviewing').textContent = counts.interviewing;
    document.getElementById('metric-offered').textContent = counts.offered;
  }

  // Filter and Sort candidate logic
  function applyFiltersAndRender() {
    const query = searchInput.value.toLowerCase().trim();
    const selectedRoleId = roleFilter.value;
    const selectedStatus = statusFilter.value;
    const sortBy = sortSelect.value;

    filteredApplications = allApplications.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(query) || 
                            app.email.toLowerCase().includes(query) ||
                            app.phone.includes(query) ||
                            app.jobTitle.toLowerCase().includes(query);
                            
      const matchesRole = selectedRoleId === 'all' || app.jobId === parseInt(selectedRoleId);
      const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sorting
    filteredApplications.sort((a, b) => {
      if (sortBy === 'applied-desc') {
        return new Date(b.appliedAt) - new Date(a.appliedAt);
      } else if (sortBy === 'applied-asc') {
        return new Date(a.appliedAt) - new Date(b.appliedAt);
      } else if (sortBy === 'experience-desc') {
        return b.experience - a.experience;
      } else if (sortBy === 'experience-asc') {
        return a.experience - b.experience;
      } else if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    renderApplicantsTable(filteredApplications);
  }

  // Render HTML applicant list in table body
  function renderApplicantsTable(list) {
    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state-row">
            <div class="empty-state-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              <p>No job applications found matching these parameters.</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = list.map(app => {
      const applyDate = new Date(app.appliedAt).toISOString().split('T')[0];
      
      let statusClass = 'pill-pending';
      let statusLabel = 'Pending Review';
      
      if (app.status === 'Reviewing') {
        statusClass = 'pill-reviewing';
        statusLabel = 'Under Review';
      } else if (app.status === 'Interviewing') {
        statusClass = 'pill-interviewing';
        statusLabel = 'Interviewing';
      } else if (app.status === 'Offered') {
        statusClass = 'pill-offered';
        statusLabel = 'Offered';
      } else if (app.status === 'Rejected') {
        statusClass = 'pill-rejected';
        statusLabel = 'Rejected';
      }

      return `
        <tr id="applicant-row-${app.id}">
          <td><span style="font-family: monospace;">${applyDate}</span></td>
          <td>
            <div class="cand-name-cell">${app.name}</div>
            <span class="cand-email-cell">${app.email}</span>
          </td>
          <td><span style="font-weight: 500;">${app.jobTitle}</span></td>
          <td style="text-align: center; font-weight: 600;">${app.experience} Yr${app.experience > 1 ? 's' : ''}</td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
          <td style="text-align: right;">
            <button class="action-btn-sm btn-view-candidate" data-id="${app.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <span>View Profile</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row viewers
    document.querySelectorAll('.btn-view-candidate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openDetailModal(id);
      });
    });
  }

  // Filter triggers
  searchInput.addEventListener('keyup', applyFiltersAndRender);
  roleFilter.addEventListener('change', applyFiltersAndRender);
  statusFilter.addEventListener('change', applyFiltersAndRender);
  sortSelect.addEventListener('change', applyFiltersAndRender);

  /* ==========================================================================
     Candidate Detail Modal Operations
     ========================================================================== */
  
  async function openDetailModal(id) {
    try {
      activeCandidate = await window.TektwigDB.getApplication(id);
      if (!activeCandidate) return;

      const dateStr = new Date(activeCandidate.appliedAt).toISOString().split('T')[0];

      // Map DOM
      detailCandName.textContent = activeCandidate.name;
      detailJobTitle.textContent = activeCandidate.jobTitle;
      
      detailCandEmail.textContent = activeCandidate.email;
      detailCandEmail.href = `mailto:${activeCandidate.email}`;
      
      detailCandPhone.textContent = activeCandidate.phone;
      
      detailCandDate.textContent = dateStr;
      detailCandExp.textContent = `${activeCandidate.experience} Year${activeCandidate.experience > 1 ? 's' : ''}`;
      
      if (activeCandidate.portfolio) {
        detailCandPortfolio.textContent = activeCandidate.portfolio.replace('https://', '').replace('http://', '');
        detailCandPortfolio.href = activeCandidate.portfolio;
        detailCandPortfolio.parentElement.style.opacity = '1';
      } else {
        detailCandPortfolio.textContent = 'None Provided';
        detailCandPortfolio.removeAttribute('href');
        detailCandPortfolio.parentElement.style.opacity = '0.5';
      }

      detailCVFilename.textContent = activeCandidate.cvFileName || 'resume.pdf';
      detailCandLetter.textContent = activeCandidate.coverLetter;

      // Update Modal Select to match status
      detailStatusSelect.value = activeCandidate.status;

      // Show Modal
      detailModalBackdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error('Failed to open candidate detail modal:', err);
    }
  }

  function closeDetailModal() {
    detailModalBackdrop.classList.remove('show');
    document.body.style.overflow = '';
    activeCandidate = null;
  }

  btnCloseDetail.addEventListener('click', closeDetailModal);
  
  // Close details modal on clicking overlay backdrop
  detailModalBackdrop.addEventListener('click', (e) => {
    if (e.target === detailModalBackdrop) {
      closeDetailModal();
    }
  });

  // CV File Blob Downloader
  btnDownloadCV.addEventListener('click', () => {
    if (!activeCandidate || !activeCandidate.cvFile) {
      alert('Error: CV file not found in database record.');
      return;
    }

    const blob = activeCandidate.cvFile;
    const filename = activeCandidate.cvFileName || 'candidate_resume.pdf';
    
    // Create temporary link and click it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Save status stage update
  btnSaveStatus.addEventListener('click', async () => {
    if (!activeCandidate) return;
    
    const newStatus = detailStatusSelect.value;
    
    btnSaveStatus.disabled = true;
    btnSaveStatus.textContent = 'Saving...';
    
    try {
      await window.TektwigDB.updateApplicationStatus(activeCandidate.id, newStatus);
      
      // Reload applications and dashboard
      allApplications = await window.TektwigDB.getApplications();
      updateMetrics();
      applyFiltersAndRender();
      
      alert('Candidate recruitment stage updated successfully.');
      closeDetailModal();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update stage in database.');
    } finally {
      btnSaveStatus.disabled = false;
      btnSaveStatus.textContent = 'Save Stage';
    }
  });

  // Purge Candidate record
  btnDeleteCandidate.addEventListener('click', async () => {
    if (!activeCandidate) return;
    
    const confirmPurge = confirm(`Are you sure you want to permanently delete ${activeCandidate.name}'s application? This will permanently delete their profile and uploaded CV from the local database.`);
    if (!confirmPurge) return;

    btnDeleteCandidate.disabled = true;
    
    try {
      await window.TektwigDB.deleteApplication(activeCandidate.id);
      
      // Reload applications
      allApplications = await window.TektwigDB.getApplications();
      updateMetrics();
      applyFiltersAndRender();
      
      closeDetailModal();
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application from DB.');
    } finally {
      btnDeleteCandidate.disabled = false;
    }
  });


  /* ==========================================================================
     Job Postings Management & Rendering
     ========================================================================== */

  // Render jobs in administrative list
  function renderJobsList() {
    if (allJobs.length === 0) {
      adminJobsList.innerHTML = '<li style="padding:10px; color:var(--text-muted);">No active job postings.</li>';
      return;
    }

    adminJobsList.innerHTML = allJobs.map(job => `
      <li class="glass-panel" style="padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01);">
        <div>
          <strong style="color:var(--text-main); font-size:0.95rem;">${job.title}</strong>
          <span style="display:block; font-size:0.75rem; color:var(--text-muted);">${job.department} &bull; ${job.location} &bull; ${job.type}</span>
        </div>
        <button class="action-btn-sm btn-delete-job" data-id="${job.id}" style="border-color:#ef4444; color:#ef4444; background:none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </li>
    `).join('');

    // Attach delete job button click events
    document.querySelectorAll('.btn-delete-job').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const jobId = e.currentTarget.getAttribute('data-id');
        const confirmJobDel = confirm('Are you sure you want to close and delete this job posting? Candidates will no longer be able to see it or apply.');
        if (!confirmJobDel) return;

        try {
          await window.TektwigDB.deleteJob(jobId);
          allJobs = await window.TektwigDB.getJobs();
          renderJobsList();
          populateRoleFilters();
        } catch (err) {
          console.error('Error deleting job posting:', err);
          alert('Failed to delete job posting.');
        }
      });
    });
  }

  // Publish New Job Submission
  addJobForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleVal = document.getElementById('job-title').value.trim();
    const deptVal = document.getElementById('job-dept').value;
    const typeVal = document.getElementById('job-type').value.trim();
    const locVal = document.getElementById('job-location').value.trim();
    const expVal = document.getElementById('job-exp').value.trim();
    const salaryVal = document.getElementById('job-salary').value.trim();
    const descVal = document.getElementById('job-desc').value.trim();
    const reqsVal = document.getElementById('job-reqs').value.trim();

    // Map requirements list
    const requirementsArray = reqsVal.split(',').map(req => req.trim()).filter(req => req.length > 0);

    const newJobPayload = {
      title: titleVal,
      department: deptVal,
      type: typeVal,
      location: locVal,
      experience: expVal,
      salary: salaryVal,
      description: descVal,
      requirements: requirementsArray,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    try {
      await window.TektwigDB.addJob(newJobPayload);
      
      // Reload job postings
      allJobs = await window.TektwigDB.getJobs();
      renderJobsList();
      populateRoleFilters();
      
      // Reset form
      addJobForm.reset();
      alert(`Job Posting "${newJobPayload.title}" has been successfully published!`);
    } catch (err) {
      console.error('Error adding job:', err);
      alert('Failed to publish job posting.');
    }
  });


  /* ==========================================================================
     Centralized CSV Exporter (Excel Spreadsheet download)
     ========================================================================== */

  btnExportCSV.addEventListener('click', () => {
    if (filteredApplications.length === 0) {
      alert('No candidate applications to export.');
      return;
    }

    // Helper to sanitize text values for CSV columns
    const cleanCSVVal = (val) => {
      if (val === undefined || val === null) return '""';
      let clean = String(val).replace(/"/g, '""'); // Escape double quotes
      return `"${clean}"`;
    };

    // Header column row
    let csvContent = 'Tracking ID,Date Applied,Candidate Name,Email Address,Phone Number,Applied Position,Experience (Years),Portfolio URL,Current Recruitment Stage\n';

    filteredApplications.forEach(app => {
      const applyDateStr = new Date(app.appliedAt).toISOString().split('T')[0];
      const trackingCode = `TK-82749-${app.id}`; // Simulate Tracking ID structure
      
      const row = [
        cleanCSVVal(trackingCode),
        cleanCSVVal(applyDateStr),
        cleanCSVVal(app.name),
        cleanCSVVal(app.email),
        cleanCSVVal(app.phone),
        cleanCSVVal(app.jobTitle),
        app.experience,
        cleanCSVVal(app.portfolio || ''),
        cleanCSVVal(app.status)
      ];

      csvContent += row.join(',') + '\n';
    });

    // Create Blob and trigger browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'tektwig_applicants_spreadsheet.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Start initialization
  initDashboard();

  /* ==========================================================================
     Admin Tab Switcher
     ========================================================================== */
  const adminTabBtns     = document.querySelectorAll('.admin-tab-btn');
  const candidatesPanel  = document.getElementById('candidates-panel');
  const leadsPanel       = document.getElementById('leads-panel');

  adminTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      adminTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const panelId = btn.getAttribute('data-panel');
      candidatesPanel.style.display  = panelId === 'candidates-panel' ? 'block' : 'none';
      leadsPanel.style.display       = panelId === 'leads-panel'      ? 'block' : 'none';

      // Live reload of data on tab switch to prevent stale lists
      if (panelId === 'candidates-panel') {
        initDashboard();
      } else if (panelId === 'leads-panel') {
        loadLeads();
      }
    });
  });

  /* ==========================================================================
     Enterprise Leads Panel
     ========================================================================== */
  let allLeads = [];
  let activeLeadId = null;

  const leadsTbody         = document.getElementById('leads-tbody');
  const leadsSearch        = document.getElementById('leads-search-input');
  const leadsStatusFilter  = document.getElementById('leads-status-filter');
  const leadsCountBadge    = document.getElementById('leads-count-badge');
  const btnExportLeadsCSV  = document.getElementById('btn-export-leads-csv');

  async function loadLeads() {
    try {
      allLeads = await window.TektwigDB.getEnterpriseLeads();
      if (leadsCountBadge) leadsCountBadge.textContent = allLeads.length;
      renderLeads(allLeads);
    } catch (err) {
      console.error('Failed to load enterprise leads:', err);
    }
  }

  function renderLeads(leads) {
    if (!leadsTbody) return;
    if (leads.length === 0) {
      leadsTbody.innerHTML = `<tr><td colspan="7" class="empty-state-row"><div class="empty-state-content"><p>No enterprise leads found.</p></div></td></tr>`;
      return;
    }

    leadsTbody.innerHTML = leads.map(lead => {
      const date = new Date(lead.submittedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
      const statusClass = lead.status === 'New' ? 'stage-badge stage-pending'
                        : lead.status === 'In Progress' ? 'stage-badge stage-reviewing'
                        : 'stage-badge stage-offered';
      return `
        <tr>
          <td>${date}</td>
          <td><code style="font-size:0.78rem; color:var(--accent-cyan);">${lead.refId}</code></td>
          <td><strong>${lead.companyName}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${lead.industry}</span></td>
          <td>${lead.jobTitle}<br><span style="font-size:0.75rem;color:var(--text-muted);">${lead.employmentType || ''}</span></td>
          <td>${lead.package || '—'}</td>
          <td><span class="${statusClass}">${lead.status}</span></td>
          <td style="text-align:right;">
            <button class="btn-view-profile" onclick="openLeadModal(${lead.id})">View Brief</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function filterLeads() {
    const query  = leadsSearch ? leadsSearch.value.toLowerCase() : '';
    const status = leadsStatusFilter ? leadsStatusFilter.value : 'all';
    const filtered = allLeads.filter(l => {
      const matchesSearch = !query
        || l.companyName.toLowerCase().includes(query)
        || l.contactName.toLowerCase().includes(query)
        || l.jobTitle.toLowerCase().includes(query)
        || l.email.toLowerCase().includes(query)
        || l.refId.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || l.status === status;
      return matchesSearch && matchesStatus;
    });
    renderLeads(filtered);
  }

  if (leadsSearch)       leadsSearch.addEventListener('input', filterLeads);
  if (leadsStatusFilter) leadsStatusFilter.addEventListener('change', filterLeads);

  // -- Lead Detail Modal --
  window.openLeadModal = async function(id) {
    const lead = await window.TektwigDB.getEnterpriseLead(id);
    if (!lead) return;
    activeLeadId = id;

    const date = new Date(lead.submittedAt).toLocaleString('en-GB');

    // Fetch applications for this specific enterprise brief/lead
    const leadApps = await window.TektwigDB.getEnterpriseApplicationsForLead(lead.refId);

    let appsRowsHTML = '';
    if (leadApps.length === 0) {
      appsRowsHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.88rem;">
            No candidate applications have been filed for this advertisement yet.
          </td>
        </tr>`;
    } else {
      appsRowsHTML = leadApps.map(app => {
        const appDate = new Date(app.appliedAt).toLocaleDateString('en-GB');
        return `
          <tr>
            <td style="padding:12px 10px; border-bottom:1px solid rgba(255,255,255,0.05); font-family:monospace; font-size:0.8rem;">${appDate}</td>
            <td style="padding:12px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
              <div style="font-weight:600; color:var(--text-main); font-size:0.88rem;">${app.name}</div>
              <span style="font-size:0.75rem; color:var(--text-muted);">${app.email} · ${app.phone}</span>
            </td>
            <td style="padding:12px 10px; border-bottom:1px solid rgba(255,255,255,0.05); text-align:center; font-weight:600; font-size:0.85rem;">${app.experience} Yr${app.experience > 1 ? 's' : ''}</td>
            <td style="padding:12px 10px; border-bottom:1px solid rgba(255,255,255,0.05); text-align:right;">
              <button class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding:4px 10px; border-color:rgba(255,255,255,0.15);" onclick="downloadEnterpriseCV(${app.id})">
                Download CV
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    const modalHTML = `
      <div id="lead-modal-backdrop" class="modal-backdrop show" onclick="if(event.target===this)closeLeadModal()">
        <div class="app-modal lead-modal" style="max-height:85vh; overflow-y:auto;">
          <div class="modal-header">
            <div>
              <div class="badge badge-purple" style="margin-bottom:6px; font-size:0.7rem;">${lead.refId}</div>
              <h2 class="modal-title">${lead.jobTitle}</h2>
              <p style="font-size:0.85rem; color:var(--text-muted);">${lead.companyName} · ${lead.industry}</p>
            </div>
            <button class="modal-close-btn" id="lead-modal-close" onclick="closeLeadModal()">✕</button>
          </div>
          <div class="modal-body lead-modal-body" style="padding-bottom:30px;">
            <div class="lead-detail-grid">
              <div class="lead-detail-section">
                <h4 class="job-details-title">Contact</h4>
                <p><strong>${lead.contactName}</strong></p>
                <p>${lead.email}</p>
                <p>${lead.phone}</p>
              </div>
              <div class="lead-detail-section">
                <h4 class="job-details-title">Role Details</h4>
                <p><strong>Type:</strong> ${lead.employmentType || '—'}</p>
                <p><strong>Location:</strong> ${lead.locationType || '—'}${lead.city ? ' · ' + lead.city : ''}</p>
                <p><strong>Openings:</strong> ${lead.openings || 1}</p>
                <p><strong>Salary:</strong> ${lead.currency || ''} ${lead.salaryMin || '—'} – ${lead.salaryMax || '—'}</p>
                <p><strong>Deadline:</strong> ${lead.deadline || '—'}</p>
              </div>
              <div class="lead-detail-section">
                <h4 class="job-details-title">Preferences</h4>
                <p><strong>Package:</strong> ${lead.package || '—'}</p>
                <p><strong>Source:</strong> ${lead.source || '—'}</p>
                <p><strong>Submitted:</strong> ${date}</p>
              </div>
            </div>
            
            <div class="lead-detail-full">
              <h4 class="job-details-title">Job Description</h4>
              <p style="white-space:pre-wrap; color:var(--text-muted); font-size:0.9rem; line-height:1.7;">${lead.description || '—'}</p>
            </div>
            <div class="lead-detail-full">
              <h4 class="job-details-title">Key Requirements</h4>
              <p style="white-space:pre-wrap; color:var(--text-muted); font-size:0.9rem; line-height:1.7;">${lead.requirements || '—'}</p>
            </div>

            <!-- SECTION: ENTERPRISE APPLICANTS -->
            <div class="lead-detail-full" style="border-color: rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.01);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h4 class="job-details-title" style="margin-bottom:0; color:#f59e0b;">
                  Candidate Returns (${leadApps.length})
                </h4>
                ${leadApps.length > 0 ? `
                  <button class="btn btn-primary btn-sm" style="background:#d97706; border-color:#d97706; font-size:0.8rem;" onclick="exportEnterpriseLeadApplicantsCSV('${lead.refId}', '${lead.companyName}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line></svg>
                    Download Excel/CSV
                  </button>
                ` : ''}
              </div>
              <div class="table-responsive" style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                  <thead>
                    <tr style="background:rgba(255,255,255,0.02); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid var(--border-color);">
                      <th style="padding:10px;">Date Filed</th>
                      <th style="padding:10px;">Candidate Details</th>
                      <th style="padding:10px; text-align:center;">Experience</th>
                      <th style="padding:10px; text-align:right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${appsRowsHTML}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="lead-status-update">
              <label style="font-size:0.85rem; font-weight:600;">Update Status</label>
              <select id="lead-status-select" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-main); padding:10px 14px; border-radius:8px; font-family:var(--font-body); font-size:0.9rem;">
                <option value="New"         ${lead.status==='New'?'selected':''}>New</option>
                <option value="In Progress" ${lead.status==='In Progress'?'selected':''}>In Progress</option>
                <option value="Completed"   ${lead.status==='Completed'?'selected':''}>Completed</option>
              </select>
              <button class="btn btn-primary btn-sm" onclick="saveLeadStatus()">Save Status</button>
              ${lead.publishedJobId
                ? `<span class="lead-published-badge">&#10003; Live on Careers Page</span>`
                : `<button class="btn btn-sm lead-publish-btn" onclick="publishLeadAsJob(${lead.id})">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                     Publish as Job Listing
                   </button>`
              }
              <button class="btn btn-secondary btn-sm" style="border-color:#ef4444; color:#ef4444; margin-left:auto;" onclick="deleteLead(${lead.id})">Delete Lead</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
  };

  window.closeLeadModal = function() {
    const el = document.getElementById('lead-modal-backdrop');
    if (el) el.remove();
    document.body.style.overflow = '';
    activeLeadId = null;
  };

  window.saveLeadStatus = async function() {
    if (!activeLeadId) return;
    const select = document.getElementById('lead-status-select');
    const newStatus = select ? select.value : 'New';
    try {
      await window.TektwigDB.updateLeadStatus(activeLeadId, newStatus);
      closeLeadModal();
      await loadLeads();
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  window.publishLeadAsJob = async function(id) {
    const lead = await window.TektwigDB.getEnterpriseLead(id);
    if (!lead) return;

    if (!confirm(`Publish "${lead.jobTitle}" for ${lead.companyName} as a live job listing on the Careers page?`)) return;

    // Build salary string from lead data
    const salaryStr = (lead.salaryMin && lead.salaryMax)
      ? `${lead.currency || 'NGN'} ${lead.salaryMin} \u2013 ${lead.salaryMax}/month`
      : (lead.salaryMin ? `${lead.currency || 'NGN'} ${lead.salaryMin}+` : 'Competitive');

    // Build location string
    const locationStr = [lead.locationType, lead.city].filter(Boolean).join(' \u00b7 ') || 'See description';

    // Parse requirements text into array (one per non-empty line)
    const reqLines = (lead.requirements || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    const job = {
      title:          lead.jobTitle,
      department:     lead.department || 'External',
      type:           lead.employmentType || 'Full-time',
      location:       locationStr,
      experience:     'See description',
      salary:         salaryStr,
      description:    lead.description || 'See full job description.',
      requirements:   reqLines.length ? reqLines : ['See full job description.'],
      status:         'Active',
      isThirdParty:   true,
      advertisingFor: lead.companyName,
      leadRefId:      lead.refId,
      createdAt:      new Date().toISOString()
    };

    try {
      const newJobId = await window.TektwigDB.addJob(job);

      // Stamp the lead with the published job ID and update status
      const updatedLead = Object.assign({}, lead, {
        publishedJobId: newJobId,
        status: 'In Progress'
      });
      await window.TektwigDB.updateEnterpriseLead(updatedLead);

      closeLeadModal();
      await loadLeads();
      alert(`Job listing published!\n\n"${lead.jobTitle}" is now live on the Careers page\nAdvertising for: ${lead.companyName}`);
    } catch (err) {
      console.error('Failed to publish job listing:', err);
      alert('Error publishing job. Please try again.');
    }
  };


  window.deleteLead = async function(id) {
    if (!confirm('Delete this enterprise lead? This cannot be undone.')) return;
    try {
      await window.TektwigDB.deleteEnterpriseLead(id);
      closeLeadModal();
      await loadLeads();
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  // Export leads CSV
  if (btnExportLeadsCSV) {
    btnExportLeadsCSV.addEventListener('click', () => {
      if (allLeads.length === 0) { alert('No leads to export.'); return; }
      const clean = v => `"${String(v || '').replace(/"/g, '""')}"`;
      let csv = 'Ref ID,Date,Company,Industry,Contact,Email,Phone,Job Title,Dept,Type,Location,City,Openings,Salary Min,Salary Max,Currency,Deadline,Package,Status\n';
      allLeads.forEach(l => {
        const date = new Date(l.submittedAt).toLocaleDateString('en-GB');
        csv += [clean(l.refId),clean(date),clean(l.companyName),clean(l.industry),clean(l.contactName),clean(l.email),clean(l.phone),clean(l.jobTitle),clean(l.department),clean(l.employmentType),clean(l.locationType),clean(l.city),l.openings||1,clean(l.salaryMin),clean(l.salaryMax),clean(l.currency),clean(l.deadline),clean(l.package),clean(l.status)].join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', 'tektwig_enterprise_leads.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Download Enterprise Candidate CV Helper
  window.downloadEnterpriseCV = async function(id) {
    try {
      const app = await window.TektwigDB.getEnterpriseApplication(id);
      if (!app || !app.cvFile) {
        alert('Resume CV file not found in local IndexedDB storage.');
        return;
      }
      const url = URL.createObjectURL(app.cvFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = app.cvFileName;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading enterprise CV:', err);
      alert('Failed to download CV file.');
    }
  };

  // Export Company-Specific Candidates CSV
  window.exportEnterpriseLeadApplicantsCSV = async function(leadRefId, companyName) {
    try {
      const apps = await window.TektwigDB.getEnterpriseApplicationsForLead(leadRefId);
      if (apps.length === 0) {
        alert('No candidate applications have been filed for this advertisement yet.');
        return;
      }
      const clean = v => `"${String(v || '').replace(/"/g, '""')}"`;
      let csv = 'Apply Date,Candidate Name,Email,Phone,Experience (Years),Portfolio,Cover Letter,Status\n';
      apps.forEach(app => {
        const appDate = new Date(app.appliedAt).toLocaleDateString('en-GB');
        csv += [
          clean(appDate),
          clean(app.name),
          clean(app.email),
          clean(app.phone),
          app.experience,
          clean(app.portfolio),
          clean(app.coverLetter),
          clean(app.status)
        ].join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `candidate_returns_${safeName}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting enterprise candidates:', err);
      alert('Failed to generate candidate spreadsheet.');
    }
  };

  loadLeads();
});

