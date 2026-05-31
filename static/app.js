// app.js - Logic for Hentai Kabar Homepage
// Handles video fetching, rendering, announcement banner rendering, and searching.

document.addEventListener("DOMContentLoaded", () => {
  let moviesData = [];
  let selectedGenre = "All";
  
  // Parse optional ?genre= parameter from URL
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const genreParam = urlParams.get("genre");
    if (genreParam) {
      selectedGenre = genreParam;
    }
  } catch (e) {
    console.warn("Error parsing URL genre parameter:", e);
  }
  
  // HTML Element Selectors
  const noticeBanner = document.getElementById("notice-banner");
  const noticeText = document.getElementById("notice-text");
  const noticeBtn = document.getElementById("notice-btn");
  const moviesContainer = document.getElementById("movies-container");
  const searchInput = document.getElementById("search-input");
  const videoCount = document.getElementById("video-count");
  const genreFiltersContainer = document.getElementById("genre-filters-container");
  
  // 1. Fetch data from videos.json
  fetch("videos.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load videos.json: HTTP " + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Set global data
      moviesData = data.movies || [];
      
      // 2. Populate notification banner
      if (data.notice) {
        noticeText.textContent = data.notice;
        noticeBanner.style.display = "flex";
        if (data.notice_link) {
          noticeBtn.href = data.notice_link;
          noticeBtn.style.display = "inline-flex";
        } else {
          noticeBtn.style.display = "none";
        }
      } else {
        // If notice is empty, we can hide the banner entirely
        noticeBanner.style.display = "none";
      }
      
      // 3. Render initial movies grid respecting active filters
      filterAndRender();
      
      // 4. Dynamic Genre Extraction and pill rendering
      renderGenreFilters(moviesData);
      
      // 5. Update the listed count
      updateMovieCount(moviesData.length);
      
      // Initialize lucide icons for elements created natively or modified
      if (window.lucide) {
        window.lucide.createIcons();
      }
    })
    .catch(error => {
      console.error("Error loading application data:", error);
      moviesContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--accent-secondary); padding: 40px 20px;">
          <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.8;"></i>
          <p style="font-weight: 600;">အချက်အလက်များ ဆွဲယူရာတွင် အမှားအယွင်းရှိနေပါသည်။</p>
          <p style="font-size: 0.85rem; color: var(--text-dimmed); margin-top: 5px;">အသေးစိတ်: ${error.message}</p>
        </div>
      `;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });

  // 6. Combination filter logic for Search Box and Genre buttons
  function filterAndRender() {
    const query = searchInput.value.toLowerCase().trim();
    
    const filteredMovies = moviesData.filter(movie => {
      // Genre filter check
      let matchesGenre = true;
      if (selectedGenre !== "All") {
        matchesGenre = movie.genre && movie.genre.split(",").map(g => g.trim().toLowerCase()).includes(selectedGenre.toLowerCase());
      }
      
      // Text query check
      let matchesText = true;
      if (query) {
        const matchTitle = movie.title.toLowerCase().includes(query);
        const matchDesc = movie.description.toLowerCase().includes(query);
        const matchGenre = movie.genre ? movie.genre.toLowerCase().includes(query) : false;
        matchesText = matchTitle || matchDesc || matchGenre;
      }
      
      return matchesGenre && matchesText;
    });
    
    renderMovies(filteredMovies);
    updateMovieCount(filteredMovies.length);
  }

  // 7. Real-time Search Filtering
  searchInput.addEventListener("input", () => {
    filterAndRender();
  });

  // 8. Render unique dynamic genre pills
  function renderGenreFilters(movies) {
    if (!genreFiltersContainer) return;
    
    const uniqueGenres = new Set();
    movies.forEach(movie => {
      if (movie.genre) {
        movie.genre.split(",").forEach(g => {
          const trimmed = g.trim();
          if (trimmed) uniqueGenres.add(trimmed);
        });
      }
    });

    const genresList = ["All", ...Array.from(uniqueGenres)];
    
    genreFiltersContainer.innerHTML = genresList.map(genre => {
      const activeClass = genre === selectedGenre ? "active" : "";
      const displayText = genre === "All" ? "အားလုံး" : genre;
      return `<button class="genre-filter-btn ${activeClass}" data-genre="${genre}">${displayText}</button>`;
    }).join("");

    // Wire up events
    const buttons = genreFiltersContainer.querySelectorAll(".genre-filter-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        selectedGenre = btn.getAttribute("data-genre");
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        filterAndRender();
      });
    });
  }

  // 9. Function to Render Movies List
  function renderMovies(movies) {
    if (movies.length === 0) {
      moviesContainer.innerHTML = `
        <div class="empty-results">
          <div class="empty-icon">📂</div>
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-main);">ရှာဖွေမှုနှင့် ကိုက်ညီသော ဗီဒီယို မရှိပါ။</p>
          <p style="font-size: 0.85rem; color: var(--text-dimmed); margin-top: 5px;">အခြား ပြော့စကားလုံးတစ်ခုဖြင့် ထပ်မံရှာဖွေကြည့်ပါ...</p>
        </div>
      `;
      return;
    }

    moviesContainer.innerHTML = movies.map(movie => {
      // Assemble clean ratings / durations placeholders if not present
      const rating = movie.rating || "8.5";
      const duration = movie.duration || "20 mins";
      const genre = movie.genre || "Anime";

      return `
        <article class="movie-card" id="card-${movie.id}">
          <a href="watch.html?id=${movie.id}">
            <div class="thumbnail-container">
              <img src="${movie.thumbnail}" alt="${movie.title}" class="movie-thumbnail" referrerpolicy="no-referrer" loading="lazy">
              <span class="movie-badge-rating">★ ${rating}</span>
              <span class="movie-badge-duration">${duration}</span>
              <div class="play-overlay">
                <div class="play-icon-btn">
                  <i data-lucide="play" style="fill: currentColor; width: 22px; height: 22px;"></i>
                </div>
              </div>
            </div>
          </a>
          <div class="movie-info">
            <a href="watch.html?id=${movie.id}">
              <h3 class="movie-title">${movie.title}</h3>
            </a>
            <div class="movie-meta">
              <span class="movie-genre">${genre}</span>
              <span style="font-size: 0.75rem; color: var(--text-dimmed);">${movie.id.toUpperCase()}</span>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Re-create icons for newly added HTML components
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Helper to Update Listed Movie Count
  function updateMovieCount(count) {
    videoCount.textContent = `${count} ${count === 1 ? 'movie' : 'movies'} listed`;
  }
});
