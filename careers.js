/**
 * Tektwig Recruitment Portal - Careers Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  let allJobs = [];
  let selectedJob = null;
  let uploadedCVFile = null;

  // Cache DOM elements
  const jobsGrid = document.getElementById('jobs-grid');
  const searchInput = document.getElementById('job-search-input');
  const departmentFilter = document.getElementById('department-filter');
  
  // Modal Elements
  const modalBackdrop = document.getElementById('application-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const successCloseBtn = document.getElementById('btn-success-close');
  
  // Modal Job Details
  const modalJobDept = document.getElementById('modal-job-dept');
  const modalJobTitle = document.getElementById('modal-job-title');
  const modalJobLocation = document.getElementById('modal-job-location');
  const modalJobType = document.getElementById('modal-job-type');
  const modalJobExp = document.getElementById('modal-job-exp');
  const modalJobSalary = document.getElementById('modal-job-salary');
  const modalJobDesc = document.getElementById('modal-job-desc');
  const modalJobReqs = document.getElementById('modal-job-reqs');
  
  // Form and Screens
  const appForm = document.getElementById('application-form');
  const successContainer = document.getElementById('form-success-container');
  const jobDetailsView = document.getElementById('job-details-view');
  
  // Form Inputs
  const appName = document.getElementById('app-name');
  const appEmail = document.getElementById('app-email');
  const appPhone = document.getElementById('app-phone');
  const appExperience = document.getElementById('app-experience');
  const appPortfolio = document.getElementById('app-portfolio');
  const appCoverLetter = document.getElementById('app-cover-letter');
  
  // File Upload Elements
  const cvDropZone = document.getElementById('cv-drop-zone');
  const cvFileInput = document.getElementById('app-cv-file');
  const cvFileDetails = document.getElementById('cv-file-details');

  // Mobile Toggle navigation (from app.js)
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });
  }

  // Load and render jobs initially
  async function loadJobs() {
    try {
      if (window.TektwigDB) {
        allJobs = await window.TektwigDB.getJobs();
        renderJobs(allJobs);
      } else {
        console.error('TektwigDB database is not initialized.');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      jobsGrid.innerHTML = `
        <div class="empty-state-content" style="grid-column: 1/-1;">
          <p style="color:#ef4444;">Error loading job positions. Please reload the page.</p>
        </div>`;
    }
  }

  // Render jobs grid
  function renderJobs(jobsList) {
    if (jobsList.length === 0) {
      jobsGrid.innerHTML = `
        <div class="empty-state-content" style="grid-column: 1/-1; padding: 40px; text-align: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom: 12px;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          <p style="color:var(--text-muted);">No open positions found matching your criteria.</p>
        </div>`;
      return;
    }

    jobsGrid.innerHTML = jobsList.map(job => `
      <div class="job-card glass-panel" id="job-card-${job.id}">
        <div class="job-header">
          <span class="job-dept-tag">${job.department}</span>
          <span class="job-type-tag">${job.type}</span>
        </div>
        <h3 class="job-card-title">${job.title}</h3>
        
        <div class="job-meta-info">
          <div class="job-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${job.location}</span>
          </div>
          <div class="job-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${job.experience}</span>
          </div>
        </div>
        
        <p class="job-card-desc">${job.description.length > 130 ? job.description.slice(0, 130) + '...' : job.description}</p>
        
        <div class="job-card-footer">
          <span class="job-card-salary">${job.salary}</span>
          <button class="btn btn-primary btn-sm btn-apply" data-id="${job.id}">Apply Now</button>
        </div>
      </div>
    `).join('');

    // Attach event listeners to apply buttons
    document.querySelectorAll('.btn-apply').forEach(button => {
      button.addEventListener('click', (e) => {
        const jobId = e.target.getAttribute('data-id');
        openApplyModal(jobId);
      });
    });
  }

  // Handle Search and Filtering
  function filterJobs() {
    const query = searchInput.value.toLowerCase().trim();
    const dept = departmentFilter.value;

    const filtered = allJobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(query) || 
                            job.description.toLowerCase().includes(query) || 
                            job.department.toLowerCase().includes(query);
      const matchesDept = dept === 'all' || job.department === dept;
      return matchesSearch && matchesDept;
    });

    renderJobs(filtered);
  }

  searchInput.addEventListener('keyup', filterJobs);
  departmentFilter.addEventListener('change', filterJobs);

  // Modal Functionality
  async function openApplyModal(jobId) {
    try {
      selectedJob = await window.TektwigDB.getJob(jobId);
      if (!selectedJob) return;

      // Populate Job Details
      modalJobDept.textContent = selectedJob.department;
      modalJobTitle.textContent = selectedJob.title;
      modalJobLocation.textContent = selectedJob.location;
      modalJobType.textContent = selectedJob.type;
      modalJobExp.textContent = selectedJob.experience;
      modalJobSalary.textContent = selectedJob.salary;
      modalJobDesc.textContent = selectedJob.description;
      
      // Populate requirements
      modalJobReqs.innerHTML = selectedJob.requirements.map(req => `<li>${req}</li>`).join('');

      // Reset application form and upload variables
      appForm.reset();
      clearUploadedFile();
      
      // Auto-populate for demo/testing mode
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo') === 'true') {
        appName.value = 'Timothy Faith';
        appEmail.value = 'timothy@example.com';
        appPhone.value = '+2348123456789';
        appExperience.value = 4;
        appPortfolio.value = 'https://github.com/timothy';
        appCoverLetter.value = "I am writing to apply for the Full-Stack Software Engineer role. I have over 4 years of experience building secure, scalable applications. Tektwig's cloud-core systems look amazing and I would love to contribute to the software dev team.";

        const mockFile = new Blob(
          ['Timothy Faith - Resume\n\nContact: timothy@example.com | +234 812 345 6789\n\nExperience: 4 Years as a Full-Stack Engineer.\nSkills: HTML, CSS, Javascript, Node.js, SQL.'],
          { type: 'text/plain' }
        );
        
        // Define filename property
        Object.defineProperty(mockFile, 'name', {
          value: 'timothy_faith_resume.txt',
          writable: false
        });
        
        handleFileSelected(mockFile);
      }
      
      // Show form screen, hide success screen
      appForm.style.display = 'block';
      jobDetailsView.style.display = 'block';
      successContainer.style.display = 'none';

      // Open Modal Backdrop
      modalBackdrop.classList.add('show');
      document.body.style.overflow = 'hidden'; // Lock background scroll
    } catch (err) {
      console.error('Error opening application modal:', err);
    }
  }

  function closeApplyModal() {
    modalBackdrop.classList.remove('show');
    document.body.style.overflow = ''; // Unlock scroll
    selectedJob = null;
  }

  modalCloseBtn.addEventListener('click', closeApplyModal);
  successCloseBtn.addEventListener('click', closeApplyModal);

  // Close modal when clicking on backdrop shadow
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeApplyModal();
    }
  });

  /* ==========================================================================
     Drag & Drop CV File Upload Area
     ========================================================================== */
  
  // Click drop zone triggers file input click
  cvDropZone.addEventListener('click', () => {
    cvFileInput.click();
  });

  // Handle file input change
  cvFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    cvDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      cvDropZone.classList.add('drop-zone--over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    cvDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      cvDropZone.classList.remove('drop-zone--over');
    }, false);
  });

  cvDropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  function handleFileSelected(file) {
    const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    
    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit. Please upload a smaller resume.');
      clearUploadedFile();
      return;
    }

    // Verify types
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isDoc = ['pdf', 'txt', 'docx', 'doc'].includes(fileExtension);
    
    if (!isDoc && !validTypes.includes(file.type)) {
      alert('Invalid file format. Please upload a PDF, DOCX, or plain TXT document.');
      clearUploadedFile();
      return;
    }

    uploadedCVFile = file;

    // Show details
    const fileSizeFormatted = formatBytes(file.size);
    cvDropZone.style.display = 'none';
    cvFileDetails.style.display = 'block';
    cvFileDetails.innerHTML = `
      <div class="cv-details-box">
        <svg class="cv-details-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <div class="cv-details-info">
          <div class="cv-details-name">${file.name}</div>
          <div class="cv-details-size">${fileSizeFormatted}</div>
        </div>
        <button type="button" class="cv-remove-btn" id="btn-remove-cv" aria-label="Remove File">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `;

    // Attach remove event listener
    document.getElementById('btn-remove-cv').addEventListener('click', (e) => {
      e.stopPropagation();
      clearUploadedFile();
    });
  }

  function clearUploadedFile() {
    uploadedCVFile = null;
    cvFileInput.value = '';
    cvDropZone.style.display = 'block';
    cvFileDetails.style.display = 'none';
    cvFileDetails.innerHTML = '';
  }

  // Format bytes helper
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /* ==========================================================================
     Application Form Submission
     ========================================================================== */
  
  appForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedJob) {
      alert('Error: No target job selected.');
      return;
    }

    if (!uploadedCVFile) {
      alert('Please upload your CV/Resume to proceed.');
      return;
    }

    // Set submit button loading state
    const submitBtn = document.getElementById('btn-submit-app');
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Transmitting credentials...</span>';

    // Gather payload
    const applicationPayload = {
      name: appName.value.trim(),
      email: appEmail.value.trim(),
      phone: appPhone.value.trim(),
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      experience: parseInt(appExperience.value),
      portfolio: appPortfolio.value.trim(),
      coverLetter: appCoverLetter.value.trim(),
      cvFile: uploadedCVFile, // File object (subclass of Blob)
      cvFileName: uploadedCVFile.name,
      cvFileType: uploadedCVFile.type,
      status: 'Pending Review',
      appliedAt: new Date().toISOString()
    };

    try {
      if (window.TektwigDB) {
        // Save to IndexedDB
        const applicationId = await window.TektwigDB.saveApplication(applicationPayload);
        
        // Generate random track number
        const randomTrack = 'TK-' + (Math.floor(Math.random() * 90000) + 10000);

        // Populate Success view
        document.getElementById('conf-name').textContent = applicationPayload.name;
        document.getElementById('conf-role').textContent = applicationPayload.jobTitle;
        document.getElementById('conf-track-id').textContent = `${randomTrack}-${applicationId}`;

        // Switch Screen views in modal
        appForm.style.display = 'none';
        jobDetailsView.style.display = 'none';
        successContainer.style.display = 'block';

        // Scroll modal content to top
        document.querySelector('.app-modal').scrollTop = 0;
      }
    } catch (err) {
      console.error('Failed to save application to DB:', err);
      alert('An error occurred during submission. Please try again.');
    } finally {
      // Restore submit button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    }
  });

  // Start initialization
  loadJobs();
});
