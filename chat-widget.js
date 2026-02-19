(function() {
  const CONFIG = {
    apiUrl: '/api/intake',
    website: 'autorepair',
    brandName: 'Auto Repair Mobile Mechanic',
    brandColor: '#059669',
    brandColorLight: '#10b981',
    proactiveMessage: "Hey! 👋 This is Sarah. I can get your request saved right now. I just need your name, phone, address, and what issue you need help with.",
    avatarUrl: 'images/sarah-avatar.jpg',
    proactiveDelay: 30000,
  };

  let sessionId = localStorage.getItem('chat_session_' + CONFIG.website) || null;
  let isOpen = false;
  let hasProactiveShown = false;
  let unreadCount = 0;
  let messages = [];
  const INTAKE_KEY = 'chat_intake_' + CONFIG.website;
  let intake = loadIntake();

  function loadIntake() {
    try {
      const raw = localStorage.getItem(INTAKE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { step: 'name', data: { name: '', phone: '', address: '', issue: '' }, completed: false };
  }

  function saveIntake() {
    localStorage.setItem(INTAKE_KEY, JSON.stringify(intake));
  }

  // --- Styles ---
  const style = document.createElement('style');
  style.textContent = `
    #cw-container * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #cw-bubble {
      position: fixed; bottom: 24px; right: 24px; width: 64px; height: 64px;
      background: ${CONFIG.brandColor}; border-radius: 50%; cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,0,0,0.25); display: flex; align-items: center;
      justify-content: center; z-index: 99999; transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    #cw-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(0,0,0,0.35); }
    #cw-bubble svg { width: 30px; height: 30px; fill: white; }
    #cw-badge {
      position: absolute; top: -4px; right: -4px; background: #ef4444; color: white;
      font-size: 12px; font-weight: 700; width: 22px; height: 22px; border-radius: 50%;
      display: none; align-items: center; justify-content: center; border: 2px solid white;
    }
    #cw-window {
      position: fixed; bottom: 100px; right: 24px; width: 380px; max-height: 520px;
      background: white; border-radius: 16px; box-shadow: 0 12px 48px rgba(0,0,0,0.2);
      z-index: 99999; display: flex; flex-direction: column; overflow: hidden;
      transform: scale(0) translateY(20px); opacity: 0; transform-origin: bottom right;
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
    }
    #cw-window.open { transform: scale(1) translateY(0); opacity: 1; }
    #cw-header {
      background: linear-gradient(135deg, ${CONFIG.brandColor}, ${CONFIG.brandColorLight});
      color: white; padding: 16px 20px; display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    #cw-header-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.4); }
    #cw-header-info h3 { font-size: 15px; font-weight: 600; }
    #cw-header-info span { font-size: 12px; opacity: 0.85; display: flex; align-items: center; gap: 4px; }
    #cw-header-info span::before { content: ''; width: 7px; height: 7px; background: #4ade80; border-radius: 50%; display: inline-block; }
    #cw-close { margin-left: auto; background: none; border: none; color: white; cursor: pointer; font-size: 22px; opacity: 0.8; transition: opacity 0.2s; padding: 4px; }
    #cw-close:hover { opacity: 1; }
    #cw-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
      min-height: 280px; max-height: 340px; background: #f8fafc;
    }
    .cw-msg { display: flex; gap: 8px; max-width: 85%; animation: cwFadeIn 0.3s ease; }
    .cw-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .cw-msg-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px; }
    .cw-msg-bubble {
      padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.45;
      word-wrap: break-word; white-space: pre-wrap;
    }
    .cw-msg.assistant .cw-msg-bubble { background: white; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
    .cw-msg.user .cw-msg-bubble { background: ${CONFIG.brandColor}; color: white; border-bottom-right-radius: 4px; }
    .cw-typing { display: flex; gap: 8px; align-items: center; padding: 4px 0; }
    .cw-typing-dots { display: flex; gap: 4px; background: white; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 16px; border-bottom-left-radius: 4px; }
    .cw-typing-dots span { width: 7px; height: 7px; background: #94a3b8; border-radius: 50%; animation: cwBounce 1.4s infinite; }
    .cw-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .cw-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    #cw-input-area {
      padding: 12px 16px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; background: white; flex-shrink: 0;
    }
    #cw-input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 24px; padding: 10px 16px;
      font-size: 14px; outline: none; transition: border-color 0.2s; resize: none;
      max-height: 80px; line-height: 1.4;
    }
    #cw-input:focus { border-color: ${CONFIG.brandColor}; }
    #cw-send {
      width: 40px; height: 40px; background: ${CONFIG.brandColor}; border: none; border-radius: 50%;
      cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; flex-shrink: 0;
    }
    #cw-send:hover { background: ${CONFIG.brandColorLight}; }
    #cw-send svg { width: 18px; height: 18px; fill: white; }
    #cw-powered { text-align: center; padding: 6px; font-size: 11px; color: #94a3b8; background: white; flex-shrink: 0; }
    #cw-proactive {
      position: fixed; bottom: 96px; right: 24px; background: white; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18); padding: 16px; max-width: 320px;
      z-index: 99998; display: flex; gap: 12px; align-items: flex-start;
      transform: scale(0) translateY(10px); opacity: 0; transform-origin: bottom right;
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
    }
    #cw-proactive.show { transform: scale(1) translateY(0); opacity: 1; }
    #cw-proactive img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    #cw-proactive p { font-size: 13.5px; line-height: 1.5; color: #334155; }
    #cw-proactive-close {
      position: absolute; top: 8px; right: 10px; background: none; border: none;
      color: #94a3b8; cursor: pointer; font-size: 16px;
    }
    @keyframes cwFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes cwBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
    @media (max-width: 480px) {
      #cw-window { width: calc(100vw - 16px); right: 8px; bottom: 80px; max-height: 70vh; }
      #cw-proactive { right: 8px; max-width: calc(100vw - 80px); }
      #cw-bubble { bottom: 16px; right: 16px; width: 56px; height: 56px; }
    }
    @media (prefers-color-scheme: dark) {
      #cw-window { background: #1e293b; }
      #cw-messages { background: #0f172a; }
      .cw-msg.assistant .cw-msg-bubble { background: #334155; color: #e2e8f0; border-color: #475569; }
      #cw-input-area { background: #1e293b; border-color: #334155; }
      #cw-input { background: #0f172a; border-color: #475569; color: #e2e8f0; }
      #cw-powered { background: #1e293b; color: #64748b; }
      #cw-proactive { background: #1e293b; }
      #cw-proactive p { color: #cbd5e1; }
      .cw-typing-dots { background: #334155; border-color: #475569; }
      .cw-typing-dots span { background: #64748b; }
    }
  `;
  document.head.appendChild(style);

  // --- DOM ---
  const container = document.createElement('div');
  container.id = 'cw-container';
  container.innerHTML = `
    <div id="cw-proactive">
      <img src="${CONFIG.avatarUrl}" alt="Sarah">
      <div>
        <p>${CONFIG.proactiveMessage}</p>
      </div>
      <button id="cw-proactive-close">&times;</button>
    </div>
    <div id="cw-bubble">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
      <div id="cw-badge">1</div>
    </div>
    <div id="cw-window">
      <div id="cw-header">
        <img id="cw-header-avatar" src="${CONFIG.avatarUrl}" alt="Sarah">
        <div id="cw-header-info">
          <h3>Sarah</h3>
          <span>Online now</span>
        </div>
        <button id="cw-close">&times;</button>
      </div>
      <div id="cw-messages"></div>
      <div id="cw-input-area">
        <input id="cw-input" type="text" placeholder="Type a message..." autocomplete="off">
        <button id="cw-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
      </div>
      <div id="cw-powered">Powered by ${CONFIG.brandName}</div>
    </div>
  `;
  document.body.appendChild(container);

  const bubble = document.getElementById('cw-bubble');
  const badge = document.getElementById('cw-badge');
  const win = document.getElementById('cw-window');
  const msgArea = document.getElementById('cw-messages');
  const input = document.getElementById('cw-input');
  const sendBtn = document.getElementById('cw-send');
  const closeBtn = document.getElementById('cw-close');
  const proactive = document.getElementById('cw-proactive');
  const proactiveClose = document.getElementById('cw-proactive-close');

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      win.classList.add('open');
      proactive.classList.remove('show');
      unreadCount = 0;
      badge.style.display = 'none';
      if (messages.length === 0) {
        addMessage('assistant', CONFIG.proactiveMessage);
      }
      setTimeout(() => input.focus(), 350);
    } else {
      win.classList.remove('open');
    }
  }

  function addMessage(role, text) {
    messages.push({ role, content: text });
    const div = document.createElement('div');
    div.className = 'cw-msg ' + role;
    div.innerHTML = role === 'assistant'
      ? `<img class="cw-msg-avatar" src="${CONFIG.avatarUrl}" alt="Sarah"><div class="cw-msg-bubble">${escHtml(text)}</div>`
      : `<div class="cw-msg-bubble">${escHtml(text)}</div>`;
    msgArea.appendChild(div);
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'cw-typing';
    div.id = 'cw-typing';
    div.innerHTML = `<img class="cw-msg-avatar" src="${CONFIG.avatarUrl}" alt="Sarah"><div class="cw-typing-dots"><span></span><span></span><span></span></div>`;
    msgArea.appendChild(div);
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('cw-typing');
    if (t) t.remove();
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function nextQuestion() {
    if (intake.step === 'name') return "Great — what's your full name?";
    if (intake.step === 'phone') return "Thanks. What's the best phone number to reach you?";
    if (intake.step === 'address') return "Got it. What's the service address?";
    if (intake.step === 'issue') return "Perfect. Briefly describe the vehicle issue you're having.";
    return "Thanks! I'm getting this saved now.";
  }

  function captureByStep(text) {
    if (intake.step === 'name') {
      intake.data.name = text;
      intake.step = 'phone';
      return true;
    }
    if (intake.step === 'phone') {
      intake.data.phone = text;
      intake.step = 'address';
      return true;
    }
    if (intake.step === 'address') {
      intake.data.address = text;
      intake.step = 'issue';
      return true;
    }
    if (intake.step === 'issue') {
      intake.data.issue = text;
      intake.step = 'done';
      return true;
    }
    return false;
  }

  async function submitIntake() {
    const payload = {
      website: CONFIG.website,
      session_id: sessionId,
      ...intake.data,
    };
    const res = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  }

  function serviceHelpResponse(text) {
    const msg = text.toLowerCase();
    if (msg.includes('brake')) return "Yes — we handle brake repair and replacement at your location.";
    if (msg.includes('battery') || msg.includes('electrical')) return "Yes — battery and electrical diagnostics are part of our mobile service.";
    if (msg.includes('ac') || msg.includes('a/c')) return "Yes — we do mobile A/C diagnostics and repair.";
    if (msg.includes('oil')) return "Yes — we do mobile oil and fluid service.";
    return "We offer mobile diagnostics, brakes, battery/electrical, A/C, oil/fluid services, starter/alternator, suspension, and more across Fort Lauderdale and Tampa.";
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage('user', text);
    showTyping();

    try {
      let reply = '';
      if (intake.completed) {
        reply = "I've already saved your request. If you need another one, refresh the page and I can start a new intake.";
      } else {
        const askedServiceQuestion =
          /(service|repair|fix|work on|do you|can you|offer|price|quote|estimate|brake|battery|ac|oil|diagnostic)/i.test(text);

        if (askedServiceQuestion && intake.step === 'name') {
          reply = serviceHelpResponse(text) + " " + nextQuestion();
        } else {
          captureByStep(text);
          saveIntake();
          if (intake.step === 'done') {
            const data = await submitIntake();
            const ref = data && data.request_id ? ` Reference: ${data.request_id}.` : '';
            intake.completed = true;
            saveIntake();
            reply = "Perfect — I saved your request and our team will call you shortly to confirm details." + ref;
          } else {
            reply = nextQuestion();
          }
        }
      }

      sessionId = sessionId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
      localStorage.setItem('chat_session_' + CONFIG.website, sessionId);
      hideTyping();
      addMessage('assistant', reply);
      if (!isOpen) {
        unreadCount++;
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
      }
    } catch (e) {
      hideTyping();
      try {
        const backups = JSON.parse(localStorage.getItem('chat_intake_backup_' + CONFIG.website) || '[]');
        backups.push({
          saved_at: new Date().toISOString(),
          session_id: sessionId,
          ...intake.data,
        });
        localStorage.setItem('chat_intake_backup_' + CONFIG.website, JSON.stringify(backups));
      } catch (_) {}
      addMessage('assistant', "I couldn't reach intake storage right now, but I saved your request locally in this browser. Please call (954) 204-0658 and mention website chat just in case.");
    }
  }

  // Events
  bubble.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  proactiveClose.addEventListener('click', (e) => { e.stopPropagation(); proactive.classList.remove('show'); });
  proactive.addEventListener('click', () => { proactive.classList.remove('show'); toggleChat(); });

  // Proactive popup after delay
  setTimeout(() => {
    if (!isOpen && !hasProactiveShown) {
      hasProactiveShown = true;
      proactive.classList.add('show');
      unreadCount = 1;
      badge.textContent = '1';
      badge.style.display = 'flex';
    }
  }, CONFIG.proactiveDelay);
})();
