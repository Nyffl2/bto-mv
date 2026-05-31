// app.js - Main Client-side Engine for Hentai Kabar (SlothUI Theme)

// Local operational states
let allMovies = [];
let filteredMovies = [];
let currentCategory = 'All';
let searchQuery = '';
let currentPage = 1;
let itemsPerPage = 6;
let noticeData = { text: '', link: '' };

// DOM Reference Selectors
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const noticeBanner = document.getElementById('notice-banner');
const noticeText = document.getElementById('notice-text');
const noticeLink = document.getElementById('notice-link');
const genresContainer = document.getElementById('genres-container');
const moviesLoading = document.getElementById('movies-loading');
const moviesEmpty = document.getElementById('movies-empty');
const moviesGrid = document.getElementById('movies-grid');
const paginationPanel = document.getElementById('pagination-panel');
const paginationInfo = document.getElementById('pagination-info');
const pagePrevBtn = document.getElementById('page-prev-btn');
const pageNextBtn = document.getElementById('page-next-btn');
const pageTriggersContainer = document.getElementById('page-triggers-container');
const catalogueTitle = document.getElementById('catalogue-title');
const catalogueSubtitle = document.getElementById('catalogue-subtitle');

// Limit triggers
const limit3Btn = document.getElementById('limit-3-btn');
const limit6Btn = document.getElementById('limit-6-btn');
const limit12Btn = document.getElementById('limit-12-btn');

// Recent section
const recentPanel = document.getElementById('recent-panel');
const recentList = document.getElementById('recent-list');
const clearRecentBtn = document.getElementById('clear-recent-btn');

// Start up routines
window.addEventListener('DOMContentLoaded', async () => {
  setupLimitControls();
  await loadDatabase();
  setupSearchListener();
  renderRecentlyWatched();
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Load details from videos.json (cached dynamically in public structure)
async function loadDatabase() {
  try {
    const res = await fetch('/videos.json');
    if (!res.ok) throw new Error('Database loading failed');
    const data = await res.json();
    
    allMovies = data.movies || [];
    filteredMovies = [...allMovies];
    
    // Set custom announcement banner text
    if (data.notice) {
      noticeText.textContent = data.notice;
      noticeLink.href = data.notice_link || '#';
      noticeBanner.classList.remove('hidden');
    }
    
    // Initialize genre triggers and movie views
    buildGenreSelectors();
    updateListing();
  } catch (err) {
    console.error('Error fetching catalog dataset:', err);
    catalogueSubtitle.textContent = 'ဇာတ်ကားဒေတာဘေ့စ် မအောင်မြင်ပါ...';
    moviesLoading.classList.add('hidden');
  }
}

// Extract distinct genre tag lists dynamically from parsed records
function buildGenreSelectors() {
  const genres = new Set();
  allMovies.forEach(movie => {
    if (movie.genre) {
      movie.genre.split(',').forEach(g => genres.add(g.trim()));
    }
  });

  const sortedGenres = ['All', ...Array.from(genres).sort()];
  genresContainer.innerHTML = '';

  sortedGenres.forEach(genre => {
    const btn = document.createElement('button');
    btn.className = getGenreBtnClass(genre === currentCategory);
    btn.dataset.genre = genre;
    
    // Add distinct count badge icon for details
    const count = genre === 'All' ? allMovies.length : allMovies.filter(m => m.genre && m.genre.includes(genre)).length;
    btn.innerHTML = `
      <span>${genre === 'All' ? '📌 အသစ်အားလုံး' : `🎬 ${genre}`}</span>
      <span class="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-full text-[#c084fc] font-bold font-mono">${count}</span>
    `;

    btn.addEventListener('click', () => {
      currentCategory = genre;
      currentPage = 1;
      
      // Update UI active layouts
      document.querySelectorAll('#genres-container button').forEach(el => {
        const isCurrent = el.dataset.genre === currentCategory;
        el.className = getGenreBtnClass(isCurrent);
      });

      applyFilters();
    });

    genresContainer.appendChild(btn);
  });
}

function getGenreBtnClass(isActive) {
  const base = "w-full flex items-center justify-between text-left text-xs px-3.5 py-2.5 rounded-xl font-semibold border transition-all duration-300 pointer-events-auto cursor-pointer ";
  if (isActive) {
    return base + "bg-gradient-to-r from-[#8b5cf6]/20 to-[#6d28d9]/20 border-[#8b5cf6] text-white shadow-sm glow-text-purple";
  }
  return base + "bg-[#130a24]/40 border-transparent text-slate-400 hover:text-white hover:bg-[#130a24]/80 hover:border-[#2e1e56]/80";
}

// Connect filters & live search triggers
function setupSearchListener() {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    if (searchQuery) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    currentPage = 1;
    applyFilters();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    currentPage = 1;
    applyFilters();
  });
}

