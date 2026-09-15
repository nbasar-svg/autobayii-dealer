#!/usr/bin/env python3
"""Bake Otokoç vehicle HTML so Qualified can crawl names, prices, and specs."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
INV = PUBLIC / "js" / "vehicle-inventory.js"

QUALIFIED_SNIPPET = """    <!-- Qualified -->
    <script>
    (function(w,q){w['QualifiedObject']=q;w[q]=w[q]||function(){
    (w[q].q=w[q].q||[]).push(arguments)};})(window,'qualified')
    </script>
    <script async src="https://js.qualified.com/qualified.js?token=V9vRTXnyirSb2VkF"></script>
    <!-- End Qualified -->
"""

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

def brand_class(v):
    return re.sub(r"[^a-z0-9]+", "-", v["brand"].lower())

# Long-form copy for Qualified crawl. Keep out of vehicle-inventory.js (fragile parser).
VOLVO_EXTRA = {
    "vo1": {
        "story": "EX30, Otokoç Volvo showroomunun giris elektrikli SUV modelidir. Sehir ici park kolayligi, kisa otoban ve sifir egzoz emisyonu isteyenler icin konumlanir. Ultra donanimda Google built-in ve Pilot Assist bulunur. Otokoç stok kodu OTO-VO1, cikis kilometresi dusuk showroom aracidır.",
        "seats": "5 koltuk",
        "drive": "Arkadan itis, tek elektrik motoru",
        "range": "WLTP yaklasik 460-480 km (kullanim ve iklimle degisir)",
        "charge": "DC hizli sarj destekli; evde AC wallbox ile gece sarj",
        "safety": "City Safety otonom acil fren, Pilot Assist, kor nokta uyarisi. Volvo guvenlik felsefesi: kaza olmasin, olsa da yolcu korunsun.",
        "who": "Ilk elektrikli Volvo sunu dusunen, kompakt SUV isteyen ve butceyi EX40/XC60 altinda tutmak isteyen musteriler.",
        "compare": "Daha fazla bagaj ve arka diz mesafesi icin EX40 Ultra; plug-in hybrid uzun yol icin XC60 T8.",
    },
    "vo2": {
        "story": "EX40, eski XC40 Recharge hattinin yerini alan aile boyu elektrikli SUV'dur. Otokoç'ta Ultra paketle satilir. Yuksek oturma konumu ve Google infotainment ile gunluk kullanim ve okul servisi rotasina uygundur.",
        "seats": "5 koltuk",
        "drive": "Tek motor, onde cekis (Extended Range Ultra)",
        "range": "WLTP yaklasik 500 km sinifinda",
        "charge": "DC hizli sarj; isil pompa ile soguk havada daha verimli menzil",
        "safety": "City Safety, Pilot Assist, kosis korumasi. Cocuk koltugu ISOFIX noktalari arka koltukta.",
        "who": "Iki cocuklu aile, sehir plus hafta sonu kacisi, tam elektrik isteyen ama XC90 kadar buyuk istemeyenler.",
        "compare": "Daha kompakt ve uygun fiyat icin EX30; coupe hat icin EC40; yedi koltuk icin XC90.",
    },
    "vo3": {
        "story": "XC60 B5 Plus, Turkiye'de Otokoç Volvo'nun en cok sorulan premium SUV modelidir. Mild hybrid 2.0 benzin artı elektrik destegi ile sehir ici dur-kalkta yakiti dusurur, otoban ve tatil yolunda menzil kaygisi yaratmaz. AWD cekis yagmurlu ve karli zemin icin avantajdir.",
        "seats": "5 koltuk, genis orta sinif SUV",
        "drive": "B5 mild hybrid, AWD",
        "range": "Depo ile uzun yol; elektrik menzili yoktur (PHEV degildir)",
        "charge": "Sarj soketi yok. T8 plug-in isterseniz XC60 T8 Plus bakin.",
        "safety": "Pilot Assist, City Safety, Whiplash korumasi, Blind Spot Information. Volvo XC serisi Euro NCAP basarisinin devamidir.",
        "who": "Gunluk is ve aile, yilda 20 bin km ustu, sarj imkani sinirli olan musteriler.",
        "compare": "Sehirde elektrik km istiyorsaniz XC60 T8; 7 koltuk XC90 B5 veya T8; tam elektrik EX40.",
    },
    "vo4": {
        "story": "XC90 T8 Plus, Otokoç'taki en ust Volvo SUV'dur. Uc sira koltuk, T8 plug-in hybrid (benzin artı elektrik, yaklasik 455 HP sistem gucu) ve AWD. Okul, tatil ve cekis senaryolarinda tek arac olarak konumlanir.",
        "seats": "7 koltuk (2+3+2)",
        "drive": "T8 plug-in hybrid AWD",
        "range": "Elektrikle kisa sehir (WLTP elektrikli menzil yaklasik 70-80 km); uzun yolda benzin motoru devreye girer",
        "charge": "Evde Type 2 AC; is yerinde duvar kutusu onerilir",
        "safety": "City Safety, Pilot Assist, cikis uyarisi. Yuksek oturma ve ucuncu sira cocuk koltugu planlamasi icin Otokoç danismanina sorun.",
        "who": "Buyuk aile, uc kati cocuk koltugu, status ve guvenlik onceligi, evde sarj noktasi olanlar.",
        "compare": "Ayni 7 koltuk daha uygun mild hybrid icin XC90 B5 Plus; 5 koltuk T8 icin XC60 T8 Plus.",
    },
    "vo5": {
        "story": "EC40, EX40 ile ayni elektrikli platformu paylasan coupe-SUV'dur. Daha alcak tavan hatti ve sportif durus. Otokoç'ta gorsel olarak EX40'dan ayrismak isteyenler icin stokta tutulur.",
        "seats": "5 koltuk, arka bas mesafesi EX40a gore biraz daha dusuk",
        "drive": "Tek motor elektrikli",
        "range": "WLTP yaklasik 500 km sinifi",
        "charge": "DC hizli sarj, EX40 ile ayni sarj altyapisi",
        "safety": "City Safety ve Pilot Assist. Coupe tavan arka gorusu daraltabilir; kamera paketi onemlidir.",
        "who": "Tasarim oncelikli, 1-2 cocuk veya cocuksuz, tam elektrik isteyen musteriler.",
        "compare": "Daha pratik aile hacmi EX40 Ultra; daha kucuk EX30; hibrit SUV XC60.",
    },
    "vo6": {
        "story": "XC60 T8 Plus, B5in plug-in kardesidir. Ayni XC60 govde, T8 sistem gucu (yaklasik 455 HP) ve kisa mesafede elektrik surusu. Otokoç'ta evde sarji olan ama 7 koltuk istemeyen musterilere onerilir.",
        "seats": "5 koltuk",
        "drive": "T8 plug-in hybrid AWD",
        "range": "Elektrikli kisa sehir menzili; depo ile Turkiye ici uzun yol",
        "charge": "Type 2 AC ev sarji sarttir; yoksa B5 daha dogru tercih",
        "safety": "XC60 B5 ile ayni Volvo surucu destekleri, kamera ve Pilot Assist.",
        "who": "Ise elektrikle gidip gelen, hafta sonu otoban yapan cift veya kucuk aile.",
        "compare": "Sarj yoksa XC60 B5 Plus; 7 koltuk XC90 T8; tam elektrik EX40.",
    },
    "vo7": {
        "story": "XC90 B5 Plus, T8in mild hybrid versiyonudur. Yedi koltuk ve XC90 hacmi kalir, duvar tipi sarj zorunlulugu kalkar. Otokoç'ta T8 butcesine cikmak istemeyen buyuk aileler icin ana tavsiyedir.",
        "seats": "7 koltuk",
        "drive": "B5 mild hybrid AWD",
        "range": "Klasik depo menzili; elektrikli-only km yok",
        "charge": "Sarj soketi yok",
        "safety": "Yuksek govde, City Safety, Pilot Assist. Ucuncu sira yetiskinler icin kisa mesafe; cocuklar icin uygun.",
        "who": "7 koltuk isteyen, evde sarj noktasi olmayan veya cok uzun yol yapan aileler.",
        "compare": "Sehir elektrigi icin XC90 T8 Plus; 5 koltuk XC60 B5; elektrik SUV EX40.",
    },
    "vo8": {
        "story": "V60 B4 Plus, Otokoç Volvo'daki tek station wagon stokudur. SUV oturma konumu yerine daha dusuk agirlik merkezi, uzun bagaj tabani ve mild hybrid B4 motor. Kopec ve tatil valizi tasiyan ama XC60 yuksekligini istemeyenlere hitap eder.",
        "seats": "5 koltuk, uzun bagaj",
        "drive": "B4 mild hybrid, onde cekis",
        "range": "Benzin mild hybrid; uzun otoban icin uygun",
        "charge": "Sarj soketi yok",
        "safety": "City Safety, Pilot Assist, wagon arka gorus icin kamera. ISOFIX arka koltuk.",
        "who": "Premium wagon isteyen, bagaj odaklı, SUV yukusunu sevmeyen suruculer.",
        "compare": "Daha yuksek oturma XC60 B5; tam elektrik EX30 veya EX40; 7 koltuk XC90.",
    },
}


def volvo_extra_html(v):
    extra = VOLVO_EXTRA.get(v["id"])
    if not extra:
        return ""
    return (
        "            <h2>Neden bu Volvo?</h2>\n"
        f"            <p>{extra['story']}</p>\n"
        "            <h2>Teknik ozet</h2>\n"
        "            <ul>\n"
        f"                <li>Koltuk duzeni: {extra['seats']}</li>\n"
        f"                <li>Cekis ve guc: {extra['drive']}</li>\n"
        f"                <li>Menzil: {extra['range']}</li>\n"
        f"                <li>Sarj: {extra['charge']}</li>\n"
        "            </ul>\n"
        "            <h2>Guvenlik</h2>\n"
        f"            <p>{extra['safety']}</p>\n"
        "            <h2>Kimler icin?</h2>\n"
        f"            <p>{extra['who']}</p>\n"
        "            <h2>Otokoç danismani ne onerir?</h2>\n"
        f"            <p>{extra['compare']}</p>\n"
        '            <p><a href="../volvo.html">Tum Otokoç Volvo modelleri, elektrikli-hibrit farki ve SSS</a></p>\n'
    )


def volvo_hub_page(vehicles):
    volvos = [v for v in vehicles if v["brand"] == "Volvo"]
    rows = []
    for v in volvos:
        rows.append(
            f'                <li><a href="arac/{slug(v)}.html">{v["brand"]} {v["name"]}</a>'
            f' — {v["year"]}, {v["fuel"]}, {v["hp"]}, {v["km"]}, <strong>{v["price"]}</strong>. {v["desc"]}</li>'
        )
    listing = "\n".join(rows)
    return f'''<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Otokoç Volvo | EX30 EX40 XC60 XC90 V60 | Yetkili Satici</title>
    <meta name="description" content="Otokoç Volvo yetkili satici. EX30, EX40, EC40 elektrikli; XC60 ve XC90 hibrit ve plug-in hybrid; V60 wagon. Fiyat, menzil, guvenlik, test surusu ve finansman.">
    <meta name="keywords" content="Otokoç Volvo, Volvo yetkili satici, EX30, EX40, XC60, XC90, EC40, V60, plug-in hybrid, elektrikli Volvo">
    <link rel="stylesheet" href="css/bootstrap.min.css" type="text/css">
    <link rel="stylesheet" href="css/font-awesome.min.css" type="text/css">
    <link rel="stylesheet" href="css/style.css" type="text/css">
{QUALIFIED_SNIPPET}</head>
<body>
    <header class="header">
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <a href="index.html" class="brand-logo">Oto<span>koç</span></a>
                    <nav class="header__menu" style="display:inline-block;margin-left:24px">
                        <ul>
                            <li><a href="index.html">Ana Sayfa</a></li>
                            <li><a href="car.html">Araclar</a></li>
                            <li class="active"><a href="volvo.html">Volvo</a></li>
                            <li><a href="contact.html">Iletisim</a></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </header>
    <article class="about spad">
        <div class="container">
            <p><a href="index.html">Otokoç</a> / <span>Volvo</span></p>
            <h1>Otokoç Volvo yetkili satici</h1>
            <p>Otokoç, Turkiye'de Ford ve Fiat ile birlikte <strong>Volvo</strong> markasinin yetkili saticisi ve servisidir. Showroomda yeni nesil elektrikli SUV'lar (EX30, EX40, EC40) ile XC60 ve XC90 hibrit / plug-in hybrid SUV'lar ve V60 wagon bulunur. Satis, yetkili servis, orijinal yedek parca, sigorta ve finansman ayni noktada sunulur.</p>
            <h2>Hangi Volvo kime gore?</h2>
            <ul>
                <li><strong>EX30 Ultra:</strong> En uygun elektrikli Volvo. Sehir, ilk EV, kompakt park.</li>
                <li><strong>EX40 Ultra:</strong> Aile elektrikli SUV. Daha fazla hacim ve menzil.</li>
                <li><strong>EC40 Ultra:</strong> Ayni elektrik platformu, coupe-SUV tasarim.</li>
                <li><strong>XC60 B5 Plus:</strong> Sarj soketi istemeyen premium 5 koltuk SUV. Mild hybrid AWD.</li>
                <li><strong>XC60 T8 Plus:</strong> Ayni XC60, plug-in hybrid. Evde sarj varsa sehirde elektrik.</li>
                <li><strong>XC90 B5 Plus:</strong> 7 koltuk mild hybrid. Buyuk aile, sarj yok.</li>
                <li><strong>XC90 T8 Plus:</strong> 7 koltuk plug-in hybrid. En ust donanim ve guc.</li>
                <li><strong>V60 B4 Plus:</strong> Premium wagon. Bagaj hacmi ve yol tutus, SUV yukusuz.</li>
            </ul>
            <h2>Elektrikli mi, hibrit mi, plug-in mi?</h2>
            <p><strong>Tam elektrikli (EX30, EX40, EC40):</strong> Egzoz yok, ev veya is yeri sarji gerekir. Sehir ve gunluk otoban icin dogrudur. Uzun tatilde sarj plani yapilmalidir.</p>
            <p><strong>Mild hybrid B5/B4 (XC60 B5, XC90 B5, V60 B4):</strong> Klasik benzin artı 48V destek. Sarj kablosu yoktur. Yilda cok km yapan, evde wallbox olmayan musterinin varsayilan secimidir.</p>
            <p><strong>Plug-in hybrid T8 (XC60 T8, XC90 T8):</strong> Kisa mesafeyi elektrikle, uzun yolu benzinle alir. Evde Type 2 sarj yoksa avantaj buyuk olcude kaybolur; o zaman B5 onerilir.</p>
            <h2>Guvenlik ve surucu destekleri</h2>
            <p>Volvo, City Safety otonom acil fren, Pilot Assist serit ve mesafe destegi, kor nokta ve arkadan carpismayi azaltan sistemlerle konumlanir. Otokoç teslimatinda bu sistemlerin demo surusu yapilir. Cocuk koltugu ve ISOFIX yerlesimi model bazinda degisir; XC90 ucuncu sira kisa boylu yolcular ve cocuklar icindir.</p>
            <h2>Servis, garanti, finansman</h2>
            <p>Otokoç Volvo yetkili servisinde periyodik bakim, yazilim guncellemesi ve orijinal parca kullanilir. Elektrikli modellerde batarya sagligi ve sarj unitesi kontrolu bakim paketinin parcasi olabilir. Bireysel kredi ve filo icin 0850 123 45 67 veya info@otokoc.com.tr.</p>
            <h2>Test surusu</h2>
            <p>EX30, XC60 ve XC90 icin randevulu test surusu acilir. Surucu belgesi ve iletisim bilgisi yeterlidir. Stoktaki cikis kmli showroom araclari asagidadir; fiyatlar Otokoç guncel listeye gore degisebilir.</p>
            <h2>Stoktaki Otokoç Volvo araclari</h2>
            <ul>
{listing}
            </ul>
            <h2>Sik sorulan sorular</h2>
            <h3>Otokoç Volvo satiyor mu?</h3>
            <p>Evet. Otokoç, Volvo yetkili satici ve yetkili servistir. Elektrikli EX serisi ile XC ve V serisi hibritler showroomdadir.</p>
            <h3>En uygun Volvo hangisi?</h3>
            <p>Guncel stokta en uygun elektrikli model EX30 Ultra. En uygun hibrit SUV genelde XC60 B5 Plus bandindadir. Guncel fiyat icin ilgili arac sayfasina bakin.</p>
            <h3>XC60 B5 ile T8 farki nedir?</h3>
            <p>B5 mild hybriddir, prize takilmaz. T8 plug-in hybriddir, sehir ici elektrikli km sunar ve sistem gucu daha yuksektir. Evde sarj yoksa B5 daha mantiklidir.</p>
            <h3>XC90 kac kisilik?</h3>
            <p>XC90 B5 ve XC90 T8 yedi koltukludur (2+3+2). Ucuncu sira yetiskin uzun yol icin dardir; cocuk ve kisa mesafe icin uygundur.</p>
            <h3>EX30 menzili yeter mi?</h3>
            <p>Sehir ve kisa otoban icin evet, WLTP yaklasik 460-480 km sinifindadir. Kis, klima ve hizli surus menzili dusurur. Aile ve uzun tatil icin EX40 veya T8/B5 XC60 bakin.</p>
            <h3>BMW veya Mercedes Volvo yerine var mi?</h3>
            <p>Hayir. Bu Otokoç noktasinda satilan binek markalar Ford, Fiat ve Volvo'dur.</p>
            <p><a class="primary-btn" href="contact.html">Test surusu ve finansman</a> <a class="primary-btn more-btn" href="car.html">Tum stok</a></p>
        </div>
    </article>
</body>
</html>
'''


def card(v, col, img_prefix=""):
    href = f"arac/{slug(v)}.html"
    img = img_prefix + v["img"]
    title = f"{v['brand']} {v['name']}"
    return f'''                <article class="{col} mix sale {cat_class(v)} {brand_class(v)}" itemscope itemtype="https://schema.org/Car">
                    <div class="car__item">
                        <div class="car__item__pic__slider">
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
    related = [x for x in all_v if x["id"] != v["id"] and x.get("brand") == v.get("brand")][:3]
    if len(related) < 3:
        related = related + [x for x in all_v if x["id"] != v["id"] and x not in related][: 3 - len(related)]
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
    <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
{QUALIFIED_SNIPPET}</head>
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
                            <li><a href="../volvo.html">Volvo</a></li>
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
{volvo_extra_html(v)}            <ul>
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

def replace_div_by_id(html: str, div_id: str, replacement: str) -> str:
    needle = f'id="{div_id}"'
    id_pos = html.find(needle)
    if id_pos < 0:
        raise SystemExit(f"missing id={div_id}")
    start = html.rfind("<div", 0, id_pos)
    if start < 0:
        raise SystemExit(f"unopened div for {div_id}")
    i = html.find(">", id_pos) + 1
    depth = 1
    while i < len(html) and depth:
        next_open = html.find("<div", i)
        next_close = html.find("</div>", i)
        if next_close < 0:
            raise SystemExit(f"unclosed div for {div_id}")
        if next_open != -1 and next_open < next_close:
            depth += 1
            i = next_open + 4
        else:
            depth -= 1
            i = next_close + 6
    return html[:start] + replacement + html[i:]


def inject_grid(path: Path, html: str):
    text = replace_div_by_id(path.read_text(), "vehicle-grid", html)
    path.write_text(text)

def main():
    vehicles = load_inventory()
    home_cards = "\n".join(card(v, "col-lg-3 col-md-4 col-sm-6") for v in vehicles)
    list_cards = "\n".join(card(v, "col-lg-4 col-md-4") for v in vehicles)

    inject_grid(
        PUBLIC / "index.html",
        "            <div class=\"row car-filter\" id=\"vehicle-grid\" data-content-zone=\"home_recommendations\" data-col-class=\"col-lg-3 col-md-4 col-sm-6 mix sale\">\n"
        + home_cards
        + "            </div>",
    )
    inject_grid(
        PUBLIC / "car.html",
        "                    <div class=\"row\" id=\"vehicle-grid\" data-content-zone=\"vehicle_catalog\" data-col-class=\"col-lg-4 col-md-4 mix sale\">\n"
        + list_cards
        + "                    </div>",
    )

    out = PUBLIC / "arac"
    out.mkdir(exist_ok=True)
    urls = [
        "https://otokoc-adaptive.onrender.com/",
        "https://otokoc-adaptive.onrender.com/car.html",
        "https://otokoc-adaptive.onrender.com/contact.html",
        "https://otokoc-adaptive.onrender.com/about.html",
        "https://otokoc-adaptive.onrender.com/volvo.html",
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
