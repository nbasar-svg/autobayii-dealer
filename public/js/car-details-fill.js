(function () {
  'use strict';
  var list = window.OtokocInventory || [];
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id') || 'j1';
  var v = list.filter(function (x) { return x.id === id; })[0] || list[0];
  if (!v) return;

  function setText(sel, text) {
    var n = document.querySelector(sel);
    if (n) n.textContent = text;
  }

  var title = ((v.brand || '') + ' ' + (v.name || '')).trim();
  setText('.breadcrumb__text h2', title);
  setText('.breadcrumb__links span', v.category || 'Otokoç');

  var big = document.querySelector('.car-big-img');
  if (big) {
    big.src = v.img;
    big.alt = title;
  }
  document.querySelectorAll('.car-thumbs-track img').forEach(function (img) {
    img.src = v.img;
    img.alt = title;
  });
  document.querySelectorAll('.ct').forEach(function (ct) {
    ct.setAttribute('data-imgbigurl', v.img);
  });

  var overview = document.querySelector('#tabs-1 .car__details__tab__info__item ul');
  if (overview) {
    overview.replaceChildren();
    [v.desc, v.year + ' model', v.fuel + ' · ' + v.hp, v.km + ' · ' + v.category, 'Otokoç yetkili satıcı, servis ve yedek parça'].forEach(function (line) {
      var li = document.createElement('li');
      var i = document.createElement('i');
      i.className = 'fa fa-check';
      li.appendChild(i);
      li.appendChild(document.createTextNode(' ' + line));
      overview.appendChild(li);
    });
  }

  var stocks = document.querySelectorAll('.car__details__sidebar__model li span');
  if (stocks[0]) stocks[0].textContent = 'OTO-' + (v.id || '').toUpperCase();
  if (stocks[1]) stocks[1].textContent = 'TR' + (v.year || '') + (v.id || '').toUpperCase() + 'KOÇ';

  var pays = document.querySelectorAll('.car__details__sidebar__payment li span');
  if (pays[0]) pays[0].textContent = v.price;
  if (pays[1]) pays[1].textContent = 'Otokoç kampanya';
  if (pays[2]) pays[2].textContent = v.price;

  var note = document.querySelector('.car__details__sidebar__model p');
  if (note) note.textContent = v.year + ' · ' + v.fuel + ' · ' + v.hp;
})();
