/**
 * Tektwig Admin Portal — Login and 2FA controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const credentialsForm = document.getElementById('credentials-form');
  const otpForm = document.getElementById('otp-form');
  const errorBox = document.getElementById('error-box');
  
  const stepCredentials = document.getElementById('step-credentials');
  const step2fa = document.getElementById('step-2fa');
  
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnOtpSubmit = document.getElementById('btn-otp-submit');
  const btnOtpBack = document.getElementById('btn-otp-back');
  
  const adminEmail = document.getElementById('admin-email');
  const adminPassword = document.getElementById('admin-password');
  
  const otpFields = document.querySelectorAll('.otp-field');

  // Check if session is already active. If yes, redirect to index
  if (sessionStorage.getItem('tektwig_admin_session')) {
    window.location.replace('index.html');
    return;
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
    // Scroll error into view
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  /* ==========================================================================
     OTP Digits Form Inputs Auto-Focus Chaining
     ========================================================================== */
  otpFields.forEach((field, idx) => {
    // Keep numeric only
    field.addEventListener('input', (e) => {
      const val = e.target.value;
      // Strip non-numbers
      e.target.value = val.replace(/[^0-9]/g, '');
      
      if (e.target.value.length === 1) {
        if (idx < otpFields.length - 1) {
          // Enable next, focus it
          otpFields[idx + 1].disabled = false;
          otpFields[idx + 1].focus();
        }
      }
    });

    field.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (field.value.length === 0 && idx > 0) {
          // Empty, go back
          otpFields[idx - 1].focus();
          otpFields[idx].disabled = true;
        } else {
          // Clear current field
          field.value = '';
        }
      }
    });
  });

  /* ==========================================================================
     Submit Step 1: Credentials
     ========================================================================== */
  credentialsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const originalText = btnLoginSubmit.innerHTML;
    btnLoginSubmit.disabled = true;
    btnLoginSubmit.innerHTML = '<span>Verifying credentials...</span>';

    try {
      const response = await fetch('auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonPayload = JSON.stringify({
          email: adminEmail.value.trim(),
          password: adminPassword.value
        })
      });

      const data = await response.json();

      if (data.status === 'otp_required') {
        // Switch views
        stepCredentials.style.display = 'none';
        step2fa.style.display = 'block';
        
        // Reset and focus first OTP field
        otpFields.forEach((f, i) => {
          f.value = '';
          f.disabled = i > 0;
        });
        setTimeout(() => otpFields[0].focus(), 100);
      } else {
        showError(data.message || 'Authentication request failed.');
      }
    } catch (err) {
      console.error('Credentials submission error:', err);
      showError('Network connectivity error. Could not connect to auth controller.');
    } finally {
      btnLoginSubmit.disabled = false;
      btnLoginSubmit.innerHTML = originalText;
    }
  });

  /* ==========================================================================
     Submit Step 2: OTP Verification
     ========================================================================== */
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    // Reconstruct 6-digit code from digits
    let otpCode = '';
    otpFields.forEach(f => {
      otpCode += f.value;
    });

    if (otpCode.length !== 6) {
      showError('Please enter a full 6-digit verification code.');
      return;
    }

    const originalText = btnOtpSubmit.innerHTML;
    btnOtpSubmit.disabled = true;
    btnOtpSubmit.innerHTML = '<span>Checking code...</span>';

    try {
      const response = await fetch('auth.php?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode })
      });

      const data = await response.json();

      if (data.status === 'success' && data.session) {
        // Save the JWT session securely in sessionStorage
        sessionStorage.setItem('tektwig_admin_session', JSON.stringify(data.session));
        
        // Redirect to admin panel dashboard
        window.location.replace('index.html');
      } else {
        showError(data.message || 'OTP verification failed.');
        
        // Reset fields
        otpFields.forEach((f, i) => {
          f.value = '';
          f.disabled = i > 0;
        });
        otpFields[0].focus();
      }
    } catch (err) {
      console.error('OTP submission error:', err);
      showError('Network connectivity error during OTP verification.');
    } finally {
      btnOtpSubmit.disabled = false;
      btnOtpSubmit.innerHTML = originalText;
    }
  });

  /* ==========================================================================
     Back to Credentials button
     ========================================================================== */
  btnOtpBack.addEventListener('click', () => {
    hideError();
    step2fa.style.display = 'none';
    stepCredentials.style.display = 'block';
    adminPassword.value = '';
    adminPassword.focus();
  });
});
