/**
 * ShelfiQ Live Chat Widget
 * Self-contained: injects all HTML + CSS, manages chat state.
 * Include on any page via <script src="/shelfiq-widget.js"></script>
 */
(function () {
  var MAX_MESSAGES = 10;
  var STORAGE_KEY = 'shelfiq-chat-open';
  var messages = []; // { role, content } for API
  var userMsgCount = 0;
  var isLoading = false;

  // --- CSS ---
  var style = document.createElement('style');
  style.textContent = [
    /* Container & toggle */
    '.sq-toggle{position:fixed;bottom:24px;right:24px;z-index:9998;display:flex;align-items:center;gap:8px;background:#1b4332;color:#fff;border:none;padding:12px 20px 12px 16px;border-radius:100px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 24px rgba(27,67,50,0.3);transition:all .3s cubic-bezier(.22,1,.36,1)}',
    '.sq-toggle:hover{background:#2d6a4f;transform:translateY(-2px);box-shadow:0 8px 32px rgba(27,67,50,0.4)}',
    '.sq-toggle svg{flex-shrink:0}',
    '.sq-iq{background:linear-gradient(135deg,#40916c,#95d5b2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}',

    /* Chat window */
    '.sq-window{position:fixed;bottom:24px;right:24px;z-index:9998;width:400px;height:520px;max-height:calc(100dvh - 48px);background:#fff;border-radius:20px;box-shadow:0 16px 64px rgba(27,67,50,0.18),0 2px 8px rgba(27,67,50,0.06);display:none;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0}',
    '.sq-window.open{display:flex}',

    /* Title bar */
    '.sq-title{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #f1f5f9;background:#f8fafc;flex-shrink:0}',
    '.sq-title-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#1b4332,#40916c);display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '.sq-title-icon svg{width:16px;height:16px;color:#fff}',
    '.sq-title-info{flex:1;min-width:0}',
    '.sq-title-name{font-size:14px;font-weight:700;color:#1b4332}',
    '.sq-title-status{font-size:11px;color:#40916c;display:flex;align-items:center;gap:5px}',
    '.sq-title-status::before{content:"";width:6px;height:6px;background:#40916c;border-radius:50%}',
    '.sq-close{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:#94a3b8;border-radius:8px;transition:all .15s;font-size:18px;flex-shrink:0}',
    '.sq-close:hover{background:#f1f5f9;color:#1e293b}',

    /* Messages area */
    '.sq-messages{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}',

    /* Message bubbles */
    '.sq-msg{max-width:85%;padding:11px 15px;border-radius:16px;font-size:14px;line-height:1.6;animation:sq-fade .3s ease both;word-wrap:break-word}',
    '.sq-msg a{color:inherit;text-decoration:underline}',
    '.sq-msg.user{align-self:flex-end;background:#1b4332;color:#fff;border-bottom-right-radius:6px}',
    '.sq-msg.ai{align-self:flex-start;background:#f8fafc;color:#334155;border:1px solid #f1f5f9;border-bottom-left-radius:6px}',
    '.sq-msg.ai strong{color:#1b4332}',
    '@keyframes sq-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',

    /* Starter chips */
    '.sq-chips{display:flex;flex-direction:column;gap:8px;padding:0 18px 12px}',
    '.sq-chip{background:#f0faf4;border:1px solid rgba(149,213,178,0.4);color:#1b4332;padding:10px 14px;border-radius:12px;font-size:13px;font-weight:500;cursor:pointer;text-align:left;transition:all .2s;font-family:inherit;line-height:1.4}',
    '.sq-chip:hover{background:#d8f3dc;border-color:#95d5b2}',

    /* Loading dots */
    '.sq-loading{align-self:flex-start;display:flex;gap:4px;padding:14px 18px;background:#f8fafc;border:1px solid #f1f5f9;border-radius:16px;border-bottom-left-radius:6px}',
    '.sq-dot{width:7px;height:7px;background:#94a3b8;border-radius:50%;animation:sq-bounce .6s ease-in-out infinite}',
    '.sq-dot:nth-child(2){animation-delay:.15s}',
    '.sq-dot:nth-child(3){animation-delay:.3s}',
    '@keyframes sq-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',

    /* Input bar */
    '.sq-input-bar{display:flex;align-items:center;gap:8px;padding:14px 16px;border-top:1px solid #f1f5f9;background:#fff;flex-shrink:0}',
    '.sq-input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;color:#1e293b;background:transparent;min-width:0}',
    '.sq-input::placeholder{color:#94a3b8}',
    '.sq-send{width:34px;height:34px;border-radius:10px;border:none;background:#1b4332;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}',
    '.sq-send:hover{background:#2d6a4f}',
    '.sq-send:disabled{opacity:0.4;cursor:not-allowed}',

    /* Cap message */
    '.sq-cap{text-align:center;padding:16px 18px;font-size:13px;color:#64748b;line-height:1.5;border-top:1px solid #f1f5f9;flex-shrink:0}',
    '.sq-cap a{color:#40916c;font-weight:600;text-decoration:none}',
    '.sq-cap a:hover{color:#1b4332}',

    /* Mobile */
    '@media(max-width:480px){',
    '  .sq-window{width:calc(100vw - 16px);height:calc(100dvh - 16px);max-height:calc(100dvh - 16px);bottom:8px;right:8px;border-radius:16px}',
    '  .sq-toggle{bottom:16px;right:16px}',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  // --- Toggle Button ---
  var toggle = document.createElement('button');
  toggle.className = 'sq-toggle';
  toggle.setAttribute('aria-label', 'Ask ShelfiQ');
  toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Ask Shelf<span class="sq-iq">iQ</span>';
  document.body.appendChild(toggle);

  // --- Chat Window ---
  var win = document.createElement('div');
  win.className = 'sq-window';
  win.innerHTML = [
    '<div class="sq-title">',
    '  <div class="sq-title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><rect x="3" y="12" width="18" height="8" rx="3"/></svg></div>',
    '  <div class="sq-title-info"><div class="sq-title-name">Shelf<span class="sq-iq">iQ</span></div><div class="sq-title-status">Online</div></div>',
    '  <button class="sq-close" aria-label="Close chat">&times;</button>',
    '</div>',
    '<div class="sq-messages" id="sqMessages"></div>',
    '<div class="sq-chips" id="sqChips"></div>',
    '<div class="sq-input-bar" id="sqInputBar">',
    '  <input class="sq-input" id="sqInput" type="text" placeholder="Ask about ShelfSpace..." autocomplete="off">',
    '  <button class="sq-send" id="sqSend" aria-label="Send"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>',
    '</div>',
  ].join('\n');
  document.body.appendChild(win);

  var messagesEl = document.getElementById('sqMessages');
  var chipsEl = document.getElementById('sqChips');
  var inputBar = document.getElementById('sqInputBar');
  var input = document.getElementById('sqInput');
  var sendBtn = document.getElementById('sqSend');
  var closeBtn = win.querySelector('.sq-close');

  // --- Greeting ---
  function addGreeting() {
    appendBubble('ai', "Hi! I'm ShelfiQ, ShelfSpace's AI assistant. I can answer questions about consignment, wholesale payments, platform features, pricing, and more. What would you like to know?");
  }

  // --- Starter Chips ---
  var starters = [
    'How does consignment work?',
    'What POS systems do you support?',
    'What is ShelfiQ?',
  ];

  function renderChips() {
    chipsEl.innerHTML = '';
    starters.forEach(function (text) {
      var chip = document.createElement('button');
      chip.className = 'sq-chip';
      chip.textContent = text;
      chip.addEventListener('click', function () {
        sendMessage(text);
      });
      chipsEl.appendChild(chip);
    });
  }

  function hideChips() {
    chipsEl.style.display = 'none';
  }

  // --- Bubble helpers ---
  function appendBubble(role, text) {
    var div = document.createElement('div');
    div.className = 'sq-msg ' + role;
    div.innerHTML = formatText(text);
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function formatText(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, function (url) {
        if (url.indexOf('"') !== -1) return url; // already inside an href
        return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>';
      })
      .replace(/\b(shelfspace\.pro\/[^\s<,.)]+)/g, function (m, path) {
        if (m.indexOf('"') !== -1) return m;
        return '<a href="https://' + path + '">' + path + '</a>';
      })
      .replace(/\n/g, '<br>');
  }

  function showLoading() {
    var div = document.createElement('div');
    div.className = 'sq-loading';
    div.id = 'sqLoading';
    div.innerHTML = '<div class="sq-dot"></div><div class="sq-dot"></div><div class="sq-dot"></div>';
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function hideLoading() {
    var el = document.getElementById('sqLoading');
    if (el) el.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // --- Cap UI ---
  function showCap() {
    inputBar.style.display = 'none';
    var cap = document.createElement('div');
    cap.className = 'sq-cap';
    cap.innerHTML = 'You\'ve reached the message limit for this session.<br><a href="/signup">Sign up free</a> to keep exploring ShelfSpace.';
    win.appendChild(cap);
  }

  // --- Send ---
  function sendMessage(text) {
    if (isLoading || !text.trim()) return;
    if (userMsgCount >= MAX_MESSAGES) return;

    hideChips();
    var userText = text.trim();
    appendBubble('user', userText);

    messages.push({ role: 'user', content: userText });
    userMsgCount++;

    if (userMsgCount >= MAX_MESSAGES) {
      // Send this last message but show cap after response
      callAPI(true);
    } else {
      callAPI(false);
    }
  }

  function callAPI(showCapAfter) {
    isLoading = true;
    sendBtn.disabled = true;
    showLoading();

    fetch('/api/shelfiq-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideLoading();
        if (data.reply) {
          appendBubble('ai', data.reply);
          messages.push({ role: 'assistant', content: data.reply });
        } else if (data.error) {
          appendBubble('ai', 'Sorry, something went wrong. Please try again.');
        }
        if (showCapAfter) {
          showCap();
        }
      })
      .catch(function () {
        hideLoading();
        appendBubble('ai', 'Sorry, I couldn\'t connect. Please try again.');
      })
      .finally(function () {
        isLoading = false;
        sendBtn.disabled = false;
        input.focus();
      });
  }

  // --- Events ---
  sendBtn.addEventListener('click', function () {
    sendMessage(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage(input.value);
      input.value = '';
    }
  });

  function openChat() {
    win.classList.add('open');
    toggle.style.display = 'none';
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    setTimeout(function () { input.focus(); }, 100);
  }

  function closeChat() {
    win.classList.remove('open');
    toggle.style.display = '';
    try { sessionStorage.setItem(STORAGE_KEY, '0'); } catch (e) {}
  }

  toggle.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && win.classList.contains('open')) {
      closeChat();
    }
  });

  // --- Init ---
  addGreeting();
  renderChips();

  // Restore open state from sessionStorage
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      openChat();
    }
  } catch (e) {}
})();
