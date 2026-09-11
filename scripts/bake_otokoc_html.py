#!/usr/bin/env python3
"""Bake Otokoç vehicle HTML so Qualified can crawl names, prices, and specs."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
INV = PUBLIC / "js" / "vehicle-inventory.js"

def load_inventory():
    text = INV.read_text()
    start = text.index("[")
    end = text.rindex("]") + 1
    raw = text[start:end]
    raw = re.sub(r"(\w+):", r'"\1":', raw)
    raw = raw.replace("'", '"')
    return json.loads(raw)

def slug(v):
    s = f"{v['brand']}-{v['name']}".lower()
    s = s.replace("mercedes-benz", "mercedes")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def cat_class(v):
    return re.sub(r"[^a-z0-9]+", "-", v["category"].lower())

def card(v, col, img_prefix=""):
    href = f"arac/{slug(v)}.html"
    img = img_prefix + v["img"]
    title = f"{v['brand']} {v['name']}"
    return f'''                <article class="{col} mix sale {cat_class(v)}" itemscope itemtype="https://schema.org/Car">
                    <div class="car__item">
                        <div class="car__item__pic__slider owl-carousel js-inventory-slider">
                            <img src="{img}" alt="{title}" itemprop="image">
                        </div>
                        <div class="car__item__text">
                            <div class="car__item__text__inner">
                                <div class="label-date">{v["year"]}</div>
                                <h5><a href="{href}" itemprop="url"><span itemprop="brand">{v["brand"]}</span> <span itemprop="name">{v["name"]}</span></a></h5>
                                <p itemprop="description">{v["desc"]}</p>
                                <ul>
                                    <li><span>{v["km"]}</span></li>
                                    <li itemprop="fuelType">{v["fuel"]}</li>
                                    <li><span>{v["hp"]}</span></li>
                                </ul>
                            </div>
                            <div class="car__item__price">
                                <span class="car-option sale">{v["category"]}</span>
                                <h6 itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="price">{v["price"]}</span><meta itemprop="priceCurrency" content="TRY"></h6>
                            </div>
                        </div>
                    </div>
                </article>
'''

def detail_page(v, all_v):
    title = f"{v['brand']} {v['name']}"
    img = f"../{v['img']}"
    related = [x for x in all_v if x["id"] != v["id"] and x["category"] == v["category"]][:3]
    if len(related) < 3:
        related = [x for x in all_v if x["id"] != v["id"]][:3]
    rel_html = "\n".join(
        f'          <li><a href="{slug(x)}.html">{x["brand"]} {x["name"]} — {x["price"]}</a></li>'
        for x in related
    )
    ld = {
        "@context": "https://schema.org",
        "@type": "Car",
        "name": title,
        "brand": v["brand"],
        "model": v["name"],
        "vehicleModelDate": v["year"],
        "fuelType": v["fuel"],
        "mileageFromOdometer": v["km"],
        "description": v["desc"],
        "image": f"https://otokoc-adaptive.onrender.com/{v['img']}",
        "offers": {
            "@type": "Offer",
            "price": re.sub(r"[^0-9]", "", v["price"]),
            "priceCurrency": "TRY",
            "availability": "https://schema.org/InStock",
            "seller": {"@type": "AutoDealer", "name": "Otokoç"},
        },
    }
    return f'''<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} {v["year"]} | Otokoç {v["category"]} | {v["price"]}</title>
    <meta name="description" content="{title}, {v["year"]}, {v["fuel"]}, {v["hp"]}, {v["km"]}. Fiyat {v["price"]}. {v["desc"]}">
    <meta name="keywords" content="Otokoç, {v["brand"]}, {v["name"]}, {v["category"]}, {v["fuel"]}, satılık araç">
    <link rel="stylesheet" href="../css/bootstrap.min.css" type="text/css">
    <link rel="stylesheet" href="../css/font-awesome.min.css" type="text/css">
    <link rel="stylesheet" href="../css/style.css" type="text/css">
    <link rel="stylesheet" href="../css/curation-overlay.css" type="text/css">
    <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <a href="../index.html" class="brand-logo">Oto<span>koç</span></a>
                    <nav class="header__menu" style="display:inline-block;margin-left:24px">
                        <ul>
                            <li><a href="../index.html">Ana Sayfa</a></li>
                            <li class="active"><a href="../car.html">Araçlar</a></li>
                            <li><a href="../contact.html">İletişim</a></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </header>

    <article class="car-details spad" itemscope itemtype="https://schema.org/Car">
        <div class="container">
            <p><a href="../index.html">Otokoç</a> / <a href="../car.html">Satılık Araçlar</a> / <span itemprop="name">{title}</span></p>
            <h1>{title}</h1>
            <p><strong itemprop="brand">{v["brand"]}</strong> · {v["category"]} · Stok OTO-{v["id"].upper()}</p>
            <img src="{img}" alt="{title}" itemprop="image" style="max-width:100%;height:auto;border-radius:12px;margin:16px 0">
            <p itemprop="description">{v["desc"]}</p>
            <ul>
                <li>Model yılı: <span itemprop="vehicleModelDate">{v["year"]}</span></li>
                <li>Yakıt: <span itemprop="fuelType">{v["fuel"]}</span></li>
                <li>Motor: {v["hp"]}</li>
                <li>Kilometre: {v["km"]}</li>
                <li>Kategori: {v["category"]}</li>
                <li itemprop="offers" itemscope itemtype="https://schema.org/Offer">Fiyat: <strong itemprop="price">{v["price"]}</strong><meta itemprop="priceCurrency" content="TRY"></li>
            </ul>
            <p>Bu araç Otokoç yetkili satıcısında satılıktır. Test sürüşü ve finansman için 0850 123 45 67 veya info@otokoc.com.tr.</p>
            <p><a class="primary-btn" href="../contact.html">İletişime geç</a></p>
            <h2>Benzer Otokoç araçları</h2>
            <ul>
{rel_html}
            </ul>
        </div>
    </article>
</body>
</html>
'''

def inject_grid(path: Path, html: str, pattern: str):
    text = path.read_text()
    text2, n = re.subn(pattern, html, text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"grid inject failed for {path}: {n}")
    path.write_text(text2)

def main():
    vehicles = load_inventory()
    home_cards = "\n".join(card(v, "col-lg-3 col-md-4 col-sm-6") for v in vehicles)
    list_cards = "\n".join(card(v, "col-lg-4 col-md-4") for v in vehicles)

    inject_grid(
        PUBLIC / "index.html",
        "            <div class=\"row car-filter\" id=\"vehicle-grid\" data-content-zone=\"home_recommendations\" data-col-class=\"col-lg-3 col-md-4 col-sm-6 mix sale\">\n"
        + home_cards
        + "            </div>",
        r'<div class="row car-filter" id="vehicle-grid"[^>]*>.*?</div>',
    )
    inject_grid(
        PUBLIC / "car.html",
        "                    <div class=\"row\" id=\"vehicle-grid\" data-content-zone=\"vehicle_catalog\" data-col-class=\"col-lg-4 col-md-4 mix sale\">\n"
        + list_cards
        + "                    </div>",
        r'<div class="row" id="vehicle-grid"[^>]*>.*?</div>',
    )

    out = PUBLIC / "arac"
    out.mkdir(exist_ok=True)
    urls = [
        "https://otokoc-adaptive.onrender.com/",
        "https://otokoc-adaptive.onrender.com/car.html",
        "https://otokoc-adaptive.onrender.com/contact.html",
        "https://otokoc-adaptive.onrender.com/about.html",
    ]
    for v in vehicles:
        (out / f"{slug(v)}.html").write_text(detail_page(v, vehicles))
        urls.append(f"https://otokoc-adaptive.onrender.com/arac/{slug(v)}.html")

    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        sitemap += f"  <url><loc>{u}</loc></url>\n"
    sitemap += "</urlset>\n"
    (PUBLIC / "sitemap.xml").write_text(sitemap)
    (PUBLIC / "robots.txt").write_text(
        "User-agent: *\nAllow: /\nSitemap: https://otokoc-adaptive.onrender.com/sitemap.xml\n"
    )
    print(f"baked {len(vehicles)} vehicles, {len(urls)} sitemap urls")

if __name__ == "__main__":
    main()