// Compute active list from filtering state
function applyFilters() {
  filteredMovies = allMovies.filter(movie => {
    // Genre matching check
    const matchesGenre = currentCategory === 'All' || (movie.genre && movie.genre.includes(currentCategory));
    // Search keyword query string check
    const matchesQuery = !searchQuery || 
                         movie.title.toLowerCase().includes(searchQuery) || 
                         (movie.description && movie.description.toLowerCase().includes(searchQuery)) ||
                         (movie.genre && movie.genre.toLowerCase().includes(searchQuery));
    return matchesGenre && matchesQuery;
  });

  updateListing();
}

// Re-render UI views dynamically
function updateListing() {
  moviesLoading.classList.add('hidden');
  
  // Set accurate section header
  if (searchQuery) {
    catalogueTitle.textContent = 'ရှာဖွေမှုရလဒ်များ';
  } else if (currentCategory !== 'All') {
    catalogueTitle.textContent = `${currentCategory} ဇာတ်ကားများ`;
  } else {
    catalogueTitle.textContent = 'လတ်တလောတင်ထားသော ကားများ';
  }

  catalogueSubtitle.textContent = `ရုပ်ရှင်စုစုပေါင်း - ${filteredMovies.length} ကားရှိသည့်အနက် စာမျက်နှာ ${currentPage} ကို ပြသနေပါသည်`;

  if (filteredMovies.length === 0) {
    moviesEmpty.classList.remove('hidden');
    moviesGrid.classList.add('hidden');
    paginationPanel.classList.add('hidden');
    return;
  }

  moviesEmpty.classList.add('hidden');
  moviesGrid.classList.remove('hidden');

  // Compute pagination intervals
  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = filteredMovies.slice(startIndex, endIndex);

  // Render cards
  moviesGrid.innerHTML = '';
  paginatedList.forEach(movie => {
    const card = document.createElement('article');
    card.className = "bg-[#130a24] rounded-2xl overflow-hidden border border-[#2e1e56] hover:border-[#8b5cf6] hover:shadow-xl hover:shadow-purple-950/20 group flex flex-col transition-all duration-300 pointer-events-auto transform hover:-translate-y-1";
    
    card.innerHTML = `
      <a href="/watch.html?id=${movie.id}" class="w-full flex flex-col h-full focus:outline-none">
        <!-- Thumbnail Frame image aspect frame with elegant opacity shimmer load placeholder -->
        <div class="relative aspect-video w-full overflow-hidden bg-slate-950">
          <img
            src="${movie.thumbnail}"
            alt="${movie.title}"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
            onload="this.style.opacity=1; this.previousElementSibling ? this.previousElementSibling.remove() : null"
            style="opacity: 0; transition: opacity 0.5s ease-out;"
          />
          <div class="absolute inset-0 bg-[#06020f]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span class="bg-[#8b5cf6] text-white p-3 rounded-full shadow-lg shadow-purple-600/50 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <i data-lucide="play" class="w-4.5 h-4.5 fill-current"></i>
            </span>
          </div>
          <span class="absolute top-2.5 left-2.5 flex items-center gap-1 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow-sm font-mono">
            ⭐ ${movie.rating || '9.0'}
          </span>
          <span class="absolute bottom-2.5 right-2.5 bg-slate-950/85 text-white/90 text-[10px] px-1.5 py-0.5 rounded font-mono font-medium">
            ⏳ ${movie.duration || '20 mins'}
          </span>
        </div>

        <!-- Description meta inner body data -->
        <div class="p-4.5 flex flex-col flex-grow">
          <h3 class="font-bold text-sm sm:text-base text-white group-hover:text-[#c084fc] line-clamp-2 min-h-[2.8rem] transition-colors leading-snug">
            ${movie.title}
          </h3>
          <div class="flex items-center justify-between mt-auto pt-4 border-t border-[#2e1e56]/40 text-[11px]">
            <span class="bg-[#1b1033] border border-[#2e1e56] px-2.5 py-0.5 rounded-full text-[#c084fc] font-semibold">
              ${movie.genre ? movie.genre.split(',')[0].trim() : 'Anime'}
            </span>
            <span class="text-slate-500 font-mono text-[9px] uppercase tracking-wider font-bold">
              ID: ${movie.id}
            </span>
          </div>
        </div>
      </a>
    `;

    moviesGrid.appendChild(card);
  });

  // Load newly appended Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Update pagination triggers
  updatePagination(totalPages);
}

