(function () {
  'use strict';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function destroyWidgets(grid) {
    if (window.jQuery) {
      jQuery(grid).find('.owl-carousel').each(function () {
        var $el = jQuery(this);
        if ($el.data('owl.carousel')) $el.trigger('destroy.owl.carousel');
      });
    }
    try {
      if (window.mixitup) {
        var mixer = mixitup(grid);
        if (mixer && mixer.destroy) mixer.destroy(false);
      }
    } catch (_) {}
  }

  function initOwl(grid) {
    if (!window.jQuery || !jQuery.fn.owlCarousel) return;
    jQuery(grid).find('.js-inventory-slider').owlCarousel({
      loop: true,
      margin: 0,
      items: 1,
      dots: true,
      smartSpeed: 1200,
      autoHeight: false,
      autoplay: false
    });
  }

  function cardCol(v, colClass) {
    var catSlug = (v.category || 'sale').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var col = el('div', colClass + ' ' + catSlug);
    col.setAttribute('data-brand', v.brand || '');
    col.setAttribute('data-category', v.category || '');
    col.setAttribute('data-fuel', v.fuel || '');

    var item = el('div', 'car__item');
    item.setAttribute('data-vehicle-id', v.id || '');

    var slider = el('div', 'car__item__pic__slider owl-carousel js-inventory-slider');
    var img = document.createElement('img');
    img.src = v.img || 'img/cars/car-1.jpg';
    img.alt = ((v.brand || '') + ' ' + (v.name || '')).trim();
    slider.appendChild(img);

    var textWrap = el('div', 'car__item__text');
    var inner = el('div', 'car__item__text__inner');
    inner.appendChild(el('div', 'label-date', v.year ? String(v.year) : ''));

    var h5 = document.createElement('h5');
    var link = document.createElement('a');
    link.href = 'car-details.html?id=' + encodeURIComponent(v.id || '');
    link.textContent = ((v.brand || '') + ' ' + (v.name || '')).trim();
    h5.appendChild(link);
    inner.appendChild(h5);

    var ul = document.createElement('ul');
    var liKm = document.createElement('li');
    var kmSpan = document.createElement('span');
    kmSpan.textContent = v.km || '';
    liKm.appendChild(kmSpan);
    ul.appendChild(liKm);
    ul.appendChild(el('li', '', v.fuel || ''));
    var liHp = document.createElement('li');
    var hpSpan = document.createElement('span');
    hpSpan.textContent = v.hp || '';
    liHp.appendChild(hpSpan);
    ul.appendChild(liHp);
    inner.appendChild(ul);

    var price = el('div', 'car__item__price');
    price.appendChild(el('span', 'car-option sale', v.category || 'Otokoç'));
    price.appendChild(el('h6', '', v.price || ''));

    textWrap.appendChild(inner);
    textWrap.appendChild(price);
    item.appendChild(slider);
    item.appendChild(textWrap);
    col.appendChild(item);
    return col;
  }

  function updateHero(vehicle) {
    if (!vehicle) return;
    var kicker = document.getElementById('hero-kicker');
    var name = document.getElementById('hero-vehicle-name');
    var model = document.getElementById('hero-vehicle-model');
    var price = document.getElementById('hero-vehicle-price');
    var hero = document.querySelector('.hero.set-bg');
    if (kicker) kicker.textContent = 'Otokoç Showroom';
    if (name) name.textContent = ((vehicle.brand || '') + ' ' + (vehicle.name || '')).trim();
    if (model) model.textContent = [vehicle.year, vehicle.fuel].filter(Boolean).join(' · ');
    if (price) {
      price.replaceChildren();
      price.appendChild(document.createTextNode(vehicle.price || ''));
    }
    if (hero && vehicle.img) {
      hero.style.backgroundImage = 'url(' + vehicle.img + ')';
    }
  }

  function updateSectionTitle(title, kicker) {
    var h2 = document.getElementById('vehicle-section-title');
    var span = document.getElementById('vehicle-section-kicker');
    if (h2 && title) h2.textContent = title;
    if (span) span.textContent = kicker || 'Otokoç Envanter';
  }

  function render(vehicles, opts) {
    var grid = document.getElementById('vehicle-grid');
    if (!grid) return;
    opts = opts || {};
    var colClass = grid.getAttribute('data-col-class') || 'col-lg-3 col-md-4 col-sm-6 mix sale';
    if (!opts.skipDestroy) destroyWidgets(grid);
    grid.replaceChildren();
    (vehicles || []).forEach(function (v) {
      grid.appendChild(cardCol(v, colClass));
    });
    grid.classList.remove('is-adapting');
    void grid.offsetWidth;
    grid.classList.add('is-adapting');
    initOwl(grid);
    if (opts.title) updateSectionTitle(opts.title, opts.kicker || 'Otokoç Envanter');
    if (opts.adaptHero !== false && vehicles && vehicles[0]) updateHero(vehicles[0]);
    var filters = document.querySelector('.car.spad .filter__controls');
    if (filters) filters.style.display = opts.hideFilters ? 'none' : '';
  }

  window.OtokocGrid = { render: render };

  var grid = document.getElementById('vehicle-grid');
  if (grid && grid.querySelector('.car__item')) {
    initOwl(grid);
  } else if (grid && window.OtokocInventory && window.OtokocInventory.length) {
    render(window.OtokocInventory, { skipDestroy: true, title: 'Satılık Araçlar', kicker: 'Otokoç Envanter', adaptHero: true });
  }
})();
