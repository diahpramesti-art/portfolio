// 🌐 HELPER OTOMATIS: EKSTRAK NAMA PLATFORM DARI DOMAIN URL
function getPlatformName(url) {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        const brand = hostname.split('.')[0];
        if (!brand) return '';
        // Ubah huruf pertama jadi kapital (misal: dicoding -> Dicoding)
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    } catch (e) {
        return '';
    }
}

// 📊 GLOBAL CHART INSTANCE TRACKER
let competencyChartInstance = null;

// 🛠️ HELPER OTOMATIS: UBAH LINK GOOGLE DRIVE JADI EMBED ANTI-BLOKIR
function fixDriveUrl(url) {
    if (!url) return '';
    url = url.trim();
    const match = url.match(/[-\w]{25,}/);
    if (match && (url.includes('google') || url.includes('drive'))) {
        return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w1200`;
    }
    return url;
}

// 📊 HELPER GOOGLE ANALYTICS TRACKING
function trackEvent(action, category, label) {
    if (typeof gtag === 'function') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

// CSV Configuration (Portofolio, Pengalaman & Skill)
const sheetPubId = "e/2PACX-1vQrpOGyzYSWarEcCUEPGi8EOYKUON0y6tHETBDCcx9lgVWHWz2CxY2655V8xWGJWs-cK8Ayt0Vmt92t";
const expGid = "1489099062";
const skillsGid = "1536167160";
const faqGid = "1545021896";

const csvUrlPorto = `https://docs.google.com/spreadsheets/d/${sheetPubId}/pub?output=csv`;
const csvUrlExp = `https://docs.google.com/spreadsheets/d/${sheetPubId}/pub?gid=${expGid}&single=true&output=csv`;
const csvUrlSkills = `https://docs.google.com/spreadsheets/d/${sheetPubId}/pub?gid=${skillsGid}&single=true&output=csv`;
const csvUrlFaq = `https://docs.google.com/spreadsheets/d/${sheetPubId}/pub?gid=${faqGid}&single=true&output=csv`;

let globalData = [];
let activeCategory = 'All';
let currentModalImages = [];
let currentImageIndex = 0;

// Scroll Animation Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('section').forEach(section => observer.observe(section));

    // ✨ SPOTLIGHT GLOW EFFECT TRACKER
    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('.card').forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Mobile Nav
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // 📍 SCROLLSPY - ACTIVE NAVBAR LINK
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Search Input Listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterAndSearch(e.target.value));
    }

    // Copy Email Event + Analytics Tracking
    const copyBtn = document.getElementById('copy-email-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText('hi.diahpramesti@gmail.com');
            showToast();
            trackEvent('copy_email', 'Contact', 'Email Copied to Clipboard');
        });
    }

    // ⌨️ KEYBOARD NAVIGATION CONTROLLER (Modal & Carousel)
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('project-modal');
        const contactModal = document.getElementById('contact-modal');

        if (modal && modal.classList.contains('active')) {
            if (e.key === 'Escape') closeModal();
            else if (e.key === 'ArrowLeft') changeImage(-1);
            else if (e.key === 'ArrowRight') changeImage(1);
        } else if (contactModal && contactModal.classList.contains('active')) {
            if (e.key === 'Escape') closeContactModal();
        }
    });

    // Load Data Google Sheets
    fetchPortfolioData();
    fetchExperienceData();
    fetchSkillsData();
    initColorCustomizer();
    initDynamicGreeting();
    fetchFaqData();
});

function showToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function parseCSV(text) {
    let lines = [];
    let row = [];
    let inQuotes = false;
    let currentStr = '';

    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        let nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentStr += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(currentStr.trim());
            currentStr = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            row.push(currentStr.trim());
            if (row.length > 1 || row[0] !== '') lines.push(row);
            row = [];
            currentStr = '';
        } else {
            currentStr += char;
        }
    }
    if (currentStr || row.length > 0) {
        row.push(currentStr.trim());
        lines.push(row);
    }
    return lines;
}

