document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     Utility: HTML Entity Escaper (XSS Prevention)
     ========================================================================== */
  const escapeHTML = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /* ==========================================================================
     Header Scroll & Sticky Navigation
     ========================================================================== */
  const header = document.getElementById('main-header');
  const navLinks = document.querySelectorAll('.nav-link');
  
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('sticky');
    } else {
      header.classList.remove('sticky');
    }

    // Dynamic Active Link Update
    let currentSectionId = '';
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    if (currentSectionId) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Skip external page links (e.g. careers.html) — they can't match a section ID
        if (!href || !href.startsWith('#')) return;
        link.classList.remove('active');
        if (href === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      });
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Run once in case page loads scrolled down

  /* ==========================================================================
     Mobile Navigation Toggle
     ========================================================================== */
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    // Close menu when link is clicked
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navMenu.classList.remove('open');
      });
    });
  }

  /* ==========================================================================
     NOTE: DataRock telemetry simulator was removed — the DOM elements it
     targeted (telemetry-logs, chart-points, stat-blocks, stat-ping) do not
     exist in any current page. The two setInterval timers were consuming
     CPU cycles every 2.5s / 4s with no visible effect.
     ========================================================================== */

  /* ==========================================================================
     Portfolio Filter
     ========================================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      portfolioItems.forEach(item => {
        const itemCat = item.getAttribute('data-category');
        if (filterValue === 'all' || itemCat === filterValue) {
          item.style.display = 'flex';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 10);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.9)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  /* ==========================================================================
     Portfolio Click Toggle (for touch/desktop description viewing)
     ========================================================================== */
  portfolioItems.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });

  /* ==========================================================================
     Dynamic "New Service" Badge Visibility Handler (7-day rule)
     ========================================================================== */
  const serviceCards = document.querySelectorAll('.service-card[data-released-date]');
  serviceCards.forEach(card => {
    const releasedStr = card.getAttribute('data-released-date');
    if (!releasedStr) return;

    const releaseDate = new Date(releasedStr);
    const today = new Date();
    const diffTime = today - releaseDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      const badge = card.querySelector('.service-card-badge');
      if (badge) badge.style.display = 'none';
      card.classList.remove('service-card--featured');
    }
  });

  /* ==========================================================================
     Testimonials Slider
     ========================================================================== */
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('.slide-dot');
  const prevBtn = document.getElementById('testimonial-prev');
  const nextBtn = document.getElementById('testimonial-next');
  let currentSlide = 0;
  let autoSlideInterval;

  const showSlide = (index) => {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Handle overflow boundaries
    if (index >= slides.length) currentSlide = 0;
    else if (index < 0) currentSlide = slides.length - 1;
    else currentSlide = index;

    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) {
      dots[currentSlide].classList.add('active');
    }
  };

  const nextSlide = () => showSlide(currentSlide + 1);
  const prevSlide = () => showSlide(currentSlide - 1);

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoSlide();
    });

    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoSlide();
    });

    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const targetIdx = parseInt(e.target.getAttribute('data-index'));
        showSlide(targetIdx);
        resetAutoSlide();
      });
    });

    // Auto rotate every 7 seconds
    const startAutoSlide = () => {
      autoSlideInterval = setInterval(nextSlide, 7000);
    };

    const resetAutoSlide = () => {
      clearInterval(autoSlideInterval);
      startAutoSlide();
    };

    startAutoSlide();
  }

  /* ==========================================================================
     Interactive Project Calculator
     ========================================================================== */
  const serviceCheckboxes = document.querySelectorAll('input[name="calc-service"]');
  const scaleSlider = document.getElementById('company-scale');
  const scaleValueDisplay = document.getElementById('company-scale-value');
  
  const calcTimeline = document.getElementById('calc-timeline');
  const calcBudget = document.getElementById('calc-budget');
  const calcComplexity = document.getElementById('calc-complexity');

  const calculateEstimate = () => {
    if (!scaleSlider) return;
    
    let baseCost = 0;
    let baseWeeks = 0;
    let selectedCount = 0;

    serviceCheckboxes.forEach(cb => {
      if (cb.checked) {
        baseCost += parseInt(cb.getAttribute('data-cost'));
        baseWeeks += parseInt(cb.getAttribute('data-weeks'));
        selectedCount++;
      }
    });

    const scale = parseInt(scaleSlider.value);
    
    // Format displays
    scaleValueDisplay.textContent = `${scale} endpoint${scale > 1 ? 's' : ''}`;

    if (selectedCount === 0) {
      calcTimeline.textContent = '0 Weeks';
      calcBudget.textContent = '$0';
      calcComplexity.textContent = 'No selection';
      calcComplexity.className = 'output-val';
      return;
    }

    // Math formulation
    // Multipliers based on endpoints scale
    const scaleMultiplier = 1 + (scale - 25) / 150; // Baseline 25 is 1.0. 250 endpoints scale cost up to ~2.5x
    
    const finalBudget = Math.round(baseCost * scaleMultiplier);
    
    // Timeline is non-linear (adding components extends project, but they run somewhat parallel)
    const averageComplexityMultiplier = 1 + (scale / 350); 
    const finalWeeks = Math.ceil((baseWeeks / (1.2 + (selectedCount * 0.1))) * averageComplexityMultiplier);

    // Complexity Rating
    let rating = 'Standard';
    let ratingClass = 'color-green';
    
    if (finalBudget >= 8000 || scale > 120) {
      rating = 'Mission Critical';
      ratingClass = 'color-purple';
    } else if (finalBudget >= 4000 || selectedCount >= 3) {
      rating = 'Enterprise';
      ratingClass = 'color-cyan';
    }

    // DOM Updates
    calcTimeline.textContent = `${finalWeeks} Weeks`;
    calcBudget.textContent = `$${finalBudget.toLocaleString()}`;
    calcComplexity.textContent = rating;
    calcComplexity.className = `output-val ${ratingClass}`;
  };

  // Event Listeners for Calculator
  if (scaleSlider) {
    scaleSlider.addEventListener('input', calculateEstimate);
    serviceCheckboxes.forEach(cb => {
      cb.addEventListener('change', calculateEstimate);
    });
    calculateEstimate(); // Run calculation initially
  }

  /* ==========================================================================
     Contact Form Toast submission
     ========================================================================== */
  const contactForm = document.getElementById('actual-contact-form');

  const showToastNotification = (htmlContent, isError = false) => {
    const toast = document.createElement('div');
    toast.className = `toast-msg${isError ? ' toast-error' : ''}`;
    const iconColor = isError ? '#ef4444' : 'var(--accent-cyan)';
    const iconSvg = isError
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

    toast.innerHTML = `
      ${iconSvg}
      <div>${htmlContent}</div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 6000);
  };

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Transmitting...</span>';
      }

      // Get data
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-msg').value.trim();

      try {
        if (!window.TektwigDB) {
          throw new Error('Database connection is uninitialized.');
        }

        await window.TektwigDB.saveContactInquiry({
          name,
          email,
          subject,
          message,
          submittedAt: new Date().toISOString()
        });

        // Reset form fields only on success
        contactForm.reset();
        if (typeof calculateEstimate === 'function') calculateEstimate();

        // Show Success Toast
        showToastNotification(`
          <strong style="display:block;">Inquiry Transmitted!</strong>
          <span style="font-size:0.8rem;color:var(--text-muted);">Thank you ${escapeHTML(name)}. Our team will contact you at ${escapeHTML(email)} within 2 hours.</span>
        `, false);

      } catch (err) {
        console.error('Failed to save contact inquiry to DB:', err);

        let errDetail = 'Failed to transmit inquiry to server. Please try again.';
        if (err.message && (err.message.includes('row-level security') || err.code === '42501')) {
          errDetail = 'Server security policy blocked insert (RLS policy missing). Please apply admin_security.sql on Supabase.';
        } else if (err.message) {
          errDetail = err.message;
        }

        // Show Error Toast
        showToastNotification(`
          <strong style="display:block;color:#ef4444;">Transmission Failed</strong>
          <span style="font-size:0.8rem;color:var(--text-muted);">${escapeHTML(errDetail)}</span>
        `, true);

      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }
      }
    });
  }

  /* ==========================================================================
     DataRock Control Showcase Tabs Switcher
     ========================================================================== */
  const datarockTabBtns = document.querySelectorAll('.datarock-tab-btn');
  const datarockTabPanes = document.querySelectorAll('.datarock-tab-pane');

  if (datarockTabBtns.length > 0) {
    datarockTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        datarockTabBtns.forEach(b => b.classList.remove('active'));
        datarockTabPanes.forEach(p => p.classList.remove('active'));

        // Add active class to clicked button
        btn.classList.add('active');

        // Show corresponding pane
        const tabId = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(`pane-${tabId}`);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  /* ==========================================================================
     Floating Scroll Navigation Actions
     ========================================================================== */
  const btnUp = document.getElementById('scroll-btn-up');
  const btnDown = document.getElementById('scroll-btn-down');

  if (btnUp) {
    btnUp.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (btnDown) {
    btnDown.addEventListener('click', () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }
  /* ==========================================================================
     Preloader Splash Screen
     ========================================================================== */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('fade-out');
        preloader.addEventListener('transitionend', () => {
          preloader.style.display = 'none';
        }, { once: true });
      }, 1200);
    });
  }

});

