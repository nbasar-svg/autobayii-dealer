/* ── web-curation-component.js ── Otokoç MIAW / Agentforce ── */
(function () {
  'use strict';

  const CFG = {
    SCRT2_URL: 'https://trailsignup-f946388e4783be.my.salesforce-scrt.com',
    ORG_ID:    '00Dak00001EcPDE',
    ESD_NAME:  'DealerSearchChannel',
    CAPABILITIES_VERSION: '1',
    PLATFORM:  'Web'
  };

  const FALLBACK_IMG = 'img/cars/car-1.jpg';
  const DEMO = (window.OtokocInventory && window.OtokocInventory.length)
    ? window.OtokocInventory
    : [];

  let _token = null;
  let _convId = null;
  let _eventSource = null;
  let _connecting = null;
  let _status = 'disconnected';

  function $(sel) { return document.querySelector(sel); }
  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function setConnectionStatus(status) {
    _status = status;
    document.querySelectorAll('.agent-status-dot, .agent-fab-dot').forEach(function (dot) {
      dot.className = dot.className.replace(/\bstatus-\w+/g, '').trim() + ' status-' + status;
    });
  }

  function mountPanel() {
    if ($('#otokoc-agent-panel')) return;
    var panel = el('aside', 'otokoc-agent-panel');
    panel.id = 'otokoc-agent-panel';

    var fab = el('button', 'agent-fab', null);
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Otokoç asistanını aç');
    var fabDot = el('span', 'agent-fab-dot status-disconnected');
    fab.appendChild(fabDot);
    fab.appendChild(document.createTextNode('Otokoç Asistan'));
    fab.addEventListener('click', expandPanel);

    var win = el('div', 'agent-window');
    var header = el('div', 'agent-window-header');
    header.appendChild(el('span', 'agent-status-dot status-disconnected'));
    var titles = document.createElement('div');
    titles.style.flex = '1';
    var h3 = el('h3', null, 'Otokoç Asistan');
    var sub = document.createElement('small');
    sub.textContent = 'Agentforce ile araç bulun';
    titles.appendChild(h3);
    titles.appendChild(sub);
    header.appendChild(titles);
    var close = el('button', 'agent-close-btn', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Küçült');
    close.addEventListener('click', collapsePanel);
    header.appendChild(close);

    var body = el('div', 'agent-panel-body');
    body.id = 'agent-panel-body';

    var bar = el('div', 'agent-chat-bar');
    var input = document.createElement('input');
    input.id = 'agent-chat-field';
    input.type = 'text';
    input.placeholder = 'Puma, Egea, Ford yazın…';
    input.autocomplete = 'off';
    var sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.setAttribute('aria-label', 'Gönder');
    sendBtn.textContent = '➤';
    function handleSend() {
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      send(text);
    }
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
    });
    bar.appendChild(input);
    bar.appendChild(sendBtn);

    win.appendChild(header);
    win.appendChild(body);
    win.appendChild(bar);
    panel.appendChild(fab);
    panel.appendChild(win);
    panel.classList.add('collapsed');
    document.body.appendChild(panel);
    showWelcome();
  }

  function expandPanel() {
    var panel = $('#otokoc-agent-panel');
    if (panel) panel.classList.remove('collapsed');
    setTimeout(function () {
      var field = $('#agent-chat-field');
      if (field) field.focus();
    }, 50);
  }

  function collapsePanel() {
    var panel = $('#otokoc-agent-panel');
    if (panel) panel.classList.add('collapsed');
  }

  function panelBody() {
    return $('#agent-panel-body');
  }

  function appendBubble(text, who) {
    var body = panelBody();
    if (!body || !text) return;
    body.appendChild(el('div', 'agent-bubble ' + (who || 'agent'), text));
    body.scrollTop = body.scrollHeight;
  }

  function setPanelLoading(on) {
    hide($('#agent-loading'));
    var body = panelBody();
    if (!body) return;
    var existing = body.querySelector('.agent-panel-loading');
    if (existing) existing.remove();
    if (!on) return;
    var row = el('div', 'agent-panel-loading');
    row.appendChild(el('div', 'spinner'));
    row.appendChild(el('span', null, 'Asistan bakıyor…'));
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  }

  function showWelcome() {
    var body = panelBody();
    if (!body) return;
    body.replaceChildren();
    appendBubble('Merhaba, ben Otokoç Asistan. SUV, hibrit veya marka yazın; size uygun araçları getireyim.', 'agent');
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function miawFetch(url, method, body, token) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var opts = { method: method, mode: 'cors', headers: headers };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (text) {
          console.error('[MIAW] API error', res.status, text);
          throw new Error('MIAW API error: ' + res.status);
        });
      }
      var ct = res.headers.get('content-type') || '';
      if (res.status === 204 || !ct) return {};
      if (ct.indexOf('json') === -1) return res.text();
      return res.json();
    });
  }

  function getToken() {
    if (_token) return Promise.resolve(_token);
    return miawFetch(CFG.SCRT2_URL + '/iamessage/api/v2/authorization/unauthenticated/access-token', 'POST', {
      orgId: CFG.ORG_ID,
      esDeveloperName: CFG.ESD_NAME,
      capabilitiesVersion: CFG.CAPABILITIES_VERSION,
      platform: CFG.PLATFORM
    }).then(function (data) {
      if (!data || !data.accessToken) throw new Error('No access token');
      _token = data.accessToken;
      console.log('[MIAW] Access token received');
      return _token;
    });
  }

  function createConversation(token) {
    if (_convId) return Promise.resolve(_convId);
    var conversationId = uuid();
    return miawFetch(CFG.SCRT2_URL + '/iamessage/api/v2/conversation', 'POST', {
      conversationId: conversationId,
      esDeveloperName: CFG.ESD_NAME
    }, token).then(function () {
      _convId = conversationId;
      console.log('[MIAW] Conversation created', conversationId);
      return conversationId;
    });
  }

  function subscribeSSE(token) {
    if (_eventSource) {
      try { _eventSource.close(); } catch (_) {}
      _eventSource = null;
    }
    var EventSourceImpl = window.EventSourcePolyfill || window.EventSource;
    if (!EventSourceImpl) {
      console.error('[MIAW] No EventSource implementation');
      return;
    }
    var sseUrl = CFG.SCRT2_URL + '/eventrouter/v1/sse';
    var params = {
      headers: {
        Authorization: 'Bearer ' + token,
        'X-Org-ID': CFG.ORG_ID
      },
      heartbeatTimeout: 90000
    };
    if (window.EventSourcePolyfill) {
      _eventSource = new EventSourceImpl(sseUrl, params);
    } else {
      sseUrl += '?Authorization=' + encodeURIComponent('Bearer ' + token) +
        '&X-Org-ID=' + encodeURIComponent(CFG.ORG_ID);
      _eventSource = new EventSourceImpl(sseUrl);
    }
    _eventSource.onopen = function () {
      console.log('[MIAW] SSE connected');
      setConnectionStatus('connected');
    };
    _eventSource.onerror = function (err) {
      console.warn('[MIAW] SSE error', err);
      setConnectionStatus('error');
    };
    _eventSource.addEventListener('CONVERSATION_MESSAGE', function (event) {
      try {
        handleAgentMessage(JSON.parse(event.data));
      } catch (e) {
        console.error('[MIAW] SSE parse failed', e);
      }
    });
  }

  function handleAgentMessage(data) {
    var conversationEntry = data && data.conversationEntry;
    if (!conversationEntry) return;
    var sender = conversationEntry.sender || {};
    if (sender.role === 'EndUser') return;
    if (conversationEntry.entryType && conversationEntry.entryType !== 'Message') return;

    var entryPayload = conversationEntry.entryPayload;
    if (typeof entryPayload === 'string') {
      try { entryPayload = JSON.parse(entryPayload); } catch (_) { return; }
    }
    var payloadSender = entryPayload && entryPayload.sender;
    if (payloadSender && payloadSender.role === 'EndUser') return;

    var msg = entryPayload && entryPayload.abstractMessage;
    var text = msg && msg.staticContent && msg.staticContent.text;
    if (!text) return;
    console.log('[MIAW] Agent text', text);
    renderEnvelope(text);
  }

  function extractJson(text) {
    if (!text) return null;
    var trimmed = String(text).trim();
    try { return JSON.parse(trimmed); } catch (_) {}
    var fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) {
      try { return JSON.parse(fence[1].trim()); } catch (_) {}
    }
    var start = trimmed.indexOf('{');
    var end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(trimmed.slice(start, end + 1)); } catch (_) {}
    }
    return null;
  }

  function itemToVehicle(item) {
    if (!item) return null;
    var name = item.ProductName || item.name || '';
    var brand = item.ProductBrand || item.brand || '';
    var local = DEMO.filter(function (v) {
      return (v.name && name && v.name.toLowerCase() === name.toLowerCase()) ||
        (v.brand && brand && v.name && name &&
          (v.brand + ' ' + v.name).toLowerCase() === (brand + ' ' + name).toLowerCase());
    })[0];
    var hp = item.Horsepower != null && item.Horsepower !== ''
      ? String(item.Horsepower) + ' HP'
      : (local && local.hp) || '';
    return {
      id: item.id || (local && local.id) || name,
      name: name,
      brand: brand,
      desc: item.ProductDescription || item.desc || (local && local.desc) || '',
      category: item.ProductCategory || item.ProductFamily || (local && local.category) || '',
      img: item.ImageURL || (local && local.img) || FALLBACK_IMG,
      price: item.Price || item.price || (local && local.price) || '',
      year: item.Year || (local && local.year) || '',
      fuel: item.Fuel || (local && local.fuel) || '',
      hp: hp
    };
  }

  function vehiclesFromEnvelope(data) {
    if (!data) return [];
    if (Array.isArray(data.vehicles)) return data.vehicles;
    if (Array.isArray(data.curation)) {
      var out = [];
      data.curation.forEach(function (item) {
        if (item && item.template === 'productComparison' && Array.isArray(item.products)) {
          item.products.forEach(function (p) {
            var v = itemToVehicle(p);
            if (v) out.push(v);
          });
        } else {
          var mapped = itemToVehicle(item);
          if (mapped) out.push(mapped);
        }
      });
      return out;
    }
    if (data.ProductName || data.name) {
      var single = itemToVehicle(data);
      return single ? [single] : [];
    }
    return [];
  }

  function renderEnvelope(text) {
    setPanelLoading(false);
    hide($('#agent-loading'));
    var data = extractJson(text);
    if (data) {
      var header = data.text || '';
      if (header) appendBubble(header, 'agent');
      var vehicles = vehiclesFromEnvelope(data);
      if (data.curation && data.curation[0] && data.curation[0].template === 'productComparison') {
        var pair = vehiclesFromEnvelope(data);
        if (pair.length >= 2) {
          renderComparison({ vehicleA: pair[0], vehicleB: pair[1] }, header);
          renderPanelCards(pair);
          return;
        }
      }
      if (vehicles.length) {
        renderCards(vehicles, header);
        return;
      }
    }
    if (text && text.indexOf('{') === -1) {
      appendBubble(text, 'agent');
      return;
    }
    sendDemo(text);
  }

  function spec(label) {
    return el('span', 'vehicle-spec', label);
  }

  function renderPanelCards(vehicles) {
    var body = panelBody();
    if (!body || !vehicles || !vehicles.length) return;
    vehicles.forEach(function (v) {
      var card = el('div', 'agent-mini-card');
      card.addEventListener('click', function () { showDetail(v); });
      var img = document.createElement('img');
      img.src = v.img || FALLBACK_IMG;
      img.alt = v.name || '';
      img.addEventListener('error', function () { img.src = FALLBACK_IMG; });
      var info = el('div', 'agent-mini-card-body');
      info.appendChild(el('div', 'agent-mini-card-brand', v.brand || ''));
      info.appendChild(el('div', 'agent-mini-card-name', v.name || ''));
      var meta = [v.year, v.fuel, v.hp].filter(Boolean).join(' · ');
      if (meta) info.appendChild(el('div', 'agent-mini-card-meta', meta));
      if (v.price) info.appendChild(el('div', 'agent-mini-card-price', v.price));
      card.appendChild(img);
      card.appendChild(info);
      body.appendChild(card);
    });
    body.scrollTop = body.scrollHeight;
  }

  function renderCards(vehicles, headerText) {
    expandPanel();
    renderPanelCards(vehicles);
    const zone = $('#curation-zone');
    if (!zone) return;
    zone.replaceChildren();
    zone.appendChild(el('h3', 'curation-header', headerText || 'Sizin İçin Önerilen Araçlar'));
    const grid = el('div', 'curation-grid');
    vehicles.forEach(function (v) {
      const card = el('div', 'vehicle-card');
      card.addEventListener('click', function () { showDetail(v); });
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

  function renderComparison(comp, headerText) {
    expandPanel();
    const zone = $('#curation-zone');
    if (!zone) return;
    zone.replaceChildren();
    zone.appendChild(el('h3', 'curation-header', headerText || 'Araç Karşılaştırma'));
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

  function connect() {
    if (_token && _convId) return Promise.resolve(_convId);
    if (_connecting) return _connecting;
    setConnectionStatus('connecting');
    _connecting = getToken()
      .then(function (token) { return createConversation(token).then(function () { return token; }); })
      .then(function (token) {
        subscribeSSE(token);
        setConnectionStatus('connected');
        return _convId;
      })
      .catch(function (e) {
        console.warn('[MIAW] Connect failed, demo mode', e);
        _connecting = null;
        setConnectionStatus('error');
        throw e;
      });
    return _connecting;
  }

  function sendMessage(text) {
    return miawFetch(CFG.SCRT2_URL + '/iamessage/api/v2/conversation/' + _convId + '/message', 'POST', {
      message: {
        id: uuid(),
        messageType: 'StaticContentMessage',
        staticContent: { formatType: 'Text', text: text }
      },
      esDeveloperName: CFG.ESD_NAME
    }, _token);
  }

  async function send(text) {
    expandPanel();
    appendBubble(text, 'user');
    setPanelLoading(true);
    try {
      await connect();
      await sendMessage(text);
    } catch (e) {
      sendDemo(text);
    }
  }

  function sendQuery(text) { send(text); }

  function sendDemo(query) {
    setPanelLoading(false);
    hide($('#agent-loading'));
    const q = (query || '').toLowerCase();
    var results = DEMO.filter(function (v) {
      return (v.category || '').toLowerCase().indexOf(q) !== -1 ||
        (v.brand || '').toLowerCase().indexOf(q) !== -1 ||
        (v.name || '').toLowerCase().indexOf(q) !== -1 ||
        (v.fuel || '').toLowerCase().indexOf(q) !== -1;
    });
    if (!results.length) results = DEMO.slice(0, 6);
    renderCards(results);
  }

  function showDetail(vOrId) {
    var v = vOrId;
    if (typeof vOrId === 'string') {
      v = DEMO.find(function (d) { return d.id === vOrId; }) || { name: vOrId };
    }
    if (!v) return;
    window.alert((v.brand ? v.brand + ' ' : '') + (v.name || '') + '\n' + (v.desc || '') +
      (v.price ? '\nFiyat: ' + v.price : '') +
      (v.year ? '\nYıl: ' + v.year : '') +
      (v.fuel ? ' | Yakıt: ' + v.fuel : '') +
      (v.hp ? ' | ' + v.hp : ''));
  }

  function reset() {
    _token = null;
    _convId = null;
    _connecting = null;
    if (_eventSource) {
      try { _eventSource.close(); } catch (_) {}
      _eventSource = null;
    }
    const zone = $('#curation-zone');
    if (zone) zone.replaceChildren();
  }

  window.WebCuration = {
    send: send,
    sendQuery: sendQuery,
    sendDemo: sendDemo,
    reset: reset,
    renderEnvelope: renderEnvelope,
    showDetail: showDetail,
    connect: connect,
    expand: expandPanel,
    collapse: collapsePanel,
    showWelcome: showWelcome
  };

  document.addEventListener('DOMContentLoaded', function () {
    mountPanel();
  });
})();
