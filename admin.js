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
});
