// CSV Configuration
const sheetPubId = "e/2PACX-1vQrpOGyzYSWarEcCUEPGi8EOYKUON0y6tHETBDCcx9lgVWHWz2CxY2655V8xWGJWs-cK8Ayt0Vmt92t";
const expGid = "1489099062";

const csvUrlPorto = `https://docs.google.com/spreadsheets/d/${sheetPubId}/pub?output=csv`;
const csvUrlExp = `https://docs.google.com/spreadsheets/d/${sheetPubId}/pub?gid=${expGid}&single=true&output=csv`;

let globalData = [];
let activeCategory = 'All';

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
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('hi.diahpramesti@gmail.com');
            showToast();
        });
    }

    fetchPortfolioData();
    fetchExperienceData();
});

function showToast() {
    const toast = document.getElementById('toast');
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

// Fetch Portfolio
async function fetchPortfolioData() {
    try {
        const response = await fetch(csvUrlPorto);
        const dataText = await response.text();
        const parsedRows = parseCSV(dataText);

        const validRows = parsedRows.filter(row => row.some(cell => cell.trim() !== ''));
        const dataRows = validRows.length > 1 ? validRows.slice(1) : validRows;

        globalData = dataRows.map((row, index) => ({
            id: index,
            judul: row[0] || 'Untitled Project',
            kategori: row[1] || 'Credential',
            deskripsi: row[2] || '',
            link_file: row[3] || '#',
            tipe_file: row[4] || 'Document',
            tanggal: row[5] || '',
            image_url: row[6] || ''
        }));

        renderFilters(globalData);
        renderCards(globalData);

    } catch (error) {
        console.error('Error fetching portfolio:', error);
        document.getElementById('portfolio-grid').innerHTML = 
            `<div class="empty-state">Unable to load dynamic credentials right now.</div>`;
    }
}

// Fetch Experience
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
    if (!data || data.length === 0) return;

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
    
    if (data.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No credentials match your search.</div>`;
        return;
    }

    grid.innerHTML = data.map(item => {
        let iconClass = 'fa-arrow-up-right-from-square';
        const tipe = item.tipe_file.toLowerCase();
        if (tipe.includes('pdf')) iconClass = 'fa-file-pdf';
        else if (tipe.includes('gambar') || tipe.includes('foto') || tipe.includes('image')) iconClass = 'fa-image';
        else if (tipe.includes('link') || tipe.includes('web')) iconClass = 'fa-globe';

        const imageElement = item.image_url ? 
            `<div style="margin-bottom: 1.2rem; overflow: hidden; border-radius: 12px; border: 1px solid var(--border); max-height: 180px;">
                <img src="${item.image_url}" alt="${item.judul}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.style.display='none'">
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
                    <a href="${item.link_file}" target="_blank" rel="noopener noreferrer" class="btn-action" style="font-size: 0.8rem; padding: 0.5rem 0.9rem;">
                        View Document <i class="fa-solid ${iconClass}"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Modal Quick View Logic
function openModal(id) {
    const item = globalData.find(d => d.id === id);
    if (!item) return;

    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="card-tag" style="margin-bottom: 0.5rem;">${item.kategori} • ${item.tanggal}</div>
        <h2 style="font-family: 'Syne', sans-serif; font-size: 1.5rem; margin-bottom: 1rem;">${item.judul}</h2>
        
        ${item.image_url ? `<img src="${item.image_url}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 12px; margin-bottom: 1rem;">` : ''}
        
        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">${item.deskripsi}</p>
        
        <a href="${item.link_file}" target="_blank" rel="noopener noreferrer" class="btn-action">
            Open Full Document / External Link <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
    `;

    document.getElementById('project-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('project-modal').style.display = 'none';
}
