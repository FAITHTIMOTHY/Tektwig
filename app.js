document.addEventListener('DOMContentLoaded', () => {

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
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
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
     DataRock Control Live Telemetry Simulator
     ========================================================================== */
  const telemetryLogs = document.getElementById('telemetry-logs');
  const chartLoadPercent = document.getElementById('chart-load-percent');
  const chartPoints = document.querySelectorAll('.chart-point');

  // Random log line pool
  const mockLogPool = [
    { type: 'success', text: 'Cloud Gateway: IP tunnel refresh completed' },
    { type: 'info', text: 'Endpoint Monitor: 42 assets audited, compliance 100%' },
    { type: 'success', text: 'DataRock Shield: Safe packet filters updated' },
    { type: 'warning', text: 'Intrusion Attempt: IP 104.22.42.16 throttled by firewalls' },
    { type: 'success', text: 'AI Analyzer: Pattern correlation query resolved (12ms)' },
    { type: 'info', text: 'Virtualization Node: Resources balanced successfully' },
    { type: 'success', text: 'Threat Shield: Zero payloads detected on database streams' },
    { type: 'warning', text: 'Datarock Alert: Endpoint device #12 CPU peak' }
  ];

  // Helper to append a dynamic log line
  const addTelemetryLog = () => {
    if (!telemetryLogs) return;
    const logItem = mockLogPool[Math.floor(Math.random() * mockLogPool.length)];
    const timeStr = new Date().toISOString().split('T')[1].slice(0, 8);
    
    let textClass = 'text-info';
    if (logItem.type === 'success') textClass = 'text-success';
    if (logItem.type === 'warning') textClass = 'text-warning';

    const newLine = document.createElement('div');
    newLine.className = `log-line ${textClass}`;
    newLine.innerHTML = `<span class="text-muted">[${timeStr}]</span> ${logItem.text}`;
    
    telemetryLogs.appendChild(newLine);
    
    // Auto-scroll terminal
    telemetryLogs.scrollTop = telemetryLogs.scrollHeight;

    // Prune logs if they get too long
    if (telemetryLogs.childElementCount > 15) {
      telemetryLogs.removeChild(telemetryLogs.firstElementChild);
    }
  };

  // Animate Terminal Chart
  const updateTerminalChart = () => {
    if (chartPoints.length === 0) return;
    
    let loadSum = 0;
    chartPoints.forEach(point => {
      const randomHeight = Math.floor(Math.random() * 80) + 15; // 15% to 95%
      point.style.setProperty('--height', `${randomHeight}%`);
      loadSum += randomHeight;
    });

    const averageLoad = Math.floor(loadSum / chartPoints.length);
    if (chartLoadPercent) {
      chartLoadPercent.textContent = `Load: ${averageLoad}%`;
    }

    // Dynamic numbers
    const statBlocks = document.getElementById('stat-blocks');
    if (statBlocks) {
      const currentBlocks = parseInt(statBlocks.textContent.replace('K+', ''));
      if (Math.random() > 0.6) {
        statBlocks.textContent = `${currentBlocks + 1}K+`;
      }
    }

    const statPing = document.getElementById('stat-ping');
    if (statPing) {
      const randomPing = (Math.random() * 0.8 + 0.8).toFixed(1);
      statPing.textContent = `${randomPing}ms`;
    }
  };

  // Run simulators
  setInterval(addTelemetryLog, 4000);
  setInterval(updateTerminalChart, 2500);

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

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get data
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-msg').value.trim();

      // Save to IndexedDB
      if (window.TektwigDB) {
        try {
          await window.TektwigDB.saveContactInquiry({
            name,
            email,
            subject,
            message,
            submittedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error('Failed to save contact inquiry to DB:', err);
        }
      }

      // Reset form fields
      contactForm.reset();
      calculateEstimate(); // Reset calculator values too

      // Show beautiful Toast Notification
      const toast = document.createElement('div');
      toast.className = 'toast-msg';
      toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <div>
          <strong style="display:block;">Inquiry Transmitted!</strong>
          <span style="font-size:0.8rem;color:var(--text-muted);">Thank you ${name}. Our security team will contact you at ${email} within 2 hours.</span>
        </div>
      `;
      document.body.appendChild(toast);

      // Trigger animation
      setTimeout(() => {
        toast.classList.add('show');
      }, 100);

      // Remove after 6 seconds
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          toast.remove();
        }, 500);
      }, 6000);
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

});