// Fetch Portfolio Data
async function fetchPortfolioData() {
    try {
        const response = await fetch(csvUrlPorto);
        const dataText = await response.text();
        const parsedRows = parseCSV(dataText);

        const validRows = parsedRows.filter(row => row.some(cell => cell.trim() !== ''));
        const dataRows = validRows.length > 1 ? validRows.slice(1) : validRows;

        globalData = dataRows.map((row, index) => {
            const rawImages = row[6] || '';
            const imageList = rawImages.split(/,|\n/)
                .map(img => fixDriveUrl(img))
                .filter(Boolean);

            const rawLinks = row[3] || '';
            const linkList = rawLinks.split(/,|\n/)
                .map(link => link.trim())
                .filter(link => link && link !== '#');

            return {
                id: index,
                judul: row[0] || 'Untitled Project',
                kategori: row[1] || 'Credential',
                deskripsi: row[2] || '',
                links: linkList,
                primary_link: linkList[0] || '#',
                tipe_file: row[4] || 'Document',
                tanggal: row[5] || '',
                images: imageList,
                primary_image: imageList[0] || ''
            };
        });

        renderFilters(globalData);
        renderCards(globalData);
        updateLiveMetrics(globalData);

        // 🔗 DEEP LINKING: Otomatis buka modal jika URL mengandung hash (#item-X)
        const hash = window.location.hash;
        if (hash && hash.startsWith('#item-')) {
            const itemId = parseInt(hash.replace('#item-', ''), 10);
            if (!isNaN(itemId)) {
                setTimeout(() => openModal(itemId), 400);
            }
        }

    } catch (error) {
        console.error('Error fetching portfolio:', error);
        document.getElementById('portfolio-grid').innerHTML =
            `<div class="empty-state">Unable to load dynamic credentials right now.</div>`;
    }
}

// Fetch Experience Data
async function fetchExperienceData() {
    try {
        const response = await fetch(csvUrlExp);
        const dataText = await response.text();
        const parsedRows = parseCSV(dataText);

        const validRows = parsedRows.filter(row => row.some(cell => cell.trim() !== ''));
        const dataRows = validRows.length > 1 ? validRows.slice(1) : validRows;

        if (dataRows.length === 0) {
            document.getElementById('experience-grid').innerHTML =
                `<div style="color: var(--text-muted); padding: 1rem;">No experience data available.</div>`;
            return;
        }

        const experiences = dataRows.map(row => {
            let bulletPoints = [];
            if (row[3]) bulletPoints.push(row[3]);
            if (row[4]) bulletPoints.push(row[4]);
            if (row[5]) bulletPoints.push(row[5]);

            return {
                posisi: row[0] || 'Position',
                perusahaan: row[1] || 'Company/Organization',
                periode: row[2] || '',
                poin: bulletPoints
            };
        });

        renderExperience(experiences);

    } catch (error) {
        console.warn('Experience fetch error:', error);
        const expGrid = document.getElementById('experience-grid');
        if (expGrid) {
            expGrid.innerHTML = `<div style="color: var(--text-muted); padding: 1rem;">Unable to load experience data right now.</div>`;
        }
    }
}

