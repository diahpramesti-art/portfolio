// 🌐 HELPER OTOMATIS: EKSTRAK NAMA PLATFORM DARI DOMAIN URL
function getPlatformName(url) {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        const brand = hostname.split('.')[0];
        if (!brand) return '';
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    } catch (e) {
        return '';
    }
}

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

// 🔒 HELPER SCROLL LOCK BACKGROUND (MEMPROSASI SEMENTARA POSISI SCROLL DENGAN PRESISI SEHINGGA TIDAK AKAN LOMPAT KE ATAS)
let savedScrollPosition = 0;

function toggleBodyScroll(disable) {
    if (disable) {
        savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollPosition}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    } else {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
        } else {
            window.scrollTo(0, savedScrollPosition);
        }
    }
}

// 🖼️ CAROUSEL GAMBAR MODAL
function changeImage(step) {
    if (!currentModalImages || currentModalImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + step + currentModalImages.length) % currentModalImages.length;

    const imgEl = document.getElementById('modal-img-display');
    const counterEl = document.getElementById('modal-img-counter');

    if (imgEl) imgEl.src = currentModalImages[currentImageIndex];
    if (counterEl) counterEl.textContent = `${currentImageIndex + 1} / ${currentModalImages.length}`;
}

// CSV Configuration (Portofolio, Pengalaman & Skill dari Google Sheets)
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

    // Mobile Nav
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // Scrollspy active nav link
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

    // Copy Email Event
    const copyBtn = document.getElementById('copy-email-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText('hi.diahpramesti@gmail.com');
            showToast();
            trackEvent('copy_email', 'Contact', 'Email Copied');
        });
    }

    // Keyboard Controller
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

    // SHORTCUT TUTUP MODAL KLIK PADA AREA OUTSIDE / BACKDROP
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
                closeContactModal();
            }
        });
    });

    // Fetch All Dynamic Data from Google Sheets
    fetchPortfolioData();
    fetchExperienceData();
    fetchSkillsData();
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

// Fetch Portfolio Data dari Google Sheets
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

    } catch (error) {
        console.error('Error fetching portfolio:', error);
        document.getElementById('portfolio-grid').innerHTML =
            `<div style="color: var(--text-muted);">Unable to load credentials right now.</div>`;
    }
}

// Fetch Experience Data dari Google Sheets
async function fetchExperienceData() {
    try {
        const response = await fetch(csvUrlExp);
        const dataText = await response.text();
        const parsedRows = parseCSV(dataText);

        const validRows = parsedRows.filter(row => row.some(cell => cell.trim() !== ''));
        const dataRows = validRows.length > 1 ? validRows.slice(1) : validRows;

        if (dataRows.length === 0) return;

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
        grid.innerHTML = `<div style="color: var(--text-muted); padding: 2rem;">No credentials match your search.</div>`;
        return;
    }

    grid.innerHTML = data.map(item => {
        let iconClass = 'fa-arrow-up-right-from-square';
        const tipe = (item.tipe_file || '').toLowerCase();
        if (tipe.includes('pdf')) iconClass = 'fa-file-pdf';
        else if (tipe.includes('gambar') || tipe.includes('foto') || tipe.includes('image')) iconClass = 'fa-image';
        else if (tipe.includes('link') || tipe.includes('web') || tipe.includes('github')) iconClass = 'fa-globe';

        const imageElement = item.primary_image ?
            `<div class="card-img-wrapper">
                <img src="${item.primary_image}" alt="${item.judul}" loading="lazy">
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
                    <button onclick="openModal(${item.id})" class="btn-action btn-card-compact btn-secondary">
                        <i class="fa-solid fa-eye"></i> Preview
                    </button>
                    ${documentBtnHTML}
                </div>
            </div>
        `;
    }).join('');
}

