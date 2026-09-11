(function () {
  'use strict';
  var grid = document.getElementById('vehicle-grid');
  var list = window.OtokocInventory;
  if (!grid || !list || !list.length) return;

  var colClass = grid.getAttribute('data-col-class') || 'col-lg-3 col-md-4 col-sm-6 mix sale';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  list.forEach(function (v) {
    var col = el('div', colClass);
    col.setAttribute('data-brand', v.brand);
    col.setAttribute('data-category', v.category);
    col.setAttribute('data-fuel', v.fuel);

    var item = el('div', 'car__item');
    item.setAttribute('data-vehicle-id', v.id);

    var slider = el('div', 'car__item__pic__slider owl-carousel js-inventory-slider');
    var img = document.createElement('img');
    img.src = v.img;
    img.alt = v.brand + ' ' + v.name;
    slider.appendChild(img);

    var textWrap = el('div', 'car__item__text');
    var inner = el('div', 'car__item__text__inner');
    inner.appendChild(el('div', 'label-date', String(v.year)));

    var h5 = document.createElement('h5');
    var link = document.createElement('a');
    link.href = 'car-details.html';
    link.textContent = v.brand + ' ' + v.name;
    h5.appendChild(link);
    inner.appendChild(h5);

    var ul = document.createElement('ul');
    var liKm = document.createElement('li');
    var kmSpan = document.createElement('span');
    kmSpan.textContent = v.km || '';
    liKm.appendChild(kmSpan);
    ul.appendChild(liKm);
    ul.appendChild(el('li', '', v.fuel));
    var liHp = document.createElement('li');
    var hpSpan = document.createElement('span');
    hpSpan.textContent = v.hp;
    liHp.appendChild(hpSpan);
    ul.appendChild(liHp);
    inner.appendChild(ul);

    var price = el('div', 'car__item__price');
    price.appendChild(el('span', 'car-option sale', v.category));
    price.appendChild(el('h6', '', v.price));

    textWrap.appendChild(inner);
    textWrap.appendChild(price);
    item.appendChild(slider);
    item.appendChild(textWrap);
    col.appendChild(item);
    grid.appendChild(col);
  });

  if (window.jQuery && jQuery.fn.owlCarousel) {
    jQuery('#vehicle-grid .js-inventory-slider').owlCarousel({
      loop: true,
      margin: 0,
      items: 1,
      dots: true,
      smartSpeed: 1200,
      autoHeight: false,
      autoplay: false
    });
  }
})();
