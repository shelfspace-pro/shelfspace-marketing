/**
 * ShelfSpace Demo Modal
 * Self-contained: injects modal HTML + CSS, handles email verification flow.
 * Include on any page and call openDemoModal() from a button.
 */
(function () {
  var API_BASE = 'https://ourshelf.space/api/public';
  var verifiedEmail = null;

  // Inject CSS
  var style = document.createElement('style');
  style.textContent = [
    '.demo-overlay{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;transition:opacity .2s}',
    '.demo-overlay.open{display:flex;opacity:1}',
    '.demo-modal{background:#fff;border-radius:16px;width:100%;max-width:440px;margin:16px;box-shadow:0 8px 32px rgba(27,67,50,0.12);position:relative;overflow:hidden}',
    '.demo-modal::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#95d5b2,#40916c)}',
    '.demo-close{position:absolute;top:16px;right:16px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:#94a3b8;border-radius:8px;transition:all .15s;font-size:18px;z-index:1}',
    '.demo-close:hover{background:#f1f5f9;color:#1e293b}',
    '.demo-body{padding:36px 32px 32px}',
    '.demo-body h2{font-size:22px;font-weight:700;color:#1b4332;margin-bottom:6px}',
    '.demo-body p.subtitle{font-size:15px;color:#64748b;line-height:1.5;margin-bottom:24px}',
    '.demo-input{width:100%;padding:12px 16px;border:1px solid #e2e8f0;border-radius:12px;font-size:15px;font-family:var(--font-display);color:#1e293b;outline:none;transition:border-color .2s,box-shadow .2s}',
    '.demo-input:focus{border-color:#1b4332;box-shadow:0 0 0 3px rgba(27,67,50,0.08)}',
    '.demo-input::placeholder{color:#94a3b8}',
    '.demo-btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#1b4332;color:#fff;padding:14px 24px;border-radius:12px;font-size:15px;font-weight:600;border:none;cursor:pointer;font-family:var(--font-display);transition:all .3s cubic-bezier(.22,1,.36,1);box-shadow:0 4px 16px rgba(27,67,50,0.25);margin-top:16px}',
    '.demo-btn:hover{background:#2d6a4f;transform:translateY(-1px);box-shadow:0 8px 32px rgba(27,67,50,0.35)}',
    '.demo-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none}',
    '.demo-btn svg{animation:demo-spin 1s linear infinite}',
    '@keyframes demo-spin{to{transform:rotate(360deg)}}',
    '.demo-error{font-size:13px;color:#dc2626;margin-top:12px;display:none}',
    '.demo-step{display:none}',
    '.demo-step.active{display:block}',
    '.demo-code-input{text-align:center;font-family:var(--font-mono);font-size:24px;letter-spacing:6px;font-weight:700}',
    '.demo-portal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}',
    '.demo-portal-card{border:1.5px solid #e2e8f0;border-radius:12px;padding:20px 16px;text-align:center;cursor:pointer;transition:all .3s cubic-bezier(.22,1,.36,1)}',
    '.demo-portal-card:hover{border-color:#95d5b2;background:#f0faf4;transform:translateY(-2px);box-shadow:0 4px 16px rgba(27,67,50,0.08)}',
    '.demo-portal-card .icon{width:48px;height:48px;border-radius:12px;background:#f0faf4;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#1b4332}',
    '.demo-portal-card h3{font-size:15px;font-weight:700;color:#1b4332;margin-bottom:4px}',
    '.demo-portal-card p{font-size:12px;color:#64748b;line-height:1.4}',
    '.demo-resend{font-size:13px;color:#64748b;margin-top:16px;text-align:center}',
    '.demo-resend a{color:#40916c;font-weight:600;text-decoration:none;cursor:pointer}',
    '.demo-resend a:hover{color:#1b4332}',
  ].join('\n');
  document.head.appendChild(style);

  // Inject modal HTML
  var overlay = document.createElement('div');
  overlay.className = 'demo-overlay';
  overlay.id = 'demoOverlay';
  overlay.innerHTML = [
    '<div class="demo-modal">',
    '  <button class="demo-close" onclick="closeDemoModal()">&times;</button>',
    '  <div class="demo-body">',

    // Step 1: Email
    '    <div class="demo-step active" id="demoStep1">',
    '      <h2>Try ShelfSpace</h2>',
    '      <p class="subtitle">Enter your email to get a quick access code. No account needed.</p>',
    '      <input type="email" class="demo-input" id="demoEmail" placeholder="you@company.com" autocomplete="email" />',
    '      <button class="demo-btn" id="demoSendBtn" onclick="demoSendCode()">Send Access Code</button>',
    '      <div class="demo-error" id="demoError1"></div>',
    '    </div>',

    // Step 2: Code
    '    <div class="demo-step" id="demoStep2">',
    '      <h2>Enter your code</h2>',
    '      <p class="subtitle">We sent a 6-digit code to <strong id="demoEmailDisplay"></strong></p>',
    '      <input type="text" class="demo-input demo-code-input" id="demoCode" maxlength="6" placeholder="------" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" />',
    '      <button class="demo-btn" id="demoVerifyBtn" onclick="demoVerifyCode()">Verify</button>',
    '      <div class="demo-error" id="demoError2"></div>',
    '      <div class="demo-resend">Didn\'t get it? <a onclick="demoSendCode()">Resend code</a></div>',
    '    </div>',

    // Step 3: Portal picker
    '    <div class="demo-step" id="demoStep3">',
    '      <h2>Choose your view</h2>',
    '      <p class="subtitle">Explore ShelfSpace from either side of the partnership.</p>',
    '      <div class="demo-portal-grid">',
    '        <div class="demo-portal-card" onclick="demoLaunch(\'retailer\')">',
    '          <div class="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>',
    '          <h3>Retailer</h3>',
    '          <p>Manage vendors, view settlements, track payments</p>',
    '        </div>',
    '        <div class="demo-portal-card" onclick="demoLaunch(\'vendor\')">',
    '          <div class="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></div>',
    '          <h3>Vendor</h3>',
    '          <p>Track inventory, view sales, receive payouts</p>',
    '        </div>',
    '      </div>',
    '    </div>',

    '  </div>',
    '</div>',
  ].join('\n');
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeDemoModal();
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDemoModal();
  });

  // Expose global functions
  window.openDemoModal = function () {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      document.getElementById('demoEmail').focus();
    }, 100);
  };

  window.closeDemoModal = function () {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  function showStep(n) {
    document.querySelectorAll('.demo-step').forEach(function (el) {
      el.classList.remove('active');
    });
    document.getElementById('demoStep' + n).classList.add('active');
  }

  function showError(step, msg) {
    var el = document.getElementById('demoError' + step);
    el.textContent = msg;
    el.style.display = 'block';
  }

  function clearError(step) {
    document.getElementById('demoError' + step).style.display = 'none';
  }

  function setLoading(btn, loading) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.origText = btn.innerHTML;
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Please wait\u2026';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.origText;
    }
  }

  window.demoSendCode = async function () {
    var email = document.getElementById('demoEmail').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(1, 'Please enter a valid email address.');
      return;
    }
    clearError(1);
    verifiedEmail = email;

    var btn = document.getElementById('demoSendBtn');
    setLoading(btn, true);

    try {
      var res = await fetch(API_BASE + '/demo-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: email }),
      });
      var data = await res.json();

      if (!res.ok) {
        showError(1, data.error || 'Something went wrong.');
        setLoading(btn, false);
        return;
      }

      if (data.verified && data.skipCode) {
        // Already verified recently — skip to portal picker
        showStep(3);
      } else {
        // Show code input
        document.getElementById('demoEmailDisplay').textContent = email;
        showStep(2);
        setTimeout(function () {
          document.getElementById('demoCode').focus();
        }, 100);
      }
    } catch (err) {
      showError(1, 'Network error. Please try again.');
      setLoading(btn, false);
    }
  };

  window.demoVerifyCode = async function () {
    var code = document.getElementById('demoCode').value.trim();
    if (!code || code.length !== 6) {
      showError(2, 'Please enter the 6-digit code.');
      return;
    }
    clearError(2);

    var btn = document.getElementById('demoVerifyBtn');
    setLoading(btn, true);

    try {
      var res = await fetch(API_BASE + '/demo-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: verifiedEmail,
          code: code,
        }),
      });
      var data = await res.json();

      if (!res.ok) {
        showError(2, data.error || 'Invalid code.');
        setLoading(btn, false);
        return;
      }

      if (data.verified) {
        showStep(3);
      }
    } catch (err) {
      showError(2, 'Network error. Please try again.');
      setLoading(btn, false);
    }
  };

  window.demoLaunch = function (portal) {
    // Redirect to demo auth endpoint — it will create a session and redirect to the portal
    window.location.href =
      API_BASE +
      '/demo-auth?portal=' +
      encodeURIComponent(portal) +
      '&email=' +
      encodeURIComponent(verifiedEmail);
  };

  // Auto-submit code on 6 digits
  document.getElementById('demoCode').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length === 6) {
      demoVerifyCode();
    }
  });

  // Enter key on email input
  document.getElementById('demoEmail').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      demoSendCode();
    }
  });
})();
