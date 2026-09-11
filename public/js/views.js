/* ── views.js ── AutoBayii Page Renderers ── */
window.Views = {
  home() {
    return `
      <section class="hero">
        <div class="container">
          <h1>Hayalinizdeki Araca<br><span>Bir Adım Kala</span></h1>
          <p>Yapay zeka destekli arama ile size özel araç önerileri alın. Sadece ne istediğinizi söyleyin.</p>
          <button class="hero-cta" onclick="document.getElementById('search-toggle').click()">
            🔍 Araç Aramaya Başla
          </button>
        </div>
      </section>
      <section class="features">
        <div class="container">
          <h2 class="section-title">Neden <span>AutoBayii</span>?</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🤖</div>
              <h3>AI Destekli Arama</h3>
              <p>Yapay zeka ile aracınızı doğal dilde arayın. "Aileme uygun SUV" deyin, gerisini biz halledelim.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3>Anında Karşılaştırma</h3>
              <p>İki aracı yan yana karşılaştırın. Fiyat, özellik ve performans farklarını anında görün.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3>Kişisel Öneriler</h3>
              <p>Tercihlerinize göre özelleştirilmiş araç önerileri. Her aramanız deneyimi geliştirir.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🛡️</div>
              <h3>Güvenli Alışveriş</h3>
              <p>Tüm araçlar detaylı incelemeden geçer. Ekspertiz raporu ve garanti güvencesiyle satın alın.</p>
            </div>
          </div>
        </div>
      </section>`;
  },

  vehicles() {
    return `
      <section class="about-section">
        <h2>Araçlarımız</h2>
        <p>Geniş araç yelpazemizi keşfedin. Yukarıdaki arama butonuna tıklayarak yapay zeka ile arama yapabilirsiniz.</p>
        <div class="agent-options" style="margin-top:24px">
          <button class="agent-option-btn" onclick="window.WebCuration&&WebCuration.sendDemo('SUV')">🚙 SUV</button>
          <button class="agent-option-btn" onclick="window.WebCuration&&WebCuration.sendDemo('Sedan')">🚗 Sedan</button>
          <button class="agent-option-btn" onclick="window.WebCuration&&WebCuration.sendDemo('Elektrikli')">⚡ Elektrikli</button>
          <button class="agent-option-btn" onclick="window.WebCuration&&WebCuration.sendDemo('Pickup')">🛻 Pickup</button>
        </div>
      </section>`;
  },

  about() {
    return `
      <section class="about-section">
        <h2>Hakkımızda</h2>
        <p>AutoBayii, Türkiye'nin en yenilikçi otomotiv platformudur. Yapay zeka destekli arama motorumuz ile müşterilerimize benzersiz bir araç alım deneyimi sunuyoruz.</p>
        <p>Agentforce teknolojisi ile güçlendirilmiş platformumuz, her müşterinin ihtiyaçlarını anlayarak kişiselleştirilmiş öneriler sunar.</p>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">500+</div><div class="stat-label">Araç</div></div>
          <div class="stat-card"><div class="stat-number">10K+</div><div class="stat-label">Mutlu Müşteri</div></div>
          <div class="stat-card"><div class="stat-number">50+</div><div class="stat-label">Marka</div></div>
          <div class="stat-card"><div class="stat-number">7/24</div><div class="stat-label">AI Destek</div></div>
        </div>
      </section>`;
  },

  contact() {
    return `
      <section class="contact-section">
        <h2>İletişim</h2>
        <p>Sorularınız için bize ulaşın veya yukarıdaki arama butonuyla AI asistanımızla konuşun.</p>
        <form class="contact-form" onsubmit="event.preventDefault();alert('Mesajınız alındı! Teşekkürler.')">
          <div class="form-group"><label>Ad Soyad</label><input type="text" required placeholder="Adınızı girin"></div>
          <div class="form-group"><label>E-posta</label><input type="email" required placeholder="ornek@email.com"></div>
          <div class="form-group"><label>Telefon</label><input type="tel" placeholder="0555 123 4567"></div>
          <div class="form-group"><label>Mesajınız</label><textarea rows="4" required placeholder="Nasıl yardımcı olabiliriz?"></textarea></div>
          <button type="submit" class="form-submit">Gönder</button>
        </form>
      </section>`;
  }
};