// Sync items dynamic pagination size elements
function setupLimitControls() {
  const limits = [
    { num: 3, btn: limit3Btn },
    { num: 6, btn: limit6Btn },
    { num: 12, btn: limit12Btn }
  ];

  limits.forEach(lim => {
    lim.btn.addEventListener('click', () => {
      itemsPerPage = lim.num;
      currentPage = 1;
      
      limits.forEach(l => {
        if (l.num === itemsPerPage) {
          l.btn.className = "px-2.5 py-1 rounded-md font-mono font-bold transition-all bg-[#8b5cf6] text-white";
        } else {
          l.btn.className = "px-2.5 py-1 rounded-md font-mono font-bold transition-all text-slate-400 hover:text-white";
        }
      });
      
      updateListing();
    });
  });
}

// Compute page boundaries of navigation interface triggers
function updatePagination(totalPages) {
  if (totalPages <= 1) {
    paginationPanel.classList.add('hidden');
    return;
  }

  paginationPanel.classList.remove('hidden');
  const showingCount = Math.min(filteredMovies.length, currentPage * itemsPerPage);
  const startNum = (currentPage - 1) * itemsPerPage + 1;
  paginationInfo.innerHTML = `စာမျက်နှာ <span class="text-white font-bold">${currentPage}</span> / <span class="text-[#a78bfa] font-bold">${totalPages}</span> ပြသမှု (${startNum}-${showingCount})`;

  // Toggle prev index buttons state
  pagePrevBtn.disabled = currentPage === 1;
  pageNextBtn.disabled = currentPage === totalPages;

  // Render navigation lists
  pageTriggersContainer.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const pBtn = document.createElement('button');
    pBtn.className = `w-9 h-9 rounded-lg font-mono font-bold transition-all pointer-events-auto cursor-pointer flex items-center justify-center border ${
      currentPage === i
        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-md border-transparent glow-text-purple'
        : 'bg-[#130a24]/50 text-slate-400 hover:text-white border-[#2e1e56]'
    }`;
    pBtn.textContent = i;
    
    pBtn.addEventListener('click', () => {
      currentPage = i;
      updateListing();
      document.getElementById('movie-list-section').scrollIntoView({ behavior: 'smooth' });
    });

    pageTriggersContainer.appendChild(pBtn);
  }

  // Prev / Next bindings
  pagePrevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      updateListing();
      document.getElementById('movie-list-section').scrollIntoView({ behavior: 'smooth' });
    }
  };

  pageNextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateListing();
      document.getElementById('movie-list-section').scrollIntoView({ behavior: 'smooth' });
    }
  };
}

// Render dynamic recently watched lists based on client side local caching ids
function renderRecentlyWatched() {
  try {
    const rawIds = localStorage.getItem('hk_recently_watched');
    if (!rawIds) {
      recentPanel.classList.add('hidden');
      return;
    }

    const ids = JSON.parse(rawIds);
    if (!ids || ids.length === 0) {
      recentPanel.classList.add('hidden');
      return;
    }

    // Load detailed movie item references and exclude unmapped records
    const recentMovies = ids
      .map(id => allMovies.find(m => m.id === id))
      .filter(m => !!m);

    if (recentMovies.length === 0) {
      recentPanel.classList.add('hidden');
      return;
    }

    recentPanel.classList.remove('hidden');
    recentList.innerHTML = '';

    recentMovies.slice(0, 4).forEach(movie => {
      const row = document.createElement('a');
      row.href = `/watch.html?id=${movie.id}`;
      row.className = "flex items-center gap-3 p-2 bg-[#1b1033]/40 border border-[#2e1e56]/40 hover:border-[#8b5cf6]/60 rounded-xl group transition-all duration-300";
      row.innerHTML = `
        <div class="relative w-14 aspect-video rounded-md overflow-hidden bg-slate-900 flex-shrink-0">
          <img src="${movie.thumbnail}" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div class="flex-grow min-w-0 pr-1">
          <h4 class="text-xs font-semibold text-slate-200 group-hover:text-[#c084fc] transition-colors truncate leading-snug">
            ${movie.title}
          </h4>
          <span class="text-[9px] text-[#a78bfa]/80 font-bold uppercase font-mono tracking-wider">
            ${movie.genre ? movie.genre.split(',')[0].trim() : 'Anime'}
          </span>
        </div>
      `;

      recentList.appendChild(row);
    });

    clearRecentBtn.onclick = () => {
      if (confirm('လတ်တလောကြည့်ထားသောစာရင်းကို အမှန်တကယ်ရှင်းလင်းချင်ပါသလား?')) {
        localStorage.removeItem('hk_recently_watched');
        recentPanel.classList.add('hidden');
      }
    };
  } catch (err) {
    console.error('Error rendering recent entries list:', err);
    recentPanel.classList.add('hidden');
  }
}
