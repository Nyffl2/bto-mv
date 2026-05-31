// watch.js - Streaming Detail Engine for Hentai Kabar (SlothUI Theme)

let allMovies = [];
let activeMovie = null;

// DOM Selectors
const playerPlaceholder = document.getElementById('player-placeholder');
const videoPlayer = document.getElementById('video-player');
const videoTitle = document.getElementById('video-title');
const videoTag = document.getElementById('video-tag');
const videoRating = document.getElementById('video-rating');
const videoDuration = document.getElementById('video-duration');
const videoDescription = document.getElementById('video-description');
const copyLinkBtn = document.getElementById('copy-link-btn');
const copySuccess = document.getElementById('copy-success');
const suggestionsContainer = document.getElementById('suggestions-container');

// URL query parameter parsing
const urlParams = new URLSearchParams(window.location.search);
const activeId = urlParams.get('id');

window.addEventListener('DOMContentLoaded', async () => {
  if (!activeId) {
    // Redirect to homepage if no target video provided
    window.location.href = '/';
    return;
  }

  await loadDatabase();
  setupSharing();
  setupRecentlyWatched();
});

// Load the movies database and resolve current movie
async function loadDatabase() {
  try {
    const res = await fetch('/videos.json');
    if (!res.ok) throw new Error('Database loading failed');
    const data = await res.json();
    
    allMovies = data.movies || [];
    activeMovie = allMovies.find(m => m.id === activeId);

    if (!activeMovie) {
      // Unresolved ID fallback
      window.location.href = '/';
      return;
    }

    renderActiveMovie();
    renderSuggestions();
  } catch (err) {
    console.error('Error fetching data during movie stream initiation:', err);
    playerPlaceholder.innerHTML = `<p class="text-rose-400 text-xs">ရုပ်ရှင်အချက်အလက်များ ဖော်ဆောင်ရယူခြင်း မအောင်မြင်ပါ...</p>`;
  }
}

// Convert standard YouTube share/watch links into iframe embed links dynamically
function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }
  return url;
}

// Bind active movie data elements and display player
function renderActiveMovie() {
  document.title = `${activeMovie.title} - Hentai Kabar Streaming`;
  
  // Set meta texts
  videoTitle.textContent = activeMovie.title;
  videoTag.textContent = activeMovie.genre ? activeMovie.genre.split(',')[0].trim() : 'Anime';
  videoRating.querySelector('span').textContent = activeMovie.rating || '9.0';
  videoDuration.querySelector('span').textContent = activeMovie.duration || '20 mins';
  videoDescription.textContent = activeMovie.description || 'ဇာတ်လမ်းအကျဉ်း ဖော်ပြထားခြင်း မရှိသေးပါ...';

  // Load stream frame
  const embedUrl = getYouTubeEmbedUrl(activeMovie.embed_link);
  
  if (embedUrl) {
    videoPlayer.src = embedUrl;
    videoPlayer.classList.remove('hidden');
    
    // Hide the loading spinner as the player finishes mounting
    videoPlayer.onload = () => {
      playerPlaceholder.classList.add('hidden');
    };
  } else {
    playerPlaceholder.innerHTML = `<p class="text-amber-400 text-xs text-center border-dashed border border-amber-500/30 p-6 rounded-2xl">တိုက်ရိုက်ကြည့်ရှုရန် Player မရရှိနိုင်သေးပါ။ မကြာမီ ပြန်တင်ဆက်ပါမည်...</p>`;
  }
}

// Sync current watch to localStorage queue
function setupRecentlyWatched() {
  if (!activeId) return;
  try {
    const stored = localStorage.getItem('hk_recently_watched');
    let ids = stored ? JSON.parse(stored) : [];
    
    // Sort queue elements ensuring unique front rank items
    ids = ids.filter(idx => idx !== activeId);
    ids.unshift(activeId);
    const updatedIds = ids.slice(0, 5); // Keep up to 5 entries cached
    
    localStorage.setItem('hk_recently_watched', JSON.stringify(updatedIds));
  } catch (e) {
    console.error('Error logging recently watched listing item:', e);
  }
}

// Share clipboard event handling
function setupSharing() {
  copyLinkBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copySuccess.classList.remove('opacity-0');
      copySuccess.classList.add('opacity-100');
      
      setTimeout(() => {
        copySuccess.classList.remove('opacity-100');
        copySuccess.classList.add('opacity-0');
      }, 3000);
    } catch (err) {
      console.error('Copy link copy query failure:', err);
    }
  });
}

// Filter and render recommended listings dynamically
function renderSuggestions() {
  // Try to find movies of the same genre (excluding active match)
  const currentGenres = activeMovie.genre ? activeMovie.genre.split(',').map(g => g.trim()) : [];
  
  let matches = allMovies.filter(movie => {
    if (movie.id === activeId) return false;
    if (!movie.genre) return false;
    const itemGenres = movie.genre.split(',').map(g => g.trim());
    return itemGenres.some(ig => currentGenres.includes(ig));
  });

  // If no related matches found, fallback to standard items listing
  if (matches.length === 0) {
    matches = allMovies.filter(movie => movie.id !== activeId);
  }

  // Shuffle or slice up to 4 items
  const subset = matches.slice(0, 4);
  suggestionsContainer.innerHTML = '';

  subset.forEach(movie => {
    const card = document.createElement('a');
    card.href = `/watch.html?id=${movie.id}`;
    card.className = "flex gap-3 bg-[#1b1033]/40 border border-[#2e1e56]/40 hover:border-[#8b5cf6]/60 rounded-xl p-2.5 group transition-all duration-300 pointer-events-auto transform hover:translate-x-1";
    
    card.innerHTML = `
      <!-- Tiny Thumbnail Aspect Ratio screen box -->
      <div class="relative w-20 aspect-video rounded-lg overflow-hidden bg-slate-950 flex-shrink-0">
        <img
          src="${movie.thumbnail}"
          alt="${movie.title}"
          class="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-[#06020f]/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <i data-lucide="play" class="w-3 h-3 text-white fill-current"></i>
        </div>
      </div>

      <!-- Suggestion Label descriptions and tags -->
      <div class="flex-grow min-w-0 flex flex-col justify-between pr-1">
        <h4 class="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-[#c084fc] transition-colors line-clamp-1 leading-snug">
          ${movie.title}
        </h4>
        
        <div class="flex items-center gap-2 mt-2">
          <span class="text-[9px] bg-slate-950/60 px-2 py-0.5 rounded text-slate-400 font-bold font-mono">
             ${movie.genre ? movie.genre.split(',')[0].trim() : 'Anime'}
          </span>
          <span class="text-[9px] text-amber-400 font-bold font-mono flex items-center gap-0.5">
            ⭐ ${movie.rating || '9.0'}
          </span>
        </div>
      </div>
    `;

    suggestionsContainer.appendChild(card);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