function renderExperience(data) {
    const expGrid = document.getElementById('experience-grid');
    if (!expGrid || !data || data.length === 0) return;

    expGrid.innerHTML = data.map((item, index) => {
        const hasMore = item.poin.length > 2;
        return `
            <div class="card">
                <div>
                    <div class="card-header-flex">
                        <span class="card-tag">${item.posisi}</span>
                        <span class="card-date">${item.periode}</span>
                    </div>
                    <h3 class="card-title">${item.perusahaan}</h3>
                    <ul class="bullet-list collapsed" id="exp-list-${index}">
                        ${item.poin.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                    ${hasMore ? `
                        <button class="btn-toggle-exp" onclick="toggleExpList(${index}, this)">
                            <span>Show details (${item.poin.length - 2}+)</span> <i class="fa-solid fa-chevron-down"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function toggleExpList(index, btn) {
    const list = document.getElementById(`exp-list-${index}`);
    if (!list) return;

    const isCollapsed = list.classList.toggle('collapsed');
    const totalPoin = list.querySelectorAll('li').length;

    btn.querySelector('span').textContent = isCollapsed ? `Show details (${totalPoin - 2}+)` : 'Show less';
    btn.querySelector('i').className = isCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
}

function renderFilters(data) {
    const categories = ['All', ...new Set(data.map(item => item.kategori).filter(Boolean))];
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    filterContainer.innerHTML = categories.map(cat =>
        `<button class="filter-btn ${cat === 'All' ? 'active' : ''}" onclick="filterCategory('${cat}', this)">${cat}</button>`
    ).join('');
}

function filterCategory(category, element) {
    activeCategory = category;
    if (element) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    }
    const searchVal = document.getElementById('search-input')?.value || '';
    filterAndSearch(searchVal);
}

function filterAndSearch(searchVal = '') {
    let filtered = globalData;

    if (activeCategory !== 'All') {
        filtered = filtered.filter(item => item.kategori === activeCategory);
    }

    if (searchVal.trim() !== '') {
        const query = searchVal.toLowerCase();
        filtered = filtered.filter(item =>
            item.judul.toLowerCase().includes(query) ||
            item.deskripsi.toLowerCase().includes(query) ||
            item.kategori.toLowerCase().includes(query)
        );
    }

    renderCards(filtered);
}

function renderCards(data) {
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    if (data.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No credentials match your search.</div>`;
        return;
    }

    grid.innerHTML = data.map(item => {
        let iconClass = 'fa-arrow-up-right-from-square';
        const tipe = (item.tipe_file || '').toLowerCase();
        if (tipe.includes('pdf')) iconClass = 'fa-file-pdf';
        else if (tipe.includes('gambar') || tipe.includes('foto') || tipe.includes('image')) iconClass = 'fa-image';
        else if (tipe.includes('link') || tipe.includes('web') || tipe.includes('github')) iconClass = 'fa-globe';

        let badgesHTML = '';
        if (item.images.length > 1 || item.links.length > 1) {
            badgesHTML = `<div style="position: absolute; bottom: 8px; right: 8px; display: flex; gap: 0.4rem;">`;
            if (item.images.length > 1) {
                badgesHTML += `<span class="image-count-badge"><i class="fa-solid fa-layer-group"></i> ${item.images.length} Media</span>`;
            }
            if (item.links.length > 1) {
                badgesHTML += `<span class="image-count-badge" style="border-color: rgba(56, 189, 248, 0.4); color: #38BDF8;"><i class="fa-solid fa-file-pdf"></i> ${item.links.length} Files</span>`;
            }
            badgesHTML += `</div>`;
        }

        const imageElement = item.primary_image ?
            `<div class="card-img-wrapper">
                <img src="${item.primary_image}" alt="${item.judul}" loading="lazy">
                ${badgesHTML}
             </div>` : '';

        const documentBtnHTML = (item.primary_link && item.primary_link !== '#') ? `
            <a href="${item.primary_link}" target="_blank" rel="noopener noreferrer" class="btn-action btn-card-compact">
                <i class="fa-solid ${iconClass}"></i> Document
            </a>
        ` : '';

        return `
            <div class="card">
                <div>
                    ${imageElement}
                    <div class="card-header-flex">
                        <span class="card-tag">${item.kategori}</span>
                        <span class="card-date">${item.tanggal}</span>
                    </div>
                    <h3 class="card-title">${item.judul}</h3>
                    <p class="card-body">${item.deskripsi}</p>
                </div>
                <div class="card-actions-row">
                    <button onclick="openModal(${item.id})" class="btn-action btn-card-compact" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #F8FAFC;">
                        <i class="fa-solid fa-eye"></i> Preview
                    </button>
                    ${documentBtnHTML}
                </div>
            </div>
        `;
    }).join('');
}

// 🍱 MCKINSEY-STYLE BENTO BOX MODAL QUICK VIEW LOGIC
function openModal(id) {
    const item = globalData.find(d => Number(d.id) === Number(id));
    if (!item) return;

    trackEvent('view_credential_detail', 'Portfolio', item.judul || 'Untitled');

    currentModalImages = item.images || [];
    currentImageIndex = 0;

    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    const fallbackImg = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";

    let imageCarouselHTML = '';
    if (currentModalImages.length > 0) {
        const hasControls = currentModalImages.length > 1;
        imageCarouselHTML = `
            <div class="carousel-container">
                <img id="carousel-img" src="${currentModalImages[0]}" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="Preview Asset">
                ${hasControls ? `
                    <button class="carousel-btn prev" onclick="changeImage(-1)" aria-label="Previous Image"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="carousel-btn next" onclick="changeImage(1)" aria-label="Next Image"><i class="fa-solid fa-chevron-right"></i></button>
                    <div class="carousel-counter" id="carousel-counter">1 / ${currentModalImages.length}</div>
                ` : ''}
            </div>
            ${hasControls ? `
                <div class="carousel-thumbnails">
                    ${currentModalImages.map((img, idx) => `
                        <img src="${img}" class="thumb ${idx === 0 ? 'active' : ''}" onclick="setImageIndex(${idx})" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="Thumbnail ${idx + 1}">
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    const linksList = (item.links || []).filter(link => link && link !== '#');

    const pdfButtonsHTML = linksList.length > 0 ? linksList.map((link, idx) => {
        const lowerLink = link.toLowerCase();
        const lowerCat = (item.kategori || '').toLowerCase();

        // Indikator otomatis apakah ini sertifikat/badge
        const isBadge = lowerLink.includes('badge') ||
            lowerLink.includes('cert') ||
            lowerLink.includes('verify') ||
            lowerCat.includes('certif') ||
            lowerCat.includes('credential');

        const iconClass = isBadge ? 'fa-award' : 'fa-file-pdf';

        // Ekstrak nama platform otomatis dari URL (Dicoding, Forage, Coursera, dll)
        const platform = getPlatformName(link);
        let labelText = isBadge ? 'View Digital Badge / Certificate' : 'View Document File';

        if (platform) {
            const platformLower = platform.toLowerCase();
            // Khusus cloud storage, tampilkan label dokumen bersih
            if (platformLower === 'drive' || platformLower === 'docs' || platformLower === 'dropbox') {
                labelText = 'View Document File';
            } else {
                labelText = isBadge ? `View ${platform} Credential` : `View ${platform} Document`;
            }
        }

        if (linksList.length > 1) labelText += ` #${idx + 1}`;

        return `
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn-action" style="width: 100%; justify-content: flex-start; margin-bottom: 0.4rem; background: rgba(129, 140, 248, 0.12); border: 1px solid rgba(129, 140, 248, 0.35); color: #FFF; font-size: 0.82rem;">
                <i class="fa-solid ${iconClass}" style="color: var(--accent); margin-right: 0.5rem;"></i> ${labelText}
                <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem; margin-left: auto;"></i>
            </a>
        `;
    }).join('') : '<p style="font-size: 0.8rem; color: var(--text-muted);">No attached document or badge link available.</p>';

    modalContent.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 1rem; padding-bottom: 0.6rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #FF5F56; display: inline-block;"></span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #FFBD2E; display: inline-block;"></span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #27C93F; display: inline-block;"></span>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem; font-family: monospace;">Portfolio Detail Hub</span>
        </div>

        <div class="card-tag" style="margin-bottom: 0.3rem;">${item.kategori || 'Credential'} • ${item.tanggal || ''}</div>
        <h2 style="font-family: 'Syne', sans-serif; font-size: 1.35rem; margin-bottom: 0.75rem; color: #FFFFFF;">${item.judul || 'Untitled Project'}</h2>
        
        <div class="bento-grid">
            <div class="bento-card ${currentModalImages.length > 0 ? '' : 'bento-full'}">
                <div class="bento-title"><i class="fa-solid fa-align-left"></i> Overview</div>
                <p style="color: var(--text-muted); font-size: 0.86rem; line-height: 1.6;">${item.deskripsi || 'No description provided.'}</p>
            </div>

            ${currentModalImages.length > 0 ? `
                <div class="bento-card">
                    <div class="bento-title"><i class="fa-solid fa-image"></i> Visual Asset</div>
                    ${imageCarouselHTML}
                </div>
            ` : ''}

            <div class="bento-card bento-full">
                <div class="bento-title"><i class="fa-solid fa-folder-open"></i> Key Deliverables & Documents (${linksList.length})</div>
                ${pdfButtonsHTML}
            </div>
        </div>
    `;

    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
    }

    history.replaceState(null, null, `#item-${id}`);
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    document.body.style.overflow = 'auto';

    history.replaceState(null, null, window.location.pathname);
}

document.getElementById('project-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

function changeImage(direction) {
    if (currentModalImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + direction + currentModalImages.length) % currentModalImages.length;
    updateCarouselDisplay();
}

function setImageIndex(index) {
    currentImageIndex = index;
    updateCarouselDisplay();
}

function updateCarouselDisplay() {
    const imgEl = document.getElementById('carousel-img');
    const counterEl = document.getElementById('carousel-counter');
    if (imgEl) imgEl.src = currentModalImages[currentImageIndex];
    if (counterEl) counterEl.textContent = `${currentImageIndex + 1} / ${currentModalImages.length}`;

    document.querySelectorAll('.carousel-thumbnails .thumb').forEach((thumb, idx) => {
        if (idx === currentImageIndex) thumb.classList.add('active');
        else thumb.classList.remove('active');
    });
}

function scrollPortfolio(direction) {
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;
    const scrollAmount = 350 * direction;
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

// 📩 DIRECT CONTACT MODAL CONTROLLER
function openContactModal() {
    const modal = document.getElementById('contact-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
    trackEvent('open_contact_form', 'Engagement', 'Contact Modal Opened');
}

function closeContactModal() {
    const modal = document.getElementById('contact-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
    document.body.style.overflow = 'auto';
}

document.getElementById('contact-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeContactModal();
    }
});

// Submit Form Handler
document.getElementById('contact-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn = document.getElementById('contact-submit-btn');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = `<span>Sending...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;
    submitBtn.disabled = true;

    try {
        const formData = new FormData(this);
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            closeContactModal();
            this.reset();
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = "Message sent successfully! Diah Pramesti will reply soon. ✨";
                showToast();
            }
            trackEvent('send_message_success', 'Contact', 'Direct Message Sent');
        } else {
            alert('Failed to send message: ' + result.message);
        }
    } catch (error) {
        console.error('Contact Form Error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// 📊 DYNAMIC SKILLS & CHART.JS FROM GOOGLE SHEETS
async function fetchSkillsData() {
    try {
        const response = await fetch(csvUrlSkills);
        const dataText = await response.text();
        const parsedRows = parseCSV(dataText);

        const validRows = parsedRows.filter(row => row.some(cell => cell.trim() !== ''));
        const dataRows = validRows.length > 1 ? validRows.slice(1) : validRows;

        if (dataRows.length === 0) return;

        const skillsData = dataRows.map(row => ({
            name: row[0] || 'Skill',
            category: row[1] || 'General',
            proficiency: parseInt(row[2], 10) || 80,
            icon: row[3] || 'fa-check'
        }));

        renderSkillPills(skillsData);
        renderDynamicChart(skillsData);

    } catch (error) {
        console.warn('Skills fetch error:', error);
    }
}

function renderSkillPills(skills) {
    const container = document.getElementById('skills-dynamic-container');
    if (!container || !skills || skills.length === 0) return;

    const categories = {};
    skills.forEach(s => {
        const catName = s.category || 'General Competencies';
        if (!categories[catName]) {
            categories[catName] = [];
        }
        categories[catName].push(s);
    });

    container.innerHTML = Object.keys(categories).map(catName => {
        const categorySkills = categories[catName];
        let iconHeader = 'fa-briefcase';
        if (catName.toLowerCase().includes('data')) iconHeader = 'fa-chart-line';
        else if (catName.toLowerCase().includes('market')) iconHeader = 'fa-bullhorn';
        else if (catName.toLowerCase().includes('design')) iconHeader = 'fa-palette';

        return `
            <div class="card">
                <div>
                    <div class="card-header-flex">
                        <span class="card-tag"><i class="fa-solid ${iconHeader}"></i> ${catName}</span>
                    </div>
                    <h3 class="card-title">${catName}</h3>
                    <div class="skills-wrapper">
                        ${categorySkills.map(s => `<span class="tag-pill"><i class="fa-solid ${s.icon}"></i> ${s.name}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderDynamicChart(skills) {
    const ctx = document.getElementById('competencyChart')?.getContext('2d');
    if (!ctx) return;

    if (competencyChartInstance) {
        competencyChartInstance.destroy();
    }

    const chartSkills = skills.slice(0, 6);
    const labels = chartSkills.map(s => s.name);
    const chartValues = chartSkills.map(s => s.proficiency);

    competencyChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Proficiency Level (%)',
                data: chartValues,
                backgroundColor: 'rgba(129, 140, 248, 0.25)',
                borderColor: '#818CF8',
                borderWidth: 2,
                pointBackgroundColor: '#38BDF8',
                pointBorderColor: '#FFFFFF',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.12)' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    pointLabels: {
                        color: '#94A3B8',
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' }
                    },
                    ticks: { display: false, max: 100, min: 0 }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(18, 24, 38, 0.9)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#A5B4FC',
                    borderColor: 'rgba(129, 140, 248, 0.4)',
                    borderWidth: 1,
                    padding: 10
                }
            }
        }
    });
}

// Back to top
document.addEventListener('DOMContentLoaded', () => {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Auto-close Mobile Menu
document.addEventListener('click', (e) => {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.getElementById('menuToggle');
    if (!navLinks || !menuToggle) return;

    if (navLinks.classList.contains('active') &&
        !navLinks.contains(e.target) &&
        !menuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});

// 🎨 DYNAMIC ACCENT COLOR CUSTOMIZER LOGIC
function initColorCustomizer() {
    const colorDots = document.querySelectorAll('.color-dot');
    const savedColor = localStorage.getItem('portfolio_accent_color');
    const savedGlow = localStorage.getItem('portfolio_accent_glow');

    if (savedColor && savedGlow) {
        applyAccentColor(savedColor, savedGlow);
        colorDots.forEach(dot => {
            if (dot.getAttribute('data-color') === savedColor) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.getAttribute('data-color');
            const glow = dot.getAttribute('data-glow');

            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');

            applyAccentColor(color, glow);
            localStorage.setItem('portfolio_accent_color', color);
            localStorage.setItem('portfolio_accent_glow', glow);

            trackEvent('change_accent_color', 'Customization', color);
        });
    });
}

function applyAccentColor(color, glow) {
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-glow', glow);
    document.documentElement.style.setProperty('--border-hover', color);
}

// ⏰ DYNAMIC TIME-BASED GREETING IN HERO BADGE
function initDynamicGreeting() {
    const badge = document.querySelector('.badge-status');
    if (!badge) return;

    const hour = new Date().getHours();
    let greeting = 'Open for Entry-Level Roles & Collaborative Projects';

    if (hour >= 5 && hour < 12) {
        greeting = '☕ Good Morning! Open for Entry-Level Roles & Projects';
    } else if (hour >= 12 && hour < 18) {
        greeting = '🌤️ Good Afternoon! Open for Entry-Level Roles & Projects';
    } else {
        greeting = '🌙 Good Evening! Open for Entry-Level Roles & Projects';
    }

    badge.innerHTML = `<span class="status-dot"></span> ${greeting}`;
}

// 💬 DYNAMIC RECRUITER FAQ FROM GOOGLE SHEETS
let dynamicFaqData = [
    {
        question: "⚡ Current Availability?",
        answer: "Ready for immediate onboarding in entry-level roles across Business Operations, Administration, and Digital Support."
    },
    {
        question: "🎯 Core Capabilities?",
        answer: "Detail-oriented admin work, clean spreadsheet reporting in Excel & Power BI, and reliable daily teamwork."
    },
    {
        question: "🎓 Academic Foundation?",
        answer: "Diploma (D3) in International Business from Universitas Jenderal Soedirman with a 3.70 GPA."
    },
    {
        question: "📩 Best Way to Connect?",
        answer: "Feel free to click 'Request Resume' above, send a direct message via the contact form below, or reach out on LinkedIn."
    }
];

async function fetchFaqData() {
    renderRecruiterFAQ();

    try {
        const response = await fetch(csvUrlFaq);
        if (!response.ok) throw new Error("Sheet response not OK");

        const dataText = await response.text();
        if (dataText.includes("<!DOCTYPE html>") || dataText.includes("<html")) {
            throw new Error("Returned HTML page instead of CSV");
        }

        const parsedRows = parseCSV(dataText);
        const validRows = parsedRows.filter(row => row.some(cell => cell.trim() !== ''));
        const dataRows = validRows.length > 1 ? validRows.slice(1) : validRows;

        if (dataRows.length > 0) {
            dynamicFaqData = dataRows.map(row => ({
                question: row[0] || 'Question',
                answer: row[1] || 'Answer'
            }));
            renderRecruiterFAQ();
        }
    } catch (error) {
        console.warn('FAQ sheet using fallback data:', error);
    }
}

function renderRecruiterFAQ() {
    const container = document.getElementById('faq-buttons');
    if (!container || dynamicFaqData.length === 0) return;

    container.innerHTML = dynamicFaqData.map((item, idx) => `
        <button class="faq-btn ${idx === 0 ? 'active' : ''}" onclick="showFaqAnswer(${idx}, this)">
            ${item.question}
        </button>
    `).join('');

    showFaqAnswer(0, container.querySelector('.faq-btn'));
}

function showFaqAnswer(index, btn) {
    const answerText = document.getElementById('faq-answer-text');
    if (!answerText || !dynamicFaqData[index]) return;

    document.querySelectorAll('.faq-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    answerText.style.opacity = '0';
    setTimeout(() => {
        answerText.innerHTML = dynamicFaqData[index].answer;
        answerText.style.opacity = '1';
    }, 150);

    trackEvent('click_faq', 'Engagement', dynamicFaqData[index].question);
}

// 🔢 AUTO-CALCULATED LIVE METRICS WITH STRICT CATEGORY FILTER
function updateLiveMetrics(data) {
    if (!data || data.length === 0) return;

    const certCount = data.filter(item => {
        const cat = (item.kategori || '').toLowerCase();
        return cat.includes('certif') || cat.includes('credential') || cat.includes('sertifikat') || cat.includes('badge');
    }).length;

    const pureProjectCount = data.filter(item => {
        const cat = (item.kategori || '').toLowerCase();
        return cat.includes('project') || cat.includes('karya') || cat.includes('case') || cat.includes('study') || cat.includes('work');
    }).length;

    animateCounter('metric-cert-count', certCount > 0 ? certCount : 2);
    animateCounter('metric-project-count', pureProjectCount > 0 ? pureProjectCount : 1);
}

// ⏱️ FUNGSI ANIMASI PUTARAN ANGKA (COUNT-UP)
function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let start = 0;
    const duration = 1200;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = targetValue / steps;

    const timer = setInterval(() => {
        start += increment;
        if (start >= targetValue) {
            el.textContent = targetValue;
            clearInterval(timer);
        } else {
            el.textContent = Math.floor(start);
        }
    }, stepTime);
}