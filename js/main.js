// ===== HEADER SCROLL =====
// Some older pages use legacy markup without IDs. Fall back to class selectors.
const header = document.getElementById('header') || document.querySelector('header.header');
window.addEventListener('scroll', () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger') || document.querySelector('.hamburger');
const nav = document.getElementById('nav') || document.querySelector('.nav');
if (hamburger && nav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    hamburger.classList.remove('active');
    nav.classList.remove('open');
    document.body.style.overflow = '';
  }));
}

// ===== SCROLL ANIMATIONS (AOS-like) =====
const observerOpts = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = parseInt(entry.target.getAttribute('data-delay')) || 0;
      setTimeout(() => entry.target.classList.add('aos-animate'), delay);
      observer.unobserve(entry.target);
    }
  });
}, observerOpts);
document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.stat-number[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      const duration = 2000;
      const start = performance.now();
      const animate = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(animate);
        else el.textContent = target.toLocaleString();
      };
      requestAnimationFrame(animate);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

// ===== REVIEWS CAROUSEL =====
const track = document.getElementById('reviewTrack');
const prevBtn = document.getElementById('prevReview');
const nextBtn = document.getElementById('nextReview');
const dotsContainer = document.getElementById('reviewDots');

if (track && prevBtn && nextBtn) {
  let currentIndex = 0;
  const cards = track.querySelectorAll('.review-card');
  
  function getCardsPerView() {
    if (window.innerWidth <= 900) return 1;
    if (window.innerWidth <= 1200) return 2;
    return 3;
  }
  
  function getMaxIndex() {
    return Math.max(0, cards.length - getCardsPerView());
  }
  
  function updateCarousel() {
    const perView = getCardsPerView();
    const containerWidth = track.parentElement.offsetWidth;
    const gap = perView === 1 ? 16 : 24;
    const cardWidth = (containerWidth - gap * (perView - 1)) / perView;
    cards.forEach(c => { c.style.minWidth = cardWidth + 'px'; });
    track.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
    updateDots();
  }
  
  function updateDots() {
    if (!dotsContainer) return;
    const max = getMaxIndex();
    dotsContainer.innerHTML = '';
    for (let i = 0; i <= max; i++) {
      const dot = document.createElement('div');
      dot.className = 'review-dot' + (i === currentIndex ? ' active' : '');
      dot.addEventListener('click', () => { currentIndex = i; updateCarousel(); });
      dotsContainer.appendChild(dot);
    }
  }
  
  prevBtn.addEventListener('click', () => {
    currentIndex = Math.max(0, currentIndex - 1);
    updateCarousel();
  });
  
  nextBtn.addEventListener('click', () => {
    currentIndex = Math.min(getMaxIndex(), currentIndex + 1);
    updateCarousel();
  });
  
  // Auto-advance
  let autoplay = setInterval(() => {
    currentIndex = currentIndex >= getMaxIndex() ? 0 : currentIndex + 1;
    updateCarousel();
  }, 5000);
  
  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoplay));
  track.parentElement.addEventListener('mouseleave', () => {
    autoplay = setInterval(() => {
      currentIndex = currentIndex >= getMaxIndex() ? 0 : currentIndex + 1;
      updateCarousel();
    }, 5000);
  });
  
  window.addEventListener('resize', () => {
    currentIndex = Math.min(currentIndex, getMaxIndex());
    updateCarousel();
  });
  
  updateCarousel();
}

// ===== MOBILE STICKY CTA =====
const mobileCta = document.getElementById('mobileCta') || document.querySelector('.mobile-cta');
if (mobileCta) {
  window.addEventListener('scroll', () => {
    mobileCta.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
