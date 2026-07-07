/**
 * Tektwig Enterprise Recruitment Portal — recruit.js
 * Handles form submission, validation, and IndexedDB persistence for enterprise leads.
 */

document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const navMenu   = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });
  }

  // Smooth scroll for anchor nav links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ==========================================================================
     Package card highlight on click
     ========================================================================== */
  const packageCards = document.querySelectorAll('.pkg-card');
  const packageInput = document.getElementById('preferred-package');

  packageCards.forEach(card => {
    card.addEventListener('click', () => {
      packageCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if (packageInput) {
        packageInput.value = card.getAttribute('data-package');
      }
    });
  });

  /* ==========================================================================
     Form validation helpers
     ========================================================================== */
  function setError(input, msg) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    let errEl = group.querySelector('.field-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'field-error';
      group.appendChild(errEl);
    }
    errEl.textContent = msg;
  }

  function clearError(input) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.remove('has-error');
    const errEl = group.querySelector('.field-error');
    if (errEl) errEl.remove();
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateForm(form) {
    let valid = true;
    const required = form.querySelectorAll('[required]');
    required.forEach(input => {
      clearError(input);
      if (!input.value.trim()) {
        setError(input, 'This field is required.');
        valid = false;
      } else if (input.type === 'email' && !validateEmail(input.value.trim())) {
        setError(input, 'Please enter a valid email address.');
        valid = false;
      } else if (input.type === 'number') {
        const val = parseInt(input.value);
        if (isNaN(val) || val < 1) {
          setError(input, 'Must be at least 1.');
          valid = false;
        }
      }
    });

    // Terms checkbox
    const terms = form.querySelector('#terms-agree');
    if (terms && !terms.checked) {
      setError(terms, 'You must agree to the terms to continue.');
      valid = false;
    }

    return valid;
  }

  /* ==========================================================================
     Reference ID generator
     ========================================================================== */
  function generateRefId() {
    const year   = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `ERL-${year}-${random}`;
  }

  /* ==========================================================================
     Form submission
     ========================================================================== */
  const recruitForm  = document.getElementById('enterprise-recruit-form');
  const formScreen   = document.getElementById('form-screen');
  const successScreen = document.getElementById('success-screen');
  const refIdDisplay = document.getElementById('success-ref-id');
  const submitBtn    = document.getElementById('recruit-submit-btn');

  if (recruitForm) {
    recruitForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm(recruitForm)) return;

      // Disable button
      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="btn-spinner"></span> Submitting…`;

      try {
        const refId = generateRefId();

        const leadData = {
          refId,
          companyName:     recruitForm.querySelector('#company-name').value.trim(),
          industry:        recruitForm.querySelector('#company-industry').value.trim(),
          contactName:     recruitForm.querySelector('#contact-name').value.trim(),
          email:           recruitForm.querySelector('#contact-email').value.trim(),
          phone:           recruitForm.querySelector('#contact-phone').value.trim(),
          jobTitle:        recruitForm.querySelector('#job-title').value.trim(),
          department:      recruitForm.querySelector('#job-department').value.trim(),
          locationType:    recruitForm.querySelector('#location-type').value,
          city:            recruitForm.querySelector('#job-city').value.trim(),
          employmentType:  recruitForm.querySelector('#employment-type').value,
          salaryMin:       recruitForm.querySelector('#salary-min').value.trim(),
          salaryMax:       recruitForm.querySelector('#salary-max').value.trim(),
          currency:        recruitForm.querySelector('#salary-currency').value,
          openings:        parseInt(recruitForm.querySelector('#num-openings').value) || 1,
          deadline:        recruitForm.querySelector('#application-deadline').value,
          description:     recruitForm.querySelector('#job-description').value.trim(),
          requirements:    recruitForm.querySelector('#job-requirements').value.trim(),
          package:         recruitForm.querySelector('#preferred-package').value || 'Not Selected',
          source:          recruitForm.querySelector('#heard-from').value.trim(),
          status:          'New',
          submittedAt:     new Date().toISOString()
        };

        await window.TektwigDB.saveEnterpriseLead(leadData);

        // Show success
        if (refIdDisplay) refIdDisplay.textContent = refId;
        if (formScreen)   formScreen.style.display  = 'none';
        if (successScreen) {
          successScreen.style.display = 'flex';
          successScreen.scrollIntoView({ behavior: 'smooth' });
        }

      } catch (err) {
        console.error('Failed to save enterprise lead:', err);
        alert('An error occurred. Please try again.');
        submitBtn.disabled  = false;
        submitBtn.innerHTML = originalHTML;
      }
    });
  }

  // "Submit Another" button
  const btnSubmitAnother = document.getElementById('btn-submit-another');
  if (btnSubmitAnother) {
    btnSubmitAnother.addEventListener('click', () => {
      if (recruitForm)   recruitForm.reset();
      if (formScreen)    formScreen.style.display  = 'block';
      if (successScreen) successScreen.style.display = 'none';
      packageCards.forEach(c => c.classList.remove('selected'));
      if (packageInput) packageInput.value = '';
      
      // Reset submit button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Submit Hiring Brief <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ==========================================================================
     Live input clearing of errors
     ========================================================================== */
  if (recruitForm) {
    recruitForm.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => clearError(input));
      input.addEventListener('change', () => clearError(input));
    });
  }

});
