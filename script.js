// CSV Configuration
const sheetPubId = "e/2PACX-1vQrpOGyzYSWarEcCUEPGi8EOYKUON0y6tHETBDCcx9lgVWHWz2CxY2655V8xWGJWs-cK8Ayt0Vmt92t";
const expGid = "1489099062";

const csvUrlPorto = `https://docs.google.com/spreadsheets/d/${sheetPubId}/pub?output=csv`;
const csvUrlExp = `https://docs.google.com/spreadsheets/d/${sheetPubId}/pub?gid=${expGid}&single=true&output=csv`;

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
        });
    }

    fetchPortfolioData();
    fetchExperienceData();
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
        let nextChar = text[i+1];

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
            // Split Multiple Image URLs
            const rawImages = row[6] || '';
            const imageList = rawImages.split(/,|\n/).map(img => img.trim()).filter(Boolean);

            // Split Multiple File / PDF Links
            const rawLinks = row[3] || '#';
            const linkList = rawLinks.split(/,|\n/).map(link => link.trim()).filter(Boolean);

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
        console.warn('Experience fetch active fallback mode');
    }
}

function renderExperience(data) {
    const expGrid = document.getElementById('experience-grid');
    if (!expGrid || !data || data.length === 0) return;

    expGrid.innerHTML = data.map(item => `
        <div class="card">
            <div>
                <div class="card-header-flex">
                    <span class="card-tag">${item.posisi}</span>
                    <span class="card-date">${item.periode}</span>
                </div>
                <h3 class="card-title">${item.perusahaan}</h3>
                <ul class="bullet-list">
                    ${item.poin.map(p => `<li>${p}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
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
        const tipe = item.tipe_file.toLowerCase();
        if (tipe.includes('pdf')) iconClass = 'fa-file-pdf';
        else if (tipe.includes('gambar') || tipe.includes('foto') || tipe.includes('image')) iconClass = 'fa-image';
        else if (tipe.includes('link') || tipe.includes('web') || tipe.includes('github')) iconClass = 'fa-globe';

        // Badges for Multiple Media and PDFs
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
            `<div style="position: relative; margin-bottom: 1.2rem; overflow: hidden; border-radius: 12px; border: 1px solid var(--border); max-height: 180px;">
                <img src="${item.primary_image}" alt="${item.judul}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.style.display='none'">
                ${badgesHTML}
             </div>` : '';

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
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
                    <button onclick="openModal(${item.id})" class="btn-action" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.25); color: #F8FAFC; font-size: 0.8rem; padding: 0.5rem 0.9rem;">
                        Quick Preview <i class="fa-solid fa-eye"></i>
                    </button>
                    <a href="${item.primary_link}" target="_blank" rel="noopener noreferrer" class="btn-action" style="font-size: 0.8rem; padding: 0.5rem 0.9rem;">
                        View Document <i class="fa-solid ${iconClass}"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Modal Quick View, Multi-Image Carousel & Multi-PDF List Logic
function openModal(id) {
    const item = globalData.find(d => d.id === id);
    if (!item) return;

    currentModalImages = item.images || [];
    currentImageIndex = 0;

    const modalContent = document.getElementById('modal-content');
    
    // 1. Generate Image Carousel
    let imageCarouselHTML = '';
    if (currentModalImages.length > 0) {
        const hasControls = currentModalImages.length > 1;
        imageCarouselHTML = `
            <div class="carousel-container">
                <img id="carousel-img" src="${currentModalImages[0]}" alt="${item.judul}">
                ${hasControls ? `
                    <button class="carousel-btn prev" onclick="changeImage(-1)"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="carousel-btn next" onclick="changeImage(1)"><i class="fa-solid fa-chevron-right"></i></button>
                    <div class="carousel-counter" id="carousel-counter">1 / ${currentModalImages.length}</div>
                ` : ''}
            </div>
            ${hasControls ? `
                <div class="carousel-thumbnails">
                    ${currentModalImages.map((img, idx) => `
                        <img src="${img}" class="thumb ${idx === 0 ? 'active' : ''}" onclick="setImageIndex(${idx})">
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    // 2. Generate PDF Buttons
    const pdfButtonsHTML = item.links.map((link, idx) => `
        <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn-action" style="width: 100%; justify-content: flex-start; margin-bottom: 0.5rem; background: rgba(129, 140, 248, 0.12); border: 1px solid rgba(129, 140, 248, 0.35); color: #FFF; font-size: 0.85rem;">
            <i class="fa-solid fa-file-pdf" style="color: var(--accent); margin-right: 0.5rem;"></i> View Document / Certificate #${idx + 1}
            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem; margin-left: auto;"></i>
        </a>
    `).join('');

    // 3. Render Modal Content with macOS Window Bar
    modalContent.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 1.2rem; padding-bottom: 0.8rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #FF5F56; display: inline-block;"></span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #FFBD2E; display: inline-block;"></span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #27C93F; display: inline-block;"></span>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem; font-family: monospace;">preview_vault.exe</span>
        </div>

        <div class="card-tag" style="margin-bottom: 0.5rem;">${item.kategori} • ${item.tanggal}</div>
        <h2 style="font-family: 'Syne', sans-serif; font-size: 1.4rem; margin-bottom: 1rem; color: #FFFFFF;">${item.judul}</h2>
        
        ${imageCarouselHTML}
        
        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.25rem; margin-top: 1rem;">${item.deskripsi}</p>
        
        <div style="margin-top: 1rem;">
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em;">
                Attached Document Files (${item.links.length}):
            </div>
            ${pdfButtonsHTML}
        </div>
    `;

    document.getElementById('project-modal').style.display = 'flex';
}

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

function closeModal() {
    document.getElementById('project-modal').style.display = 'none';
}
