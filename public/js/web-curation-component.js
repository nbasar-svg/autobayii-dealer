/* ── web-curation-component.js ── AutoBayii SCRT2/MIAW Integration ── */
(function () {
  'use strict';

  /* ── Config ── */
  const CFG = {
    SCRT2_URL: 'https://trailsignup-f946388e4783be.my.salesforce-scrt.com',
    ORG_ID:    '00Dak00001EcPDEEA3',
    ESD_NAME:  'DealerSearchChannel',
    API_VER:   '62'
  };

  /* ── State ── */
  let _token = null, _convId = null, _lastEventId = null, _sseCtrl = null;

  /* ── Demo Vehicles ── */
  const DEMO = [
    { id:'d1', brand:'BMW', name:'X5 xDrive40i', category:'SUV', price:'4.250.000 ₺', year:2024, fuel:'Benzin', hp:'340 HP', img:'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600', desc:'Premium SUV segmentinin lideri. xDrive dört çeker sistemi ve güçlü motoru ile her koşulda üstün sürüş.' },
    { id:'d2', brand:'Mercedes-Benz', name:'C200 AMG', category:'Sedan', price:'3.150.000 ₺', year:2024, fuel:'Benzin', hp:'204 HP', img:'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600', desc:'Lüks sedan segmentinin yıldızı. AMG paket ile sportif görünüm ve üst düzey konfor.' },
    { id:'d3', brand:'Tesla', name:'Model Y Long Range', category:'Elektrikli', price:'2.800.000 ₺', year:2024, fuel:'Elektrik', hp:'350 HP', img:'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600', desc:'Elektrikli SUV kategorisinin en popüleri. 500km menzil ve otonom sürüş özellikleri.' },
    { id:'d4', brand:'Toyota', name:'Corolla Cross', category:'SUV', price:'1.450.000 ₺', year:2024, fuel:'Hybrid', hp:'140 HP', img:'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600', desc:'Hibrit teknolojisiyle yakıt tasarrufu. Şehir içi ve dışı kullanıma uygun kompakt SUV.' },
    { id:'d5', brand:'Audi', name:'A4 45 TFSI', category:'Sedan', price:'2.900.000 ₺', year:2024, fuel:'Benzin', hp:'265 HP', img:'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600', desc:'Quattro dört çeker sistemi ile sportif sedan. Virtual cockpit ve matrix LED farlar.' },
    { id:'d6', brand:'Ford', name:'Ranger Wildtrak', category:'Pickup', price:'1.850.000 ₺', year:2024, fuel:'Dizel', hp:'210 HP', img:'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600', desc:'Güçlü pickup segmentinin favorisi. Arazi kabiliyeti ve şehir konforu bir arada.' }
  ];

  /* ── Helpers ── */
  function $(sel) { return document.querySelector(sel); }
  function show(el) { el && el.classList.remove('hidden'); }
  function hide(el) { el && el.classList.add('hidden'); }
  /* ── SCRT2 Token ── */
  async function getToken() {
    if (_token) return _token;
    try {
      const r = await fetch(CFG.SCRT2_URL + '/iamessage/api/v2/authorization/unauthenticated/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: CFG.ORG_ID,
          esDeveloperName: CFG.ESD_NAME,
          capabilitiesVersion: CFG.API_VER,
          platform: 'web'
        })
      });
      const d = await r.json();
      _token = d.accessToken;
      return _token;
    } catch (e) { console.warn('Token failed, using demo mode', e); return null; }
  }

  /* ── Create Conversation ── */
  async function createConversation(token) {
    try {
      const r = await fetch(CFG.SCRT2_URL + '/iamessage/api/v2/conversation', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify({ esDeveloperName: CFG.ESD_NAME })
      });
      const d = await r.json();
      _convId = d.conversationId;
      return _convId;
    } catch (e) { console.warn('Conversation failed', e); return null; }
  }

  /* ── Send Message ── */
  async function sendMessage(token, convId, text) {
    try {
      await fetch(CFG.SCRT2_URL + '/iamessage/api/v2/conversation/' + convId + '/message', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify({
          message: { text: text, sequenceNumber: Date.now(), messageType: 'StaticContentMessage' },
          esDeveloperName: CFG.ESD_NAME,
          isNewMessagingSession: !_lastEventId
        })
      });
    } catch (e) { console.warn('Send failed', e); }
  }

  /* ── SSE Listener ── */
  function listenSSE(token, convId) {
    if (_sseCtrl) _sseCtrl.abort();
    _sseCtrl = new AbortController();
    const url = CFG.SCRT2_URL + '/iamessage/api/v2/conversation/' + convId + '/events' +
      '?esDeveloperName=' + CFG.ESD_NAME + (_lastEventId ? '&lastEventId=' + _lastEventId : '');
    fetch(url, {
      headers: { 'Authorization':'Bearer '+token, 'Accept':'text/event-stream' },
      signal: _sseCtrl.signal
    }).then(res => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      function read() {
        reader.read().then(({done, value}) => {
          if (done) { setTimeout(() => listenSSE(token, convId), 2000); return; }
          buffer += decoder.decode(value, {stream:true});
          const lines = buffer.split('\n');
          buffer = lines.pop();
          lines.forEach(line => {
            if (line.startsWith('data:')) {
              try {
                const evt = JSON.parse(line.slice(5));
                _lastEventId = evt.lastEventId || _lastEventId;
                handleEvent(evt);
              } catch(e) {}
            }
          });
          read();
        });
      }
      read();
    }).catch(e => { if (e.name !== 'AbortError') setTimeout(() => listenSSE(token, convId), 3000); });
  }

  /* ── Handle Event ── */
  function handleEvent(evt) {
    if (!evt.conversationEntry) return;
    const entry = evt.conversationEntry;
    if (entry.entryType === 'Message' && entry.sender && entry.sender.role === 'Agent') {
      try {
        const payload = JSON.parse(entry.entryPayload);
        const text = payload.abstractMessage && payload.abstractMessage.messageType === 'StaticContentMessage'
          ? payload.abstractMessage.staticContent.formatType === 'RichLink'
            ? payload.abstractMessage.staticContent.text
            : payload.abstractMessage.staticContent.text || payload.abstractMessage.text
          : '';
        if (text) renderEnvelope(text);
      } catch(e) { console.warn('Parse event failed', e); }
    }
  }

 /* ── Render Envelope (parse agent JSON response) ── */
  function renderEnvelope(text) {
    hide($('#agent-loading'));
    const zone = $('#curation-zone');
    try {
      const data = JSON.parse(text);
      if (data.vehicles && Array.isArray(data.vehicles)) {
        renderCards(data.vehicles);
      } else if (data.comparison) {
        renderComparison(data.comparison);
      } else {
        renderCards([data]);
      }
    } catch(e) {
      // Plain text response — show as demo
      const filtered = DEMO.filter(v =>
        text.toLowerCase().includes(v.category.toLowerCase()) ||
        text.toLowerCase().includes(v.brand.toLowerCase())
      );
      if (filtered.length > 0) renderCards(filtered);
      else renderCards(DEMO.slice(0, 3));
    }
  }

  /* ── Render Vehicle Cards ── */
  function renderCards(vehicles) {
    const zone = $('#curation-zone');
    zone.innerHTML = '<h3 class="curation-header">🚗 Sizin İçin Önerilen Araçlar</h3><div class="curation-grid"></div>';
    const grid = zone.querySelector('.curation-grid');
    vehicles.forEach(v => {
      grid.innerHTML += `
        <div class="vehicle-card" onclick="WebCuration.showDetail('${v.id || ''}')">
          <img class="vehicle-card-img" src="${v.img || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600'}" alt="${v.name}" onerror="this.src='https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600'">
          <div class="vehicle-card-body">
            <div class="vehicle-card-brand">${v.brand || ''}</div>
            <div class="vehicle-card-name">${v.name || ''}</div>
            <div class="vehicle-card-desc">${v.desc || ''}</div>
            <div class="vehicle-card-specs">
              ${v.year ? '<span class="vehicle-spec">📅 '+v.year+'</span>' : ''}
              ${v.fuel ? '<span class="vehicle-spec">⛽ '+v.fuel+'</span>' : ''}
              ${v.hp ? '<span class="vehicle-spec">🏎️ '+v.hp+'</span>' : ''}
            </div>
            <div class="vehicle-card-footer">
              <span class="vehicle-price">${v.price || ''}</span>
              <button class="vehicle-detail-btn">Detay →</button>
            </div>
          </div>
        </div>`;
    });
  }

  /* ── Render Comparison ── */
  function renderComparison(comp) {
    const zone = $('#curation-zone');
    zone.innerHTML = '<h3 class="curation-header">⚖️ Araç Karşılaştırma</h3><div class="comparison-container"></div>';
    const container = zone.querySelector('.comparison-container');
    [comp.vehicleA, comp.vehicleB].forEach(v => {
      if (!v) return;
      container.innerHTML += `
        <div class="comparison-card">
          <div class="comparison-badge">${v.brand} ${v.name}</div>
          <img class="vehicle-card-img" src="${v.img || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600'}" alt="${v.name}">
          <div class="vehicle-card-body">
            <div class="vehicle-card-specs">
              ${v.year ? '<span class="vehicle-spec">📅 '+v.year+'</span>' : ''}
              ${v.fuel ? '<span class="vehicle-spec">⛽ '+v.fuel+'</span>' : ''}
              ${v.hp ? '<span class="vehicle-spec">🏎️ '+v.hp+'</span>' : ''}
            </div>
            <div class="vehicle-price">${v.price || ''}</div>
          </div>
        </div>`;
    });
  }

  /* ── Public API ── */
  async function send(text) {
    show($('#agent-loading'));
    const token = await getToken();
    if (!token) { sendDemo(text); return; }
    if (!_convId) await createConversation(token);
    if (!_convId) { sendDemo(text); return; }
    listenSSE(token, _convId);
    await sendMessage(token, _convId, text);
  }

  function sendQuery(text) { send(text); }

  function sendDemo(query) {
    hide($('#agent-loading'));
    const q = (query || '').toLowerCase();
    let results = DEMO.filter(v =>
      v.category.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.name.toLowerCase().includes(q)
    );
    if (results.length === 0) results = DEMO;
    renderCards(results);
  }

  function showDetail(id) {
    const v = DEMO.find(d => d.id === id);
    if (!v) return;
    alert(`${v.brand} ${v.name}\n${v.desc}\nFiyat: ${v.price}\nYıl: ${v.year} | Yakıt: ${v.fuel} | ${v.hp}`);
  }

  function reset() {
    _token = null; _convId = null; _lastEventId = null;
    if (_sseCtrl) _sseCtrl.abort();
    $('#curation-zone').innerHTML = '';
  }

  /* ── Expose ── */
  window.WebCuration = { send, sendQuery, sendDemo, reset, renderEnvelope, showDetail };
})();