// QUICK VIEW MODAL
function openModal(id) {
    const item = globalData.find(d => Number(d.id) === Number(id));
    if (!item) return;

    currentModalImages = item.images || [];
    currentImageIndex = 0;

    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;

    let galleryHTML = '';
    if (currentModalImages.length > 0) {
        const hasMultiple = currentModalImages.length > 1;
        galleryHTML = `
            <div class="modal-gallery-wrapper">
                <img id="modal-img-display" src="${currentModalImages[0]}" alt="${item.judul}">
                ${hasMultiple ? `
                    <button class="modal-nav-btn prev" onclick="changeImage(-1)" aria-label="Previous Image"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="modal-nav-btn next" onclick="changeImage(1)" aria-label="Next Image"><i class="fa-solid fa-chevron-right"></i></button>
                    <div class="modal-img-counter" id="modal-img-counter">1 / ${currentModalImages.length}</div>
                ` : ''}
            </div>
        `;
    }

    const linksList = (item.links || []).filter(link => link && link !== '#');

    const pdfButtonsHTML = linksList.length > 0 ? linksList.map((link, idx) => {
        const platform = getPlatformName(link);
        let labelText = platform ? `View ${platform} Document` : 'View Document File';
        if (linksList.length > 1) labelText += ` #${idx + 1}`;

        return `
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn-action" style="width: 100%; justify-content: space-between; margin-bottom: 0.4rem; background: #EFF6FF; border: 1px solid #DBEAFE; color: #1E40AF !important; font-size: 0.82rem;">
                <span><i class="fa-solid fa-file-pdf" style="color: #1E40AF; margin-right: 0.5rem;"></i> ${labelText}</span>
                <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
            </a>
        `;
    }).join('') : '<p style="font-size: 0.8rem; color: var(--text-muted);">No attached document link available.</p>';

    modalContent.innerHTML = `
        ${galleryHTML}
        <div class="card-tag" style="margin-bottom: 0.3rem;">${item.kategori || 'Credential'} • ${item.tanggal || ''}</div>
        <h2 style="font-family: 'Syne', sans-serif; font-size: 1.35rem; margin-bottom: 0.75rem; color: var(--text-main);">${item.judul || 'Untitled Project'}</h2>
        
        <p style="color: var(--text-muted); font-size: 0.86rem; line-height: 1.6; margin-bottom: 1.25rem;">${item.deskripsi || 'No description provided.'}</p>

        <div style="margin-top: 1rem;">
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 0.6rem;">Key Deliverables & Documents</div>
            ${pdfButtonsHTML}
        </div>
    `;

    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        toggleBodyScroll(true);
    }
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    toggleBodyScroll(false);
}

function scrollPortfolio(direction) {
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;
    grid.scrollBy({ left: 330 * direction, behavior: 'smooth' });
}

// CONTACT MODAL
function openContactModal() {
    const modal = document.getElementById('contact-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    toggleBodyScroll(true);
}

function closeContactModal() {
    const modal = document.getElementById('contact-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
    toggleBodyScroll(false);
}

// Submit Form Handler
document.getElementById('contact-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn = document.getElementById('contact-submit-btn');
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
            showToast();
        } else {
            alert('Failed to send message: ' + result.message);
        }
    } catch (error) {
        console.error('Contact Form Error:', error);
    } finally {
        submitBtn.disabled = false;
    }
});

// Fetch Skills Data dari Google Sheets
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
            icon: row[3] || 'fa-check'
        }));

        renderSkillPills(skillsData);

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
        if (!categories[catName]) categories[catName] = [];
        categories[catName].push(s);
    });

    container.innerHTML = Object.keys(categories).map(catName => {
        const categorySkills = categories[catName];
        let iconHeader = 'fa-briefcase';
        if (catName.toLowerCase().includes('data')) iconHeader = 'fa-chart-line';
        else if (catName.toLowerCase().includes('market')) iconHeader = 'fa-bullhorn';

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

// Back to Top Listener
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// Dynamic Greeting
function initDynamicGreeting() {
    const badge = document.querySelector('.badge-status');
    if (!badge) return;

    const hour = new Date().getHours();
    let greeting = 'Open for Entry-Level Roles & Projects';

    if (hour >= 5 && hour < 12) greeting = '☕ Good Morning! Open for Roles & Projects';
    else if (hour >= 12 && hour < 18) greeting = '🌤️ Good Afternoon! Open for Roles & Projects';
    else greeting = '🌙 Good Evening! Open for Roles & Projects';

    badge.innerHTML = `<span class="status-dot"></span> ${greeting}`;
}

// Recruiter FAQ dari Google Sheets
let dynamicFaqData = [
    { question: "⚡ Current Availability?", answer: "Ready for immediate onboarding in entry-level roles across Business Operations, Administration, and Digital Support." },
    { question: "🎯 Core Capabilities?", answer: "Detail-oriented admin work, clean spreadsheet reporting in Excel & Power BI, and reliable daily teamwork." },
    { question: "🎓 Academic Foundation?", answer: "Diploma (D3) in International Business from Universitas Jenderal Soedirman with a 3.70 GPA." }
];

async function fetchFaqData() {
    renderRecruiterFAQ();

    try {
        const response = await fetch(csvUrlFaq);
        if (!response.ok) return;

        const dataText = await response.text();
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
        console.warn('FAQ fetch error:', error);
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

    answerText.innerHTML = dynamicFaqData[index].answer;
}

// Counter Animation
function updateLiveMetrics(data) {
    if (!data || data.length === 0) return;

    const certCount = data.filter(item => {
        const cat = (item.kategori || '').toLowerCase();
        return cat.includes('certif') || cat.includes('credential') || cat.includes('sertifikat');
    }).length;

    const pureProjectCount = data.filter(item => {
        const cat = (item.kategori || '').toLowerCase();
        return cat.includes('project') || cat.includes('karya') || cat.includes('work');
    }).length;

    animateCounter('metric-cert-count', certCount > 0 ? certCount : 2);
    animateCounter('metric-project-count', pureProjectCount > 0 ? pureProjectCount : 1);
}

function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let start = 0;
    const duration = 1000;
    const stepTime = 30;
    const increment = targetValue / (duration / stepTime);

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