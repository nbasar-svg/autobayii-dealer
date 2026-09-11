/* ── web-curation-component.js ── Otokoç SCRT2/MIAW Integration ── */
(function () {
  'use strict';

  const CFG = {
    SCRT2_URL: 'https://trailsignup-f946388e4783be.my.salesforce-scrt.com',
    ORG_ID:    '00Dak00001EcPDEEA3',
    ESD_NAME:  'DealerSearchChannel',
    API_VER:   '62'
  };

  let _token = null, _convId = null, _lastEventId = null, _sseCtrl = null;
  const FALLBACK_IMG = 'img/cars/car-1.jpg';
  const DEMO = (window.OtokocInventory && window.OtokocInventory.length)
    ? window.OtokocInventory
    : [];

  function $(sel) { return document.querySelector(sel); }
  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

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
        reader.read().then(function (result) {
          if (result.done) { setTimeout(function () { listenSSE(token, convId); }, 2000); return; }
          buffer += decoder.decode(result.value, {stream:true});
          const lines = buffer.split('\n');
          buffer = lines.pop();
          lines.forEach(function (line) {
            if (line.indexOf('data:') === 0) {
              try {
                const evt = JSON.parse(line.slice(5));
                _lastEventId = evt.lastEventId || _lastEventId;
                handleEvent(evt);
              } catch (e) {}
            }
          });
          read();
        });
      }
      read();
    }).catch(function (e) {
      if (e.name !== 'AbortError') setTimeout(function () { listenSSE(token, convId); }, 3000);
    });
  }

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
      } catch (e) { console.warn('Parse event failed', e); }
    }
  }

  function renderEnvelope(text) {
    hide($('#agent-loading'));
    try {
      const data = JSON.parse(text);
      if (data.vehicles && Array.isArray(data.vehicles)) {
        renderCards(data.vehicles);
      } else if (data.comparison) {
        renderComparison(data.comparison);
      } else {
        renderCards([data]);
      }
    } catch (e) {
      const q = text.toLowerCase();
      const filtered = DEMO.filter(function (v) {
        return q.indexOf(v.category.toLowerCase()) !== -1 || q.indexOf(v.brand.toLowerCase()) !== -1;
      });
      renderCards(filtered.length ? filtered : DEMO.slice(0, 6));
    }
  }

  function spec(label) {
    return el('span', 'vehicle-spec', label);
  }

  function renderCards(vehicles) {
    const zone = $('#curation-zone');
    if (!zone) return;
    zone.replaceChildren();
    zone.appendChild(el('h3', 'curation-header', 'Sizin İçin Önerilen Araçlar'));
    const grid = el('div', 'curation-grid');
    vehicles.forEach(function (v) {
      const card = el('div', 'vehicle-card');
      card.addEventListener('click', function () { showDetail(v.id || ''); });
      const img = document.createElement('img');
      img.className = 'vehicle-card-img';
      img.src = v.img || FALLBACK_IMG;
      img.alt = v.name || '';
      img.addEventListener('error', function () { img.src = FALLBACK_IMG; });
      const body = el('div', 'vehicle-card-body');
      body.appendChild(el('div', 'vehicle-card-brand', v.brand || ''));
      body.appendChild(el('div', 'vehicle-card-name', v.name || ''));
      body.appendChild(el('div', 'vehicle-card-desc', v.desc || ''));
      const specs = el('div', 'vehicle-card-specs');
      if (v.year) specs.appendChild(spec(String(v.year)));
      if (v.fuel) specs.appendChild(spec(v.fuel));
      if (v.hp) specs.appendChild(spec(v.hp));
      body.appendChild(specs);
      const footer = el('div', 'vehicle-card-footer');
      footer.appendChild(el('span', 'vehicle-price', v.price || ''));
      footer.appendChild(el('button', 'vehicle-detail-btn', 'Detay'));
      body.appendChild(footer);
      card.appendChild(img);
      card.appendChild(body);
      grid.appendChild(card);
    });
    zone.appendChild(grid);
  }

  function renderComparison(comp) {
    const zone = $('#curation-zone');
    if (!zone) return;
    zone.replaceChildren();
    zone.appendChild(el('h3', 'curation-header', 'Araç Karşılaştırma'));
    const container = el('div', 'comparison-container');
    [comp.vehicleA, comp.vehicleB].forEach(function (v) {
      if (!v) return;
      const card = el('div', 'comparison-card');
      card.appendChild(el('div', 'comparison-badge', (v.brand || '') + ' ' + (v.name || '')));
      const img = document.createElement('img');
      img.className = 'vehicle-card-img';
      img.src = v.img || FALLBACK_IMG;
      img.alt = v.name || '';
      card.appendChild(img);
      const body = el('div', 'vehicle-card-body');
      const specs = el('div', 'vehicle-card-specs');
      if (v.year) specs.appendChild(spec(String(v.year)));
      if (v.fuel) specs.appendChild(spec(v.fuel));
      if (v.hp) specs.appendChild(spec(v.hp));
      body.appendChild(specs);
      body.appendChild(el('div', 'vehicle-price', v.price || ''));
      card.appendChild(body);
      container.appendChild(card);
    });
    zone.appendChild(container);
  }

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
    var results = DEMO.filter(function (v) {
      return (v.category || '').toLowerCase().indexOf(q) !== -1 ||
        (v.brand || '').toLowerCase().indexOf(q) !== -1 ||
        (v.name || '').toLowerCase().indexOf(q) !== -1 ||
        (v.fuel || '').toLowerCase().indexOf(q) !== -1;
    });
    if (!results.length) results = DEMO;
    renderCards(results);
  }

  function showDetail(id) {
    const v = DEMO.find(function (d) { return d.id === id; });
    if (!v) return;
    window.alert(v.brand + ' ' + v.name + '\n' + (v.desc || '') + '\nFiyat: ' + v.price + '\nYıl: ' + v.year + ' | Yakıt: ' + v.fuel + ' | ' + v.hp);
  }

  function reset() {
    _token = null; _convId = null; _lastEventId = null;
    if (_sseCtrl) _sseCtrl.abort();
    const zone = $('#curation-zone');
    if (zone) zone.replaceChildren();
  }

  window.WebCuration = { send: send, sendQuery: sendQuery, sendDemo: sendDemo, reset: reset, renderEnvelope: renderEnvelope, showDetail: showDetail };
})();
