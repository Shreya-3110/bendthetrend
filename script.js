/* ==========================================================================
   BEND THE TREND — DYNAMIC ANIMATIONS, CMS INTEGRATION & INTERACTIONS
   ========================================================================== */

import { supabase, isSupabaseConfigured, SEED_PROJECTS } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {

  // ==================== 1. CUSTOM CURSOR (YELLOW CIRCLE) ====================
  const cur = document.getElementById('customCursor');

  if (cur) {
    const updateCursorPos = (x, y) => {
      cur.style.setProperty('--cx', x + 'px');
      cur.style.setProperty('--cy', y + 'px');
      cur.classList.add('visible');
    };

    window.addEventListener('pointermove', (e) => {
      updateCursorPos(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      updateCursorPos(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        updateCursorPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        updateCursorPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // Grow cursor on hover over interactive elements
    const attachCursorHover = (container = document) => {
      const targets = container.querySelectorAll(
        'a, button, input, textarea, .service-row__header, .faq-item__header, .tilt-card, .process-tab, .quick-card, .sticker, .filter-btn, .brand-tab'
      );
      targets.forEach(el => {
        if (!el.__cursorBound) {
          el.__cursorBound = true;
          el.addEventListener('mouseenter', () => cur.classList.add('big'));
          el.addEventListener('mouseleave', () => cur.classList.remove('big'));
        }
      });
    };
    attachCursorHover();
    window.attachCursorHover = attachCursorHover;
  }

  // ==================== 2. INTERSECTION OBSERVER (SCROLL REVEALS) ====================
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100) {
      el.classList.add('is-visible');
    }
    revealObserver.observe(el);
  });

  // ==================== 3. 3D MAGNETIC CARD TILT ====================
  function initTiltCards(container = document) {
    const tiltCards = container.querySelectorAll('.tilt-card');

    tiltCards.forEach((card) => {
      if (card.__hasTilt) return;
      card.__hasTilt = true;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -6; // max 6deg
        const rotateY = ((x - centerX) / centerX) * 6;  // max 6deg

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }
  initTiltCards();

  // ==================== 4. HERO PARALLAX STICKER BADGES ====================
  const heroSection = document.getElementById('hero');
  const stickerTimeless = document.querySelector('.sticker--timeless');
  const stickerEdgy = document.querySelector('.sticker--edgy');
  const stickerCreative = document.querySelector('.sticker--creative');

  if (heroSection && window.innerWidth > 768) {
    heroSection.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const deltaX = (clientX - centerX) / centerX;
      const deltaY = (clientY - centerY) / centerY;

      if (stickerTimeless) {
        stickerTimeless.style.transform = `translate(${deltaX * -18}px, ${deltaY * -18}px) rotate(${deltaX * 6}deg)`;
      }
      if (stickerEdgy) {
        stickerEdgy.style.transform = `translate(${deltaX * 22}px, ${deltaY * 22}px) rotate(${deltaX * -8}deg)`;
      }
      if (stickerCreative) {
        stickerCreative.style.transform = `translate(${deltaX * 12}px, ${deltaY * -12}px)`;
      }
    });

    heroSection.addEventListener('mouseleave', () => {
      if (stickerTimeless) stickerTimeless.style.transform = '';
      if (stickerEdgy) stickerEdgy.style.transform = '';
      if (stickerCreative) stickerCreative.style.transform = '';
    });
  }

  // ==================== 5. MENU DROPDOWN TOGGLE ====================
  const menuToggle = document.getElementById('menuToggle');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const dropdownLinks = document.querySelectorAll('.dropdown-menu__link, .dropdown-menu__cta');

  if (menuToggle && dropdownMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.toggle('is-open');
      dropdownMenu.setAttribute('aria-hidden', !isOpen);
      menuToggle.querySelector('.menu-btn__text').textContent = isOpen ? 'CLOSE' : 'MENU';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (dropdownMenu.classList.contains('is-open') && !dropdownMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        dropdownMenu.classList.remove('is-open');
        dropdownMenu.setAttribute('aria-hidden', 'true');
        menuToggle.querySelector('.menu-btn__text').textContent = 'MENU';
      }
    });

    // Close menu when clicking any link
    dropdownLinks.forEach(link => {
      link.addEventListener('click', () => {
        dropdownMenu.classList.remove('is-open');
        dropdownMenu.setAttribute('aria-hidden', 'true');
        menuToggle.querySelector('.menu-btn__text').textContent = 'MENU';
      });
    });
  }

  // ==================== 6. SERVICES ACCORDION ====================
  const serviceRows = document.querySelectorAll('.service-row');

  serviceRows.forEach(row => {
    const header = row.querySelector('.service-row__header');
    const toggleIcon = row.querySelector('.icon-toggle');

    if (header) {
      header.addEventListener('click', () => {
        const isActive = row.classList.contains('active');

        serviceRows.forEach(otherRow => {
          if (otherRow !== row) {
            otherRow.classList.remove('active');
            const otherIcon = otherRow.querySelector('.icon-toggle');
            if (otherIcon) otherIcon.textContent = '+';
          }
        });

        if (isActive) {
          row.classList.remove('active');
          if (toggleIcon) toggleIcon.textContent = '+';
        } else {
          row.classList.add('active');
          if (toggleIcon) toggleIcon.textContent = '−';
        }
      });
    }
  });

  // ==================== 7. PROCESS TABS SWITCHER ====================
  const processTabs = document.querySelectorAll('.process-tab');
  const processPanes = document.querySelectorAll('.process-pane');

  processTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const step = tab.getAttribute('data-step');

      processTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      processPanes.forEach(pane => {
        pane.classList.remove('active');
      });

      const activePane = document.getElementById(`processPane${step}`);
      if (activePane) {
        activePane.classList.add('active');
      }
    });
  });

  // ==================== 8. FAQS ACCORDION ====================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const header = item.querySelector('.faq-item__header');

    if (header) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });

        item.classList.toggle('active', !isActive);
      });
    }
  });

  // ==================== 9. FLOATING BACK TO TOP BUTTON ====================
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 450) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }, { passive: true });

  // ==================== 10. CONTACT FORM SUBMISSION ====================
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('contactName')?.value || '';
      const email = document.getElementById('contactEmail')?.value || '';
      const phone = document.getElementById('contactPhone')?.value || '';
      const message = document.getElementById('contactMsg')?.value || '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Message... ✦';
      }

      try {
        const formData = new FormData(contactForm);
        formData.append('access_key', 'YOUR_ACCESS_KEY');
        formData.append('subject', `New Custom Quote Request from ${name}`);
        formData.append('from_name', name);

        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          if (formSuccess) {
            formSuccess.hidden = false;
            formSuccess.innerHTML = '<span>✓</span> Thank you! We received your message and sent it directly to bendthetrend0328@gmail.com.';
          }
          contactForm.reset();
        } else {
          const mailtoUrl = `mailto:bendthetrend0328@gmail.com?subject=Custom Quote Request from ${encodeURIComponent(name)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`)}`;
          window.location.href = mailtoUrl;

          if (formSuccess) {
            formSuccess.hidden = false;
            formSuccess.innerHTML = '<span>✓</span> Opening email client to send your message to bendthetrend0328@gmail.com...';
          }
        }
      } catch (err) {
        const mailtoUrl = `mailto:bendthetrend0328@gmail.com?subject=Custom Quote Request from ${encodeURIComponent(name)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`)}`;
        window.location.href = mailtoUrl;

        if (formSuccess) {
          formSuccess.hidden = false;
          formSuccess.innerHTML = '<span>✓</span> Opening email client to send your message to bendthetrend0328@gmail.com...';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Message';
        }
      }
    });
  }

  // ==================== 11. SMOOTH NAVIGATION SCROLLING ====================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==================== 12. VIDEO REELS & HOVER PLAY ====================
  function initVideoReels(container = document) {
    const allReelCards = container.querySelectorAll('.reel-card');
    allReelCards.forEach(card => {
      if (card.__hasVideoReel) return;
      card.__hasVideoReel = true;

      const video = card.querySelector('video');
      if (video) {
        card.addEventListener('mouseenter', () => {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        });

        card.addEventListener('mouseleave', () => {
          video.pause();
        });

        card.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!video.paused) {
            video.pause();
          } else {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          }
        });
      }
    });
  }
  initVideoReels();

  // Skip initial black frames on preview videos with data-start-time
  const previewVideos = document.querySelectorAll('.reel-card__video[data-start-time]');
  previewVideos.forEach(vid => {
    const startTime = parseFloat(vid.getAttribute('data-start-time') || 0);
    if (startTime > 0) {
      const applySeek = () => {
        try {
          if (vid.currentTime < 0.1) vid.currentTime = startTime;
        } catch (e) {}
      };

      if (vid.readyState >= 1) {
        applySeek();
      } else {
        vid.addEventListener('loadedmetadata', applySeek, { once: true });
        vid.addEventListener('loadeddata', applySeek, { once: true });
      }
    }
  });

  // Landing page brand filter tabs
  const brandTabs = document.querySelectorAll('.brand-tab');
  const reelCards = document.querySelectorAll('#videoReelsGrid .reel-card');

  if (brandTabs.length > 0 && reelCards.length > 0) {
    brandTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        brandTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const brand = tab.getAttribute('data-brand');

        reelCards.forEach(card => {
          const cardBrand = card.getAttribute('data-brand');
          if (brand === 'all' || cardBrand === brand) {
            card.classList.remove('is-hidden');
          } else {
            card.classList.add('is-hidden');
          }
        });
      });
    });
  }

  // ==================== 13. PORTFOLIO VIDEO & LIGHTBOX MODAL ====================
  const modal = document.getElementById('portfolioModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalMedia = document.getElementById('modalMedia');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');

  let activeGalleryImages = [];
  let currentGalleryIndex = 0;

  function updateModalGalleryImage() {
    if (!modalMedia || activeGalleryImages.length === 0) return;
    const imgTag = modalMedia.querySelector('.modal-gallery-img');
    const counterTag = modalMedia.querySelector('.gallery-counter');
    if (imgTag) {
      imgTag.src = activeGalleryImages[currentGalleryIndex];
    }
    if (counterTag) {
      counterTag.textContent = `${currentGalleryIndex + 1} / ${activeGalleryImages.length}`;
    }
  }

  function openModal(title, desc, videoUrl, embedUrl, imageUrl, imagesList) {
    if (!modal) return;
    if (modalTitle) modalTitle.textContent = title || 'Project Preview';
    if (modalDesc) modalDesc.textContent = desc || '';

    if (modalMedia) modalMedia.innerHTML = '';

    if (videoUrl) {
      modalMedia.innerHTML = `
        <video src="${videoUrl}" controls autoplay playsinline style="width:100%; max-height:540px; object-fit:contain; background:#000;"></video>
      `;
    } else if (embedUrl) {
      modalMedia.innerHTML = `
        <iframe src="${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; height:450px;"></iframe>
      `;
    } else if (imagesList && imagesList.length > 0) {
      activeGalleryImages = imagesList;
      currentGalleryIndex = 0;
      modalMedia.innerHTML = `
        <div class="modal-gallery-wrap" style="position:relative; width:100%; display:flex; flex-direction:column; align-items:center;">
          <div style="position:relative; width:100%; display:flex; justify-content:center; align-items:center;">
            ${imagesList.length > 1 ? `
              <button id="galleryPrevBtn" aria-label="Previous creative" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); width:44px; height:44px; border-radius:50%; background:#FFEA2E; color:#121212; border:3px solid #121212; box-shadow:3px 3px 0 #121212; font-size:1.4rem; font-weight:900; cursor:pointer; z-index:15; display:flex; align-items:center; justify-content:center; user-select:none;">‹</button>
            ` : ''}
            <img class="modal-gallery-img" src="${imagesList[0]}" alt="${title || 'Project Preview'}" style="max-width:100%; max-height:70vh; object-fit:contain; display:block; margin:0 auto; border-radius:10px; border:2px solid var(--border-dark); box-shadow:4px 4px 0px var(--border-dark);" />
            ${imagesList.length > 1 ? `
              <button id="galleryNextBtn" aria-label="Next creative" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); width:44px; height:44px; border-radius:50%; background:#FFEA2E; color:#121212; border:3px solid #121212; box-shadow:3px 3px 0 #121212; font-size:1.4rem; font-weight:900; cursor:pointer; z-index:15; display:flex; align-items:center; justify-content:center; user-select:none;">›</button>
            ` : ''}
          </div>
          ${imagesList.length > 1 ? `
            <div class="gallery-counter" style="margin-top:12px; font-weight:800; font-size:0.9rem; background:#121212; color:#FFEA2E; padding:4px 14px; border-radius:20px; border:2px solid #FFEA2E;">1 / ${imagesList.length}</div>
          ` : ''}
        </div>
      `;

      const prev = modalMedia.querySelector('#galleryPrevBtn');
      const next = modalMedia.querySelector('#galleryNextBtn');
      if (prev) {
        prev.addEventListener('click', (e) => {
          e.stopPropagation();
          currentGalleryIndex = (currentGalleryIndex - 1 + activeGalleryImages.length) % activeGalleryImages.length;
          updateModalGalleryImage();
        });
      }
      if (next) {
        next.addEventListener('click', (e) => {
          e.stopPropagation();
          currentGalleryIndex = (currentGalleryIndex + 1) % activeGalleryImages.length;
          updateModalGalleryImage();
        });
      }
    } else if (imageUrl) {
      modalMedia.innerHTML = `
        <img src="${imageUrl}" alt="${title || 'Project Preview'}" style="max-width:100%; max-height:75vh; object-fit:contain; display:block; margin:0 auto; border-radius:10px; border:2px solid var(--border-dark); box-shadow:4px 4px 0px var(--border-dark);" />
      `;
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (modalMedia) modalMedia.innerHTML = '';
    }, 300);
  }

  function bindCardClicks(container = document) {
    const videoCards = container.querySelectorAll('.video-card:not(.reel-card)');
    videoCards.forEach(card => {
      if (card.__hasModalClick) return;
      card.__hasModalClick = true;

      card.addEventListener('click', () => {
        const title = card.getAttribute('data-title') || card.querySelector('.project-card__name')?.textContent;
        const desc = card.getAttribute('data-desc') || card.querySelector('.project-card__desc')?.textContent;
        const videoSrc = card.getAttribute('data-video');
        const embedSrc = card.getAttribute('data-embed');
        const imageSrc = card.getAttribute('data-image');
        const imagesAttr = card.getAttribute('data-images');
        const imagesList = imagesAttr ? imagesAttr.split(',').map(s => s.trim()).filter(Boolean) : null;
        if (videoSrc || embedSrc || imageSrc || imagesList) {
          openModal(title, desc, videoSrc, embedSrc, imageSrc, imagesList);
        }
      });
    });
  }
  bindCardClicks();

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // ==================== 14. DYNAMIC PORTFOLIO CMS LOADER ====================
  async function loadDynamicPortfolio() {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return; // Only executes on portfolio.html

    // Show smooth loading skeleton
    grid.innerHTML = `
      <div class="portfolio-skeleton"></div>
      <div class="portfolio-skeleton"></div>
    `;

    let projects = [];

    // Attempt Supabase fetch
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('portfolio_projects')
          .select(`
            *,
            portfolio_media (
              id, type, url, sort_order
            )
          `)
          .eq('published', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          projects = data;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to cached seed data:', err);
      }
    }

    // Fallback if unconfigured or offline
    if (projects.length === 0) {
      const demoStored = localStorage.getItem('btt_demo_projects');
      if (demoStored !== null) {
        try {
          const parsed = JSON.parse(demoStored);
          projects = parsed.filter(p => p.published);
        } catch (e) {}
      } else {
        projects = SEED_PROJECTS.filter(p => p.published);
      }
    }

    // Empty state
    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="portfolio-empty">
          <div class="portfolio-empty__icon">📁</div>
          <h3>No projects published yet</h3>
          <p>Check back soon for our latest work and client campaigns.</p>
        </div>
      `;
      return;
    }

    // Render projects matching exact existing markup architecture
    grid.innerHTML = projects.map(p => {
      const category = p.category || 'branding';
      const categoryLabel = p.category_label || getDefaultCategoryLabel(category);
      const isVideo = p.media_type === 'video';
      const isGallery = p.media_type === 'gallery';
      
      let galleryUrls = [];
      if (isGallery) {
        const media = p.portfolio_media || p.gallery || [];
        media.forEach(m => {
          if (m.url) galleryUrls.push(m.url);
        });
        if (galleryUrls.length === 0 && p.media_url) {
          galleryUrls.push(p.media_url);
        }
      }

      const videoUrl = isVideo ? p.media_url : '';
      const imageUrl = p.thumbnail_url || (!isVideo ? p.media_url : '');
      const imagesAttr = isGallery ? galleryUrls.join(',') : '';

      return `
        <div class="project-card tilt-card video-card" 
             data-category="${escapeAttr(category)}" 
             data-type="${p.media_type || 'image'}" 
             data-title="${escapeAttr(p.title + ' — ' + (p.client || ''))}" 
             data-desc="${escapeAttr(p.detailed_description || p.description)}"
             ${videoUrl ? `data-video="${videoUrl}"` : ''}
             ${imageUrl ? `data-image="${imageUrl}"` : ''}
             ${imagesAttr ? `data-images="${imagesAttr}"` : ''}>
          <div class="project-card__thumb">
            ${isVideo && !p.thumbnail_url ? `
              <video class="reel-card__video" src="${videoUrl}#t=1.0" muted loop playsinline preload="metadata" style="height:100%; object-fit:cover;"></video>
            ` : `
              <img src="${imageUrl || 'assets/img_1.png'}" alt="${escapeAttr(p.title)}" loading="lazy" />
            `}
            <div class="play-overlay">
              <div class="play-btn-circle">
                <span class="play-icon">▶</span>
              </div>
            </div>
            <span class="project-card__pill">${escapeHtml(categoryLabel)}</span>
            ${p.performance_badge ? `<span class="metric-badge">${escapeHtml(p.performance_badge)}</span>` : ''}
          </div>
          <div class="project-card__info">
            <h3 class="project-card__name">${escapeHtml(p.title)}</h3>
            <p class="project-card__desc">${escapeHtml(p.description)}</p>
          </div>
        </div>
      `;
    }).join('') + `
      <div id="portfolioEmptyMsg" class="portfolio-empty" style="display: none;">
        <div class="portfolio-empty__icon">🔍</div>
        <h3>No projects found in this category</h3>
        <p>Try selecting another category above to explore our work.</p>
      </div>
    `;

    // Re-bind dynamic interactions
    initTiltCards(grid);
    bindCardClicks(grid);
    initVideoReels(grid);

    if (window.attachCursorHover) {
      window.attachCursorHover(grid);
    }
  }

  // ==================== 15. PORTFOLIO FILTER BUTTONS ====================
  function initPortfolioFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');
        const portfolioCards = document.querySelectorAll('#portfolioGrid .project-card');

        let visibleCount = 0;
        portfolioCards.forEach(card => {
          const category = card.getAttribute('data-category') || '';
          const categories = category.split(/\s+/);
          if (filterValue === 'all' || categories.includes(filterValue)) {
            card.classList.remove('is-hidden');
            visibleCount++;
          } else {
            card.classList.add('is-hidden');
          }
        });

        const emptyEl = document.getElementById('portfolioEmptyMsg');
        if (emptyEl) {
          emptyEl.style.display = visibleCount === 0 ? 'block' : 'none';
        }
      });
    });
  }

  // Start Dynamic Portfolio
  loadDynamicPortfolio();
  initPortfolioFilterButtons();

});

// Helper Functions
function getDefaultCategoryLabel(category) {
  const map = {
    video: 'Reels & Video',
    branding: 'Branding & Web',
    social: 'Social Campaigns',
    ads: 'Performance Ads',
    healthcare: 'Healthcare & Dental'
  };
  return map[category] || category;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
