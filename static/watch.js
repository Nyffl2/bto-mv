// watch.js - Movie Watch Page Logic
// Reads ?id= URL parameter, loads video details, handles embeds, and list related courses/movies.

document.addEventListener("DOMContentLoaded", () => {
  // Extract custom ?id= Parameter from current URL query
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id");
  
  // HTML Element Selectors
  const noticeBanner = document.getElementById("notice-banner");
  const noticeText = document.getElementById("notice-text");
  const noticeBtn = document.getElementById("notice-btn");
  
  const playerContainer = document.querySelector(".player-container");
  const detailCard = document.getElementById("movie-detail-card");
  const watchTitle = document.getElementById("watch-title");
  const watchRating = document.getElementById("watch-rating");
  const watchGenresContainer = document.getElementById("watch-genres-container");
  const watchDuration = document.getElementById("watch-duration");
  const watchDesc = document.getElementById("watch-desc");
  const relatedContainer = document.getElementById("related-movies-container");

  // Fetch data from videos.json
  fetch("videos.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load videos.json: " + response.status);
      }
      return response.json();
    })
    .then(data => {
      const movies = data.movies || [];
      
      // 1. Fetch & populate notification banner info
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
        noticeBanner.style.display = "none";
      }

      // 2. Find selected movie from the movies list
      const activeMovie = movies.find(m => m.id === movieId);
      
      if (activeMovie) {
        // 3. Populate watch page dynamically
        renderVideoPlayer(activeMovie);
        populateMovieDetails(activeMovie);
        
        // 4. Render related movies (filter out current active movie)
        const related = movies.filter(m => m.id !== movieId);
        renderRelatedMovies(related);
      } else {
        // Handle invalid, missing, or blank ID
        renderErrorPlayer("ဇာတ်ကားမတွေ့ရှိပါ", "တောင်းပန်ပါသည်။ သင်ရှာဖွေနေသော ဇာတ်ကားမှာ မရှိပါ သို့မဟုတ် ဖျက်သိမ်းပြီးဖြစ်နိုင်ပါသည်။");
        // Still render some items in sidebar for navigation comfort
        renderRelatedMovies(movies.slice(0, 4));
      }

      // Initialize lucide icons for newly rendered or modified DOMs
      if (window.lucide) {
        window.lucide.createIcons();
      }
    })
    .catch(error => {
      console.error("Error loading movie detail data:", error);
      renderErrorPlayer(
        "အချက်အလက် ချိတ်ဆက်၍မရပါ",
        `ဆာဗာနှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်းရှိနေပါသည်။ အသေးစိတ်: ${error.message}`
      );
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });

  // Translate youtube watch/share links to standard playable /embed/ embeds
  function getYouTubeEmbedUrl(url) {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  }

  // Render Iframe embedded player dynamically
  function renderVideoPlayer(movie) {
    if (!movie.embed_link) {
      renderErrorPlayer("Embed Link Playback Error", "No source media format detected for this file.");
      return;
    }
    
    // Create clean and secure iframe embeds
    playerContainer.innerHTML = `
      <iframe 
        src="${getYouTubeEmbedUrl(movie.embed_link)}" 
        title="${movie.title}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        referrerpolicy="strict-origin-when-cross-origin" 
        allowfullscreen>
      </iframe>
    `;
  }

  // Populate metadata below player
  function populateMovieDetails(movie) {
    watchTitle.textContent = movie.title;
    watchRating.textContent = `★ ${movie.rating || "9.0"}`;
    
    if (watchGenresContainer) {
      const genres = movie.genre ? movie.genre.split(",") : ["Anime"];
      watchGenresContainer.innerHTML = genres.map(g => {
        const trimmed = g.trim();
        return `<a class="meta-pill" href="index.html?genre=${encodeURIComponent(trimmed)}" style="transition: all 0.2s; cursor: pointer; text-decoration: none;">${trimmed}</a>`;
      }).join("");
    }
    
    watchDuration.textContent = movie.duration || "24 mins";
    watchDesc.textContent = movie.description;
    
    // Unhide detail card once details are filled
    detailCard.style.display = "block";
  }

  // Render related movies in sidebar
  function renderRelatedMovies(moviesList) {
    if (moviesList.length === 0) {
      relatedContainer.innerHTML = `
        <div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 15px 0;">
          အခြား ဆက်စပ်ကားများ မရှိသေးပါ။
        </div>
      `;
      return;
    }

    relatedContainer.innerHTML = moviesList.map(movie => {
      return `
        <a href="watch.html?id=${movie.id}" class="related-card" id="related-${movie.id}">
          <img src="${movie.thumbnail}" alt="${movie.title}" class="related-thumbnail" referrerpolicy="no-referrer" loading="lazy">
          <div class="related-info">
            <h4 class="related-title">${movie.title}</h4>
            <div class="related-meta">
              <span>★ ${movie.rating || "8.5"}</span> &bull; 
              <span>${movie.genre ? movie.genre.split(',')[0] : "Anime"}</span>
            </div>
          </div>
        </a>
      `;
    }).join("");
  }

  // Display clean failure/alert within player zone
  function renderErrorPlayer(title, message) {
    playerContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ef4444; gap: 15px; padding: 20px; text-align: center;">
        <i data-lucide="alert-triangle" style="width: 56px; height: 56px; opacity: 0.8;"></i>
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">${title}</h2>
          <p style="color: var(--text-dimmed); font-size: 0.9rem; max-width: 400px; margin: 0 auto;">${message}</p>
        </div>
        <a href="index.html" class="action-btn action-btn-primary" style="margin-top: 10px; max-width: 250px; font-size: 0.85rem; padding: 8px 20px;">
          <i data-lucide="home"></i> ပင်မစာမျက်နှာသို့ ပြန်သွားရန်
        </a>
      </div>
    `;
    
    // Hide details section
    detailCard.style.display = "none";
  }


});
