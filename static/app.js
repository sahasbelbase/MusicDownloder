/**
 * Music Studio - Ultra-Clean Client Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==================== UNIVERSAL API & SERVER ROUTING ====================
  function getServerBaseUrl() {
    const custom = (localStorage.getItem('musicstudio_server_url') || '').trim();
    if (custom) return custom.replace(/\/+$/, '');
    return '';
  }

  function resolveApiUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    const base = getServerBaseUrl();
    const clean = path.startsWith('/') ? path : '/' + path;
    return base ? `${base}${clean}` : clean;
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = resolveApiUrl(input);
    } else if (input instanceof Request && input.url.includes('/api/')) {
      // In case Request object is passed
    }
    return nativeFetch(input, init);
  };

  // DOM Elements
  const inputUrl = document.getElementById('input-url');
  const platformIcon = document.getElementById('platform-icon');
  const btnDownload = document.getElementById('btn-download');
  const btnPaste = document.getElementById('btn-paste');
  const btnStop = document.getElementById('btn-stop-download');
  const btnEnrichAll = document.getElementById('btn-enrich-all');
  const btnOpenFolder = document.getElementById('btn-open-folder');
  const btnRefreshLibrary = document.getElementById('btn-refresh-library');

  // Status & Telemetry
  const statusBadge = document.getElementById('status-badge');
  const metricPlaylistName = document.getElementById('metric-playlist-name');
  const metricStatusMsg = document.getElementById('metric-status-msg');
  const metricDownloaded = document.getElementById('metric-downloaded');
  const metricSkipped = document.getElementById('metric-skipped');
  const metricTotal = document.getElementById('metric-total');
  const metricPercent = document.getElementById('metric-percent');
  const metricSpeed = document.getElementById('metric-speed');
  const progressBar = document.getElementById('progress-bar');
  const streamFeed = document.getElementById('stream-feed');
  const navSongCount = document.getElementById('nav-song-count');
  const mobileNavSongCount = document.getElementById('mobile-nav-song-count');

  // Settings
  const settingThreads = document.getElementById('setting-threads');
  const settingQuality = document.getElementById('setting-quality');
  const settingSort = document.getElementById('setting-sort');
  const settingNaming = document.getElementById('setting-naming');

  // Library Elements
  const libraryContainer = document.getElementById('library-container');
  const librarySearch = document.getElementById('library-search');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const libraryCountLabel = document.getElementById('library-count-label');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewListBtn = document.getElementById('view-list-btn');

  // Drawer Elements
  const trackDrawer = document.getElementById('track-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerCover = document.getElementById('drawer-cover');
  const drawerBitrate = document.getElementById('drawer-bitrate');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerArtist = document.getElementById('drawer-artist');
  const drawerGenre = document.getElementById('drawer-genre');
  const drawerYear = document.getElementById('drawer-year');
  const drawerSize = document.getElementById('drawer-size');
  const drawerAlbum = document.getElementById('drawer-album');
  const drawerCollabRow = document.getElementById('drawer-collab-row');
  const drawerCollab = document.getElementById('drawer-collab');
  const drawerDuration = document.getElementById('drawer-duration');
  const drawerFilename = document.getElementById('drawer-filename');
  const drawerPlayBtn = document.getElementById('drawer-play-btn');

  // Audio Dock Elements
  const audioEngine = document.getElementById('audio-engine');
  const playerCover = document.getElementById('player-cover');
  const playerTitle = document.getElementById('player-title');
  const playerArtist = document.getElementById('player-artist');
  const playerShuffle = document.getElementById('player-shuffle');
  const playerPrev = document.getElementById('player-prev');
  const playerPlayBtn = document.getElementById('player-play');
  const playerPlayIcon = document.getElementById('player-play-icon');
  const playerNext = document.getElementById('player-next');
  const playerRepeat = document.getElementById('player-repeat');
  const repeatBadge = document.getElementById('repeat-badge');
  const playerScrubber = document.getElementById('player-scrubber');
  const scrubberWrap = document.getElementById('scrubber-wrap');
  const scrubberTooltip = document.getElementById('scrubber-tooltip');
  const playerCurrentTime = document.getElementById('player-current-time');
  const playerTotalTime = document.getElementById('player-total-time');
  const playerVolume = document.getElementById('player-volume');
  const playerMuteBtn = document.getElementById('player-mute-btn');
  const volumeIcon = document.getElementById('volume-icon');
  const dockTrackInfo = document.getElementById('dock-track-info');
  const playerDock = document.getElementById('player-bar');
  const playerExpandBtn = document.getElementById('player-expand-btn');

  // Fullscreen "Now Playing" Overlay Elements
  const fullscreenPlayer = document.getElementById('fullscreen-player');
  const fsMinimizeBtn = document.getElementById('fs-minimize-btn');
  const fsCover = document.getElementById('fs-cover');
  const fsTitle = document.getElementById('fs-title');
  const fsArtist = document.getElementById('fs-artist');
  const fsAlbum = document.getElementById('fs-album');
  const fsCurrentTime = document.getElementById('fs-current-time');
  const fsTotalTime = document.getElementById('fs-total-time');
  const fsScrubber = document.getElementById('fs-scrubber');
  const fsShuffle = document.getElementById('fs-shuffle');
  const fsPrev = document.getElementById('fs-prev');
  const fsPlay = document.getElementById('fs-play');
  const fsPlayIcon = document.getElementById('fs-play-icon');
  const fsNext = document.getElementById('fs-next');
  const fsRepeat = document.getElementById('fs-repeat');
  const fsRepeatBadge = document.getElementById('fs-repeat-badge');
  const fsVolume = document.getElementById('fs-volume');
  const fsMuteBtn = document.getElementById('fs-mute-btn');
  const fsVolIcon = document.getElementById('fs-vol-icon');
  const fsDrawerBtn = document.getElementById('fs-drawer-btn');
  const fsAmbientGlow = document.getElementById('fs-ambient-glow');

  // Library Grouping & Sorting Elements
  const groupPills = document.querySelectorAll('.group-pill');
  const librarySortSelect = document.getElementById('library-sort-select');
  const viewSwitchWrap = document.getElementById('view-switch-wrap');

  // Discover & Explore Elements
  const exploreSearchInput = document.getElementById('explore-search-input');
  const btnClearExploreSearch = document.getElementById('btn-clear-explore-search');
  const exploreSearchSection = document.getElementById('explore-search-section');
  const exploreSearchGrid = document.getElementById('explore-search-grid');
  const exploreSearchTitle = document.getElementById('explore-search-title');
  const exploreSearchCount = document.getElementById('explore-search-count');
  const featuredPlaylistsGrid = document.getElementById('featured-playlists-grid');
  const trendingTracksGrid = document.getElementById('trending-tracks-grid');
  const searchFilterPills = document.getElementById('search-filter-pills');
  const searchAlbumsContainer = document.getElementById('search-albums-container');
  const searchAlbumsGrid = document.getElementById('search-albums-grid');
  const searchAlbumsBadge = document.getElementById('search-albums-badge');
  const searchTracksContainer = document.getElementById('search-tracks-container');
  const searchTracksSubTitle = document.getElementById('search-tracks-sub-title');
  let currentSearchFilter = 'all';
  let currentSearchResults = { tracks: [], albums: [] };

  // Playlist Modal & Custom Playlist Elements
  const playlistModal = document.getElementById('playlist-modal');
  const playlistModalBackdrop = document.getElementById('playlist-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCover = document.getElementById('modal-cover');
  const modalBadge = document.getElementById('modal-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalTrackCount = document.getElementById('modal-track-count');
  const btnModalDownloadAll = document.getElementById('btn-modal-download-all');
  const btnModalFavorite = document.getElementById('btn-modal-favorite');
  const modalFavText = document.getElementById('modal-fav-text');
  const modalTracklist = document.getElementById('modal-tracklist');
  let currentModalPlaylist = null;
  let exploreSearchDebounce = null;

  // Custom Playlist Creator Elements
  const btnCreatePlaylist = document.getElementById('btn-create-playlist');
  const createPlaylistModal = document.getElementById('create-playlist-modal');
  const createPlaylistBackdrop = document.getElementById('create-playlist-backdrop');
  const createPlaylistClose = document.getElementById('create-playlist-close');
  const btnCancelPlaylist = document.getElementById('btn-cancel-playlist');
  const createPlaylistForm = document.getElementById('create-playlist-form');
  const coverPreviewBox = document.getElementById('cover-preview-box');
  const coverPreviewImg = document.getElementById('cover-preview-img');
  const playlistFileInput = document.getElementById('playlist-file-input');
  const playlistNameInput = document.getElementById('playlist-name-input');
  const playlistDescInput = document.getElementById('playlist-desc-input');
  const playlistUrlInput = document.getElementById('playlist-url-input');

  // Add to Playlist Modal Elements
  const addToPlaylistModal = document.getElementById('add-to-playlist-modal');
  const addToPlaylistBackdrop = document.getElementById('add-to-playlist-backdrop');
  const addToPlaylistClose = document.getElementById('add-to-playlist-close');
  const addToPlaylistTrackName = document.getElementById('add-to-playlist-track-name');
  const addToPlaylistList = document.getElementById('add-to-playlist-list');
  const btnQuickCreateFromAdd = document.getElementById('btn-quick-create-from-add');
  const drawerAddPlaylistBtn = document.getElementById('drawer-add-playlist-btn');

  // Mac Notch & Dynamic Island HUD Elements
  const notchHud = document.getElementById('mac-notch-hud');
  const notchPill = document.getElementById('notch-pill');
  const notchMiniArt = document.getElementById('notch-mini-art');
  const notchMiniTitle = document.getElementById('notch-mini-title');
  const notchMiniArtist = document.getElementById('notch-mini-artist');
  const notchMiniPlayBtn = document.getElementById('notch-mini-play-btn');
  const notchMiniPlayIcon = document.getElementById('notch-mini-play-icon');
  const notchExpandedIsland = document.getElementById('notch-expanded-island');
  const notchExpandedArt = document.getElementById('notch-expanded-art');
  const notchExpandedTitle = document.getElementById('notch-expanded-title');
  const notchExpandedArtist = document.getElementById('notch-expanded-artist');
  const notchProgressTrack = document.getElementById('notch-progress-track');
  const notchProgressFill = document.getElementById('notch-progress-fill');
  const notchCurrTime = document.getElementById('notch-curr-time');
  const notchTotalTime = document.getElementById('notch-total-time');
  const notchPrevBtn = document.getElementById('notch-prev-btn');
  const notchPlayBtn = document.getElementById('notch-play-btn');
  const notchPlayIcon = document.getElementById('notch-play-icon');
  const notchNextBtn = document.getElementById('notch-next-btn');
  const notchFsBtn = document.getElementById('notch-fs-btn');

  // Import Playlist Modal Elements
  const btnImportPlaylist = document.getElementById('btn-import-playlist');
  const importPlaylistModal = document.getElementById('import-playlist-modal');
  const importPlaylistBackdrop = document.getElementById('import-playlist-backdrop');
  const importPlaylistClose = document.getElementById('import-playlist-close');
  const btnCancelImport = document.getElementById('btn-cancel-import');
  const importPlaylistForm = document.getElementById('import-playlist-form');
  const importPlaylistUrl = document.getElementById('import-playlist-url');
  const importPlaylistCustomName = document.getElementById('import-playlist-custom-name');
  const btnImportPaste = document.getElementById('btn-import-paste');
  const importPlaylistStatus = document.getElementById('import-playlist-status');
  const importStatusTitle = document.getElementById('import-status-title');
  const importStatusSubtitle = document.getElementById('import-status-subtitle');
  const btnSubmitImport = document.getElementById('btn-submit-import');

  // Application State
  let rawLibrarySongs = [];
  let librarySongs = [];
  let userPlaylists = [];
  let pendingCoverBase64 = null;
  let trackToAdd = null;
  let playlistSubFilter = 'all'; // 'all' | 'custom' | 'favorites'
  let currentSongIndex = -1;
  let isPlaying = false;
  let isSeeking = false;
  let isDeviceOffline = !navigator.onLine;
  let hasRecordedPlayForCurrentTrack = false;
  let isShuffle = (localStorage.getItem('musicstudio_shuffle') || localStorage.getItem('spotistudio_shuffle')) === 'true';
  let repeatMode = localStorage.getItem('musicstudio_repeat') || localStorage.getItem('spotistudio_repeat') || 'off'; // 'off' | 'all' | 'one'
  let currentGroupMode = 'tracks'; // 'tracks' | 'artists' | 'albums' | 'genres' | 'playlists' | 'most_played'
  let currentSortMode = 'recent'; // 'recent' | 'title' | 'artist' | 'duration'
  let shuffleQueue = [];
  let shufflePointer = 0;
  let playHistory = [];
  let selectedSong = null;
  let searchDebounce = null;
  let previousVolume = parseFloat(localStorage.getItem('musicstudio_volume') || localStorage.getItem('spotistudio_volume')) || 0.8;

  // Platform Icons SVG
  const ICONS = {
    search: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    spotify: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.627.627 0 0 1-.863.208c-2.36-1.442-5.33-1.768-8.828-.97a.625.625 0 1 1-.277-1.22c3.827-.874 7.113-.502 9.76 1.118a.625.625 0 0 1 .208.864zm1.224-2.723a.784.784 0 0 1-1.08.258c-2.702-1.66-6.822-2.14-10.017-1.171a.784.784 0 1 1-.452-1.501c3.65-1.107 8.204-.576 11.29 1.334a.783.783 0 0 1 .259 1.08zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.94.94 0 1 1-.55-1.801c3.528-1.07 9.408-.86 13.136 1.353a.941.941 0 0 1-.969 1.604z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
  };

  // ==================== NAVIGATION TABS (DESKTOP + MOBILE) ====================
  function activateTab(target) {
    if (isDeviceOffline && (target === 'discover' || target === 'downloader')) {
      showToast('⚡ Device is offline: Discover & Downloader require internet. Showing your Library.', 'warning');
      target = 'library';
    }

    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === target);
    });
    document.querySelectorAll('.mobile-nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === target);
    });
    document.querySelectorAll('.tab-view').forEach(v => {
      v.classList.toggle('active', v.id === `tab-${target}`);
    });

    if (target === 'library') {
      loadLibrary();
    } else if (target === 'discover') {
      loadExplore();
    }
  }

  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = btn.getAttribute('data-tab');
      if (isDeviceOffline && (target === 'discover' || target === 'downloader')) {
        e.preventDefault();
        showToast('⚡ Device is offline: Discover & Downloader require internet. Showing your Library.', 'warning');
        activateTab('library');
        return;
      }
      if (target) activateTab(target);
    });
  });

  // ==================== URL INPUT AUTO-DETECTION ====================
  function detectPlatform(url) {
    platformIcon.className = 'platform-icon';
    if (url.includes('spotify.com')) {
      platformIcon.classList.add('spotify');
      platformIcon.innerHTML = ICONS.spotify;
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platformIcon.classList.add('youtube');
      platformIcon.innerHTML = ICONS.youtube;
    } else {
      platformIcon.innerHTML = ICONS.search;
    }
  }

  inputUrl.addEventListener('input', (e) => {
    detectPlatform(e.target.value.trim());
  });

  // ==================== PASTE BUTTON ====================
  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        inputUrl.value = text.trim();
        detectPlatform(text.trim());
        showToast('Link pasted!', 'success');
      }
    } catch {
      inputUrl.focus();
      showToast('Press Cmd+V to paste', 'warning');
    }
  });

  // ==================== QUICK CHIPS ====================
  const chipSpotify = document.getElementById('chip-spotify-hit');
  if (chipSpotify) {
    chipSpotify.addEventListener('click', () => {
      inputUrl.value = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
      detectPlatform(inputUrl.value);
      showToast('Loaded Top Hits playlist');
    });
  }

  const chipSingle = document.getElementById('chip-single-test');
  if (chipSingle) {
    chipSingle.addEventListener('click', () => {
      inputUrl.value = 'https://open.spotify.com/track/4P9Q0GoiGfFp2WrmUkyv1m';
      detectPlatform(inputUrl.value);
      showToast('Loaded single track');
    });
  }

  // ==================== OPEN FOLDER IN FINDER ====================
  btnOpenFolder.addEventListener('click', async () => {
    try {
      await fetch('/api/open-folder', { method: 'POST' });
      showToast('Opened Songs directory in Finder');
    } catch {
      showToast('Failed to open Songs folder', 'error');
    }
  });

  // ==================== START DOWNLOAD ====================
  btnDownload.addEventListener('click', async () => {
    const url = inputUrl.value.trim();
    if (!url) {
      showToast('Please enter a Spotify or YouTube Music link', 'warning');
      inputUrl.focus();
      return;
    }

    const payload = {
      url: url,
      threads: parseInt(settingThreads.value) || 3,
      quality: settingQuality.value || '320k',
      sort: settingSort.value || 'latest',
      naming: settingNaming.value || 'title'
    };

    try {
      btnDownload.disabled = true;
      btnDownload.innerHTML = `<span class="pulse-dot"></span> <span>Starting...</span>`;

      const res = await fetch('/api/download/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Download failed to start');
      }

      showToast('Download started! Streaming tracks...', 'success');
      btnStop.style.display = 'inline-flex';
      statusBadge.className = 'hud-status-badge active-download';
      statusBadge.textContent = 'Downloading';
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btnDownload.disabled = false;
      btnDownload.innerHTML = `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> <span>Download</span>`;
    }
  });

  // ==================== STOP DOWNLOAD ====================
  btnStop.addEventListener('click', async () => {
    try {
      await fetch('/api/download/stop', { method: 'POST' });
      showToast('Stopping downloader...', 'warning');
      btnStop.style.display = 'none';
      statusBadge.className = 'hud-status-badge';
      statusBadge.textContent = 'Stopping';
    } catch {
      showToast('Failed to stop download', 'error');
    }
  });

  // ==================== ENRICH METADATA BUTTON ====================
  btnEnrichAll.addEventListener('click', async () => {
    try {
      btnEnrichAll.disabled = true;
      btnEnrichAll.textContent = 'Enriching...';

      const res = await fetch('/api/enrich/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threads: 4, upgrade_artwork: true, force: false })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Enrichment failed');
      }

      showToast('Studio metadata enrichment active!', 'success');
      statusBadge.className = 'hud-status-badge active-enrich';
      statusBadge.textContent = 'Enriching';
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btnEnrichAll.disabled = false;
      btnEnrichAll.textContent = '✨ Enrich Studio Art & Tags';
    }
  });

  // ==================== REAL-TIME SSE STREAM ====================
  function initEventStream() {
    const evtSource = new EventSource('/api/events');

    evtSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const { type, data } = msg;

        if (type === 'playlist_loaded') {
          metricPlaylistName.textContent = data.title || 'Playlist';
          metricStatusMsg.textContent = `${data.total} tracks queued`;
          metricTotal.textContent = `0 / ${data.total}`;
          statusBadge.className = 'hud-status-badge active-download';
          statusBadge.textContent = 'Downloading';
        } else if (type === 'progress') {
          const { processed, total, percent, downloaded, skipped, last_song } = data;
          progressBar.style.width = `${percent}%`;
          metricPercent.textContent = `${percent}%`;
          metricTotal.textContent = `${processed} / ${total}`;
          metricDownloaded.textContent = downloaded || 0;
          metricSkipped.textContent = skipped || 0;

          if (last_song) {
            appendStreamRow(last_song);
          }
        } else if (type === 'enrich_progress') {
          const { current, total, percent, title, status } = data;
          progressBar.style.width = `${percent}%`;
          metricPercent.textContent = `${percent}%`;
          metricTotal.textContent = `${current} / ${total}`;
          metricStatusMsg.textContent = `${status || 'Enriching'}: ${title || ''}`;
        } else if (type === 'enrich_complete') {
          showToast(`✨ Enrichment complete! Updated ${data.updated || 0} tracks`, 'success');
          statusBadge.className = 'hud-status-badge';
          statusBadge.textContent = 'Idle';
          metricStatusMsg.textContent = 'Metadata & HD art enriched';
          loadLibrary();
        } else if (type === 'completed') {
          showToast(`Done! Downloaded ${data.downloaded} tracks (${data.time}s)`, 'success');
          btnStop.style.display = 'none';
          statusBadge.className = 'hud-status-badge';
          statusBadge.textContent = 'Idle';
          metricStatusMsg.textContent = 'Download session finished';
          loadLibrary();
        } else if (type === 'status') {
          metricStatusMsg.textContent = data.message || '';
        } else if (type === 'playback_command') {
          if (data.action === 'toggle') {
            togglePlay();
          } else if (data.action === 'play') {
            if (audioEngine.paused) togglePlay();
          } else if (data.action === 'pause') {
            if (!audioEngine.paused) togglePlay();
          } else if (data.action === 'next') {
            playNextTrack();
          } else if (data.action === 'prev') {
            playPrevTrack();
          } else if (data.action === 'seek' && typeof data.time === 'number') {
            audioEngine.currentTime = data.time;
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    evtSource.onerror = () => {
      setTimeout(initEventStream, 3000);
    };
  }

  function appendStreamRow(song) {
    const emptyState = streamFeed.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const row = document.createElement('div');
    row.className = 'feed-item';

    const statusClass = song.status === 'downloaded' ? 'downloaded' : (song.status === 'skipped' ? 'skipped' : 'failed');
    const statusLabel = song.status === 'downloaded' ? '⚡ 320k' : (song.status === 'skipped' ? '⏩ Cached' : '❌ Failed');
    const coverUrl = `/api/songs/artwork/${encodeURIComponent(song.filename || song.title + '.mp3')}`;

    row.innerHTML = `
      <div class="feed-item-left">
        <img class="feed-thumb" src="${coverUrl}" onerror="this.src='placeholder.svg'" alt="Cover" />
        <div class="feed-item-text truncate">
          <div class="feed-item-title truncate">${escapeHtml(song.title || 'Unknown Track')}</div>
          <div class="feed-item-artist truncate">${escapeHtml(song.artist || 'Unknown Artist')}</div>
        </div>
      </div>
      <div class="feed-item-right">
        <span class="status-chip ${statusClass}">${statusLabel}</span>
      </div>
    `;

    streamFeed.prepend(row);
    if (streamFeed.children.length > 30) {
      streamFeed.removeChild(streamFeed.lastChild);
    }
  }

  // ==================== LIBRARY LOADING, GROUPING & SORTING ====================
  async function loadLibrary(query = '') {
    try {
      const url = query ? `/api/songs?search=${encodeURIComponent(query)}` : '/api/songs';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load songs');

      rawLibrarySongs = await res.json();
      if (!query) {
        localStorage.setItem('musicstudio_cached_library', JSON.stringify(rawLibrarySongs));
      }
      navSongCount.textContent = rawLibrarySongs.length;
      if (mobileNavSongCount) mobileNavSongCount.textContent = rawLibrarySongs.length;
      libraryCountLabel.textContent = `${rawLibrarySongs.length} track${rawLibrarySongs.length === 1 ? '' : 's'}`;

      applySortAndFilter();
    } catch (e) {
      console.warn('Network issue fetching library, falling back to local cache:', e);
      const cached = localStorage.getItem('musicstudio_cached_library');
      if (cached) {
        try {
          rawLibrarySongs = JSON.parse(cached);
          navSongCount.textContent = rawLibrarySongs.length;
          if (mobileNavSongCount) mobileNavSongCount.textContent = rawLibrarySongs.length;
          libraryCountLabel.textContent = `${rawLibrarySongs.length} track${rawLibrarySongs.length === 1 ? '' : 's'} (Cached)`;
          applySortAndFilter();
          return;
        } catch (err) {}
      }
      libraryContainer.innerHTML = `<div class="empty-state glass"><p>No songs found. Connect to desktop server or download tracks to populate your library.</p></div>`;
    }
  }

  async function loadUserPlaylists() {
    try {
      const res = await fetch('/api/playlists');
      if (res.ok) {
        userPlaylists = await res.json();
        localStorage.setItem('musicstudio_cached_playlists', JSON.stringify(userPlaylists));
        if (currentGroupMode === 'playlists') {
          renderLibrary();
        }
      }
    } catch (e) {
      console.warn('Network issue fetching playlists, falling back to local cache:', e);
      const cached = localStorage.getItem('musicstudio_cached_playlists');
      if (cached) {
        try {
          userPlaylists = JSON.parse(cached);
          if (currentGroupMode === 'playlists') {
            renderLibrary();
          }
        } catch (err) {}
      }
    }
  }

  function applySortAndFilter() {
    let list = [...rawLibrarySongs];
    const q = (librarySearch.value || '').trim().toLowerCase();
    if (q) {
      list = list.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.album || '').toLowerCase().includes(q) ||
        (s.genre || '').toLowerCase().includes(q)
      );
    }

    if (currentSortMode === 'recent') {
      list.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    } else if (currentSortMode === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (currentSortMode === 'artist') {
      list.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    } else if (currentSortMode === 'duration') {
      list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    librarySongs = list;

    if (currentGroupMode === 'playlists' || currentGroupMode === 'most_played') {
      renderLibrary();
      return;
    }

    libraryCountLabel.textContent = `${librarySongs.length} track${librarySongs.length === 1 ? '' : 's'}`;
    generateShuffleQueue(currentSongIndex >= 0 ? currentSongIndex : -1);
    renderLibrary();
  }

  function renderLibrary() {
    libraryContainer.innerHTML = '';

    if (currentGroupMode === 'playlists') {
      if (viewSwitchWrap) viewSwitchWrap.style.display = 'none';
      libraryContainer.classList.add('grid-mode');
      libraryContainer.classList.remove('list-mode');
      renderPlaylistsGroupView();
      return;
    }

    if (currentGroupMode === 'most_played') {
      if (viewSwitchWrap) viewSwitchWrap.style.display = 'flex';
      renderMostPlayedGroupView();
      return;
    }

    if (librarySongs.length === 0) {
      libraryContainer.innerHTML = `
        <div class="empty-state glass" style="grid-column: 1 / -1; width: 100%;">
          <div class="empty-icon-wrap">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          </div>
          <p>No tracks matching criteria</p>
        </div>
      `;
      return;
    }

    if (currentGroupMode === 'tracks') {
      if (viewSwitchWrap) viewSwitchWrap.style.display = 'flex';
      const isGrid = libraryContainer.classList.contains('grid-mode');

      if (isGrid) {
        librarySongs.forEach((song, idx) => {
          const card = document.createElement('div');
          card.className = 'song-card' + (idx === currentSongIndex ? ' playing' : '');
          card.dataset.index = idx;
          const coverUrl = `/api/songs/artwork/${encodeURIComponent(song.filename)}`;

          card.innerHTML = `
            <div class="song-card-art-wrap">
              <img class="song-card-art" src="${coverUrl}" onerror="this.src='placeholder.svg'" alt="Cover" loading="lazy" />
              <div class="song-card-play-overlay">
                <div class="card-play-circle" title="Play">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
            </div>
            <div class="song-card-info">
              <div class="song-card-title truncate" title="${escapeHtml(song.title)}">${escapeHtml(song.title)}</div>
              <div class="song-card-artist truncate" title="${escapeHtml(song.artist)}">${escapeHtml(song.artist)}</div>
            </div>
          `;

          card.querySelector('.card-play-circle').addEventListener('click', (e) => {
            e.stopPropagation();
            playTrack(idx);
          });

          card.addEventListener('dblclick', () => {
            playTrack(idx);
          });

          card.addEventListener('click', () => {
            openDrawer(song, idx);
          });

          libraryContainer.appendChild(card);
        });
      } else {
        librarySongs.forEach((song, idx) => {
          const row = document.createElement('div');
          row.className = 'song-row' + (idx === currentSongIndex ? ' playing' : '');
          row.dataset.index = idx;
          const coverUrl = `/api/songs/artwork/${encodeURIComponent(song.filename)}`;
          const durationFormatted = formatSeconds(song.duration || 0);

          row.innerHTML = `
            <div class="song-row-left">
              <span class="song-row-num">${idx + 1}</span>
              <img class="song-row-thumb" src="${coverUrl}" onerror="this.src='placeholder.svg'" alt="Cover" />
              <div class="song-row-meta truncate">
                <div class="song-row-title truncate" title="${escapeHtml(song.title)}">${escapeHtml(song.title)}</div>
                <div class="song-row-artist truncate" title="${escapeHtml(song.artist)}">${escapeHtml(song.artist)}</div>
              </div>
            </div>
            <div class="song-row-album truncate">${escapeHtml(song.album || '—')}</div>
            <div class="song-row-duration">${durationFormatted}</div>
            <div class="song-row-actions">
              <button class="row-play-btn" title="Play Track">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
            </div>
          `;

          row.querySelector('.row-play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            playTrack(idx);
          });

          row.addEventListener('dblclick', () => {
            playTrack(idx);
          });

          row.addEventListener('click', () => {
            openDrawer(song, idx);
          });

          libraryContainer.appendChild(row);
        });
      }
    } else if (currentGroupMode === 'artists') {
      if (viewSwitchWrap) viewSwitchWrap.style.display = 'none';
      libraryContainer.classList.add('grid-mode');
      libraryContainer.classList.remove('list-mode');

      const artistMap = {};
      librarySongs.forEach(song => {
        const a = song.artist || 'Unknown Artist';
        if (!artistMap[a]) artistMap[a] = [];
        artistMap[a].push(song);
      });

      const artists = Object.keys(artistMap).sort((a, b) => a.localeCompare(b));
      artists.forEach(artist => {
        const songs = artistMap[artist];
        const repCover = `/api/songs/artwork/${encodeURIComponent(songs[0].filename)}`;
        const card = document.createElement('div');
        card.className = 'group-card';
        card.innerHTML = `
          <img class="artist-avatar" src="${repCover}" onerror="this.src='placeholder.svg'" alt="${escapeHtml(artist)}" />
          <div class="group-title truncate" title="${escapeHtml(artist)}">${escapeHtml(artist)}</div>
          <div class="group-sub">${songs.length} track${songs.length === 1 ? '' : 's'}</div>
        `;
        card.addEventListener('click', () => {
          librarySearch.value = artist;
          btnClearSearch.style.display = 'block';
          currentGroupMode = 'tracks';
          groupPills.forEach(p => p.classList.toggle('active', p.dataset.group === 'tracks'));
          applySortAndFilter();
        });
        libraryContainer.appendChild(card);
      });
    } else if (currentGroupMode === 'albums') {
      if (viewSwitchWrap) viewSwitchWrap.style.display = 'none';
      libraryContainer.classList.add('grid-mode');
      libraryContainer.classList.remove('list-mode');

      const albumMap = {};
      librarySongs.forEach(song => {
        const key = `${song.album || 'Unknown Album'}___${song.artist || ''}`;
        if (!albumMap[key]) {
          albumMap[key] = {
            album: song.album || 'Unknown Album',
            artist: song.artist || 'Unknown Artist',
            year: song.year || '',
            songs: []
          };
        }
        albumMap[key].songs.push(song);
      });

      const albums = Object.values(albumMap).sort((a, b) => a.album.localeCompare(b.album));
      albums.forEach(item => {
        const repCover = `/api/songs/artwork/${encodeURIComponent(item.songs[0].filename)}`;
        const card = document.createElement('div');
        card.className = 'group-card';
        card.innerHTML = `
          <div class="album-art-wrap">
            <img src="${repCover}" onerror="this.src='placeholder.svg'" alt="${escapeHtml(item.album)}" />
          </div>
          <div class="group-title truncate" title="${escapeHtml(item.album)}">${escapeHtml(item.album)}</div>
          <div class="group-sub truncate">${escapeHtml(item.artist)}${item.year ? ` • ${item.year}` : ''} • ${item.songs.length} tracks</div>
        `;
        card.addEventListener('click', () => {
          librarySearch.value = item.album;
          btnClearSearch.style.display = 'block';
          currentGroupMode = 'tracks';
          groupPills.forEach(p => p.classList.toggle('active', p.dataset.group === 'tracks'));
          applySortAndFilter();
        });
        libraryContainer.appendChild(card);
      });
    } else if (currentGroupMode === 'genres') {
      if (viewSwitchWrap) viewSwitchWrap.style.display = 'none';
      libraryContainer.classList.add('grid-mode');
      libraryContainer.classList.remove('list-mode');

      const genreMap = {};
      librarySongs.forEach(song => {
        const g = (song.genre || 'General').trim() || 'General';
        if (!genreMap[g]) genreMap[g] = [];
        genreMap[g].push(song);
      });

      const genres = Object.keys(genreMap).sort((a, b) => a.localeCompare(b));
      genres.forEach(genre => {
        const songs = genreMap[genre];
        const card = document.createElement('div');
        card.className = 'group-card';
        card.innerHTML = `
          <div class="genre-badge-icon">🎵</div>
          <div class="group-title truncate" title="${escapeHtml(genre)}">${escapeHtml(genre)}</div>
          <div class="group-sub">${songs.length} track${songs.length === 1 ? '' : 's'}</div>
        `;
        card.addEventListener('click', () => {
          librarySearch.value = genre;
          btnClearSearch.style.display = 'block';
          currentGroupMode = 'tracks';
          groupPills.forEach(p => p.classList.toggle('active', p.dataset.group === 'tracks'));
          applySortAndFilter();
        });
        libraryContainer.appendChild(card);
      });
    }
  }

  function renderPlaylistsGroupView() {
    libraryContainer.innerHTML = '';

    const isCustomPl = (p) => Boolean(p.is_custom) || p.type === 'custom';
    const customCount = userPlaylists.filter(p => !p.is_smart && isCustomPl(p)).length;
    const favCount = userPlaylists.filter(p => !p.is_smart && !isCustomPl(p)).length;

    // Sub-filters bar
    const filterBar = document.createElement('div');
    filterBar.className = 'playlist-filter-bar';
    filterBar.innerHTML = `
      <button class="playlist-filter-pill ${playlistSubFilter === 'all' ? 'active' : ''}" data-sub="all">All Playlists (${userPlaylists.length})</button>
      <button class="playlist-filter-pill ${playlistSubFilter === 'custom' ? 'active' : ''}" data-sub="custom">Custom (${customCount})</button>
      <button class="playlist-filter-pill ${playlistSubFilter === 'favorites' ? 'active' : ''}" data-sub="favorites">Saved (${favCount})</button>
    `;

    filterBar.querySelectorAll('.playlist-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        playlistSubFilter = btn.dataset.sub;
        renderPlaylistsGroupView();
      });
    });

    libraryContainer.appendChild(filterBar);

    let filtered = [...userPlaylists];
    if (playlistSubFilter === 'custom') {
      filtered = filtered.filter(p => !p.is_smart && isCustomPl(p));
    } else if (playlistSubFilter === 'favorites') {
      filtered = filtered.filter(p => !p.is_smart && !isCustomPl(p));
    }

    const q = (librarySearch.value || '').trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    libraryCountLabel.textContent = `${filtered.length} playlist${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state glass';
      empty.style.cssText = 'grid-column: 1 / -1; width: 100%; padding: 48px 20px;';
      empty.innerHTML = `
        <div class="empty-icon-wrap">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <p style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-top: 10px;">No playlists found</p>
        <span style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Create your personal custom playlist or save curated playlists from Discover</span>
        <button class="btn-primary" id="btn-empty-create-pl" style="margin-top: 16px;">+ Create New Playlist</button>
      `;
      const btn = empty.querySelector('#btn-empty-create-pl');
      if (btn) btn.addEventListener('click', openCreatePlaylistModal);
      libraryContainer.appendChild(empty);
      return;
    }

    filtered.forEach(playlist => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      const trackCount = playlist.track_count || (playlist.tracks ? playlist.tracks.length : 0);
      const isSmart = Boolean(playlist.is_smart) || playlist.id === 'smart_most_played';
      const isCustom = !isSmart && isCustomPl(playlist);
      const badgeClass = isSmart ? 'playlist-badge-smart' : (isCustom ? 'playlist-badge-custom' : 'playlist-badge-saved');
      const badgeText = isSmart ? '🔥 Top 100' : (isCustom ? 'Custom' : 'Saved');
      const coverSrc = playlist.cover_url || 'placeholder.svg';

      if (isSmart) card.classList.add('smart-card');

      card.innerHTML = `
        <div class="playlist-card-art-wrap">
          <img class="playlist-card-art" src="${coverSrc}" onerror="this.src='placeholder.svg'" alt="${escapeHtml(playlist.title)}" loading="lazy" />
          <span class="playlist-card-badge ${badgeClass}">${badgeText}</span>
          <button class="playlist-card-delete-btn" title="Delete Playlist">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <div class="playlist-card-overlay">
            <div class="playlist-card-open-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Open Collection</span>
            </div>
          </div>
        </div>
        <div class="playlist-card-info">
          <div class="playlist-card-title truncate" title="${escapeHtml(playlist.title)}">${escapeHtml(playlist.title)}</div>
          <div class="playlist-card-subtitle truncate">${escapeHtml(playlist.description || (isCustom ? 'Personal Studio Playlist' : 'Saved Collection'))} • ${trackCount} track${trackCount === 1 ? '' : 's'}</div>
        </div>
      `;

      const delBtn = card.querySelector('.playlist-card-delete-btn');
      if (isSmart && delBtn) {
        delBtn.style.display = 'none';
      } else if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Delete playlist "${playlist.title}"?`)) {
            deleteUserPlaylist(playlist.id);
          }
        });
      }

      card.addEventListener('click', () => {
        openPlaylistModal(playlist.id, false, playlist);
      });

      libraryContainer.appendChild(card);
    });
  }

  async function deleteUserPlaylist(playlistId) {
    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete playlist');
      }
      showToast('Playlist deleted successfully', 'info');
      await loadUserPlaylists();
      renderLibrary();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function renderMostPlayedGroupView() {
    libraryContainer.innerHTML = '';
    
    let topTracks = [];
    try {
      const res = await fetch('/api/play-stats/most-played?limit=100');
      if (res.ok) {
        topTracks = await res.json();
      }
    } catch (e) {}

    if (!topTracks.length) {
      const stored = JSON.parse(localStorage.getItem('musicstudio_play_counts') || '{}');
      topTracks = librarySongs.map(s => {
        const key = s.filename || `${(s.title||'').toLowerCase()} - ${(s.artist||'').toLowerCase()}`;
        return { ...s, play_count: stored[key] || 0 };
      }).filter(s => s.play_count > 0).sort((a,b) => b.play_count - a.play_count);
    }

    const q = (librarySearch.value || '').trim().toLowerCase();
    if (q) {
      topTracks = topTracks.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.album || '').toLowerCase().includes(q)
      );
    }

    libraryCountLabel.textContent = `${topTracks.length} track${topTracks.length === 1 ? '' : 's'}`;

    if (topTracks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state glass';
      empty.style.cssText = 'grid-column: 1 / -1; width: 100%; padding: 48px 20px;';
      empty.innerHTML = `
        <div class="empty-icon-wrap" style="color: #f97316; font-size: 28px;">🔥</div>
        <p style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-top: 10px;">No played tracks recorded yet</p>
        <span style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Play your favorite songs in Music Studio and they will automatically rank here in your Top 100!</span>
      `;
      libraryContainer.appendChild(empty);
      return;
    }

    const isGrid = libraryContainer.classList.contains('grid-mode');
    if (isGrid) {
      topTracks.forEach((song, idx) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        const coverUrl = song.cover_url || (song.filename ? `/api/songs/artwork/${encodeURIComponent(song.filename)}` : 'placeholder.svg');

        card.innerHTML = `
          <div class="song-card-art-wrap">
            <img class="song-card-art" src="${coverUrl}" onerror="this.src='placeholder.svg'" alt="Cover" loading="lazy" />
            <div class="song-card-play-overlay">
              <div class="card-play-circle" title="Play">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div class="play-count-badge" style="position: absolute; top: 8px; left: 8px; z-index: 2;">🔥 ${song.play_count || 1}</div>
          </div>
          <div class="song-card-info">
            <div class="song-card-title truncate" title="${escapeHtml(song.title)}">${escapeHtml(song.title)}</div>
            <div class="song-card-artist truncate" title="${escapeHtml(song.artist)}">${escapeHtml(song.artist)}</div>
          </div>
        `;

        card.querySelector('.card-play-circle').addEventListener('click', (e) => {
          e.stopPropagation();
          playTopTrack(song, topTracks, idx);
        });
        card.addEventListener('dblclick', () => playTopTrack(song, topTracks, idx));
        card.addEventListener('click', () => openDrawer(song, idx));
        libraryContainer.appendChild(card);
      });
    } else {
      topTracks.forEach((song, idx) => {
        const row = document.createElement('div');
        row.className = 'song-row';
        const coverUrl = song.cover_url || (song.filename ? `/api/songs/artwork/${encodeURIComponent(song.filename)}` : 'placeholder.svg');

        row.innerHTML = `
          <div class="col-index">
            <span class="index-num" style="color: #f97316; font-weight: 700;">#${idx + 1}</span>
            <div class="row-play-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
          <div class="col-title">
            <img class="song-row-thumb" src="${coverUrl}" onerror="this.src='placeholder.svg'" alt="Thumb" loading="lazy" />
            <div class="song-title-group">
              <div class="song-row-title truncate" title="${escapeHtml(song.title)}">${escapeHtml(song.title)}</div>
              <div class="song-row-artist truncate" title="${escapeHtml(song.artist)}">${escapeHtml(song.artist)}</div>
            </div>
            <div class="play-count-badge">🔥 ${song.play_count || 1} play${song.play_count === 1 ? '' : 's'}</div>
          </div>
          <div class="col-album truncate" title="${escapeHtml(song.album || 'Top 100')}">${escapeHtml(song.album || 'Top 100')}</div>
          <div class="col-duration">${song.duration ? formatSeconds(song.duration) : '--:--'}</div>
        `;

        row.addEventListener('click', () => openDrawer(song, idx));
        row.addEventListener('dblclick', () => playTopTrack(song, topTracks, idx));
        const pBtn = row.querySelector('.row-play-btn');
        if (pBtn) {
          pBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playTopTrack(song, topTracks, idx);
          });
        }
        libraryContainer.appendChild(row);
      });
    }
  }

  function playTopTrack(song, queue, idx) {
    if (song.filename) {
      const matchIdx = librarySongs.findIndex(s => s.filename === song.filename);
      if (matchIdx >= 0) {
        playTrack(matchIdx);
        return;
      }
    }
    playStreamTrack(song, queue, idx);
  }

  // View switchers
  viewGridBtn.addEventListener('click', () => {
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    libraryContainer.className = 'library-container grid-mode';
    renderLibrary();
  });

  viewListBtn.addEventListener('click', () => {
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    libraryContainer.className = 'library-container list-mode';
    renderLibrary();
  });

  // Grouping Pills & Sort Select Listeners
  groupPills.forEach(pill => {
    pill.addEventListener('click', () => {
      groupPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentGroupMode = pill.dataset.group;
      renderLibrary();
    });
  });

  if (librarySortSelect) {
    librarySortSelect.addEventListener('change', (e) => {
      currentSortMode = e.target.value;
      applySortAndFilter();
    });
  }

  // Library Search (Instant in-memory filtering)
  librarySearch.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    btnClearSearch.style.display = q ? 'block' : 'none';
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      applySortAndFilter();
    }, 150);
  });

  btnClearSearch.addEventListener('click', () => {
    librarySearch.value = '';
    btnClearSearch.style.display = 'none';
    applySortAndFilter();
  });

  btnRefreshLibrary.addEventListener('click', () => {
    loadLibrary(librarySearch.value.trim());
    loadUserPlaylists();
    showToast('Library refreshed');
  });

  // ==================== TRACK INSPECTOR DRAWER ====================
  function openDrawer(song, idx) {
    selectedSong = song;
    currentSongIndex = idx;
    const coverUrl = `/api/songs/artwork/${encodeURIComponent(song.filename)}`;

    drawerCover.src = coverUrl;
    drawerBitrate.textContent = song.bitrate || '320 kbps';
    drawerTitle.textContent = song.title || 'Unknown Title';
    drawerArtist.textContent = song.artist || 'Unknown Artist';
    drawerGenre.textContent = song.genre || 'Music';
    drawerYear.textContent = song.year || 'Studio Audio';
    drawerSize.textContent = `${song.size_mb || 0} MB`;
    drawerAlbum.textContent = song.album || '—';
    drawerDuration.textContent = formatSeconds(song.duration || 0);
    drawerFilename.textContent = song.filename || '';

    if (song.collaborators && song.collaborators.length > 0) {
      drawerCollabRow.style.display = 'flex';
      drawerCollab.textContent = song.collaborators.join(', ');
    } else {
      drawerCollabRow.style.display = 'none';
    }

    trackDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    if (trackDrawer) trackDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.remove('open');
  }

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDrawer();
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDrawer();
    });
  }

  if (drawerPlayBtn) {
    drawerPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentSongIndex >= 0 && currentSongIndex < librarySongs.length) {
        playTrack(currentSongIndex);
      }
    });
  }

  // ==================== DISCOVER & EXPLORE LOGIC ====================
  async function loadExplore() {
    try {
      const res = await fetch('/api/explore/featured');
      if (!res.ok) throw new Error('Failed to load explore feed');
      const data = await res.json();

      renderFeaturedPlaylists(data.featured || []);
      renderTrendingTracks(data.trending || []);
    } catch (e) {
      console.error('Error loading explore feed:', e);
    }
  }

  function renderFeaturedPlaylists(playlists) {
    if (!featuredPlaylistsGrid) return;
    featuredPlaylistsGrid.innerHTML = '';

    playlists.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      card.innerHTML = `
        <div class="playlist-card-art-wrap">
          <img class="playlist-card-art" src="${pl.cover_url}" alt="${escapeHtml(pl.title)}" loading="lazy" />
          <span class="playlist-card-badge">${escapeHtml(pl.badge || 'Playlist')}</span>
          <div class="playlist-card-overlay">
            <div class="playlist-card-open-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Explore Songs</span>
            </div>
          </div>
        </div>
        <div class="playlist-card-info">
          <div class="playlist-card-title truncate" title="${escapeHtml(pl.title)}">${escapeHtml(pl.title)}</div>
          <div class="playlist-card-subtitle truncate" title="${escapeHtml(pl.subtitle)}">${escapeHtml(pl.subtitle)}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        openPlaylistModal(pl.id);
      });

      featuredPlaylistsGrid.appendChild(card);
    });
  }

  let trendingTracksQueue = [];
  let currentStreamingTrack = null;
  let isOnlineStreaming = false;
  let currentOnlineQueue = [];
  let currentOnlineQueueIndex = -1;

  function normalizeSongString(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findLocalLibraryMatch(track) {
    if (!rawLibrarySongs || !rawLibrarySongs.length || !track) return null;
    const tTitle = normalizeSongString(track.title);
    const tArtist = normalizeSongString(track.artist);
    if (!tTitle) return null;

    // 1. Exact match on title and artist
    for (const song of rawLibrarySongs) {
      const sTitle = normalizeSongString(song.title);
      const sArtist = normalizeSongString(song.artist);
      if (sTitle === tTitle && (!tArtist || !sArtist || sArtist.includes(tArtist) || tArtist.includes(sArtist))) {
        return song;
      }
    }

    // 2. Loose match: title contains or filename contains
    for (const song of rawLibrarySongs) {
      const sTitle = normalizeSongString(song.title);
      const sFile = normalizeSongString(song.filename);
      if (sTitle && tTitle && (sTitle.includes(tTitle) || tTitle.includes(sTitle))) {
        return song;
      }
      if (sFile && tTitle && sFile.includes(tTitle)) {
        return song;
      }
    }
    return null;
  }

  function updateStreamingDownloadUI(isSaved, isDownloading) {
    const dockQuickDl = document.getElementById('dock-quick-dl-btn');
    const dockDlText = document.querySelector('.dock-dl-label');
    const fsSaveBtn = document.getElementById('fs-save-btn');
    const fsSaveText = document.getElementById('fs-save-text');

    if (isSaved) {
      if (dockQuickDl) {
        dockQuickDl.classList.add('saved');
        dockQuickDl.classList.remove('downloading');
        dockQuickDl.title = 'Saved in Library';
      }
      if (dockDlText) dockDlText.textContent = 'Saved';
      if (fsSaveBtn) {
        fsSaveBtn.classList.add('saved');
        fsSaveBtn.classList.remove('downloading');
        fsSaveBtn.disabled = true;
      }
      if (fsSaveText) fsSaveText.textContent = '✓ Saved in Library';
    } else if (isDownloading) {
      if (dockQuickDl) {
        dockQuickDl.classList.add('downloading');
        dockQuickDl.classList.remove('saved');
        dockQuickDl.title = 'Saving to Library...';
      }
      if (dockDlText) dockDlText.textContent = 'Saving...';
      if (fsSaveBtn) {
        fsSaveBtn.classList.add('downloading');
        fsSaveBtn.classList.remove('saved');
        fsSaveBtn.disabled = true;
      }
      if (fsSaveText) fsSaveText.textContent = 'Saving to Library (320k)...';
    } else {
      if (dockQuickDl) {
        dockQuickDl.classList.remove('saved', 'downloading');
        dockQuickDl.disabled = false;
        dockQuickDl.title = 'Save to Library (320 kbps MP3)';
      }
      if (dockDlText) dockDlText.textContent = 'Save';
      if (fsSaveBtn) {
        fsSaveBtn.classList.remove('saved', 'downloading');
        fsSaveBtn.disabled = false;
        fsSaveBtn.title = 'Save to Library (320 kbps Master)';
      }
      if (fsSaveText) fsSaveText.textContent = 'Save to Library (320 kbps)';
    }
  }

  async function saveCurrentStreamingTrack() {
    if (!currentStreamingTrack) return;
    const track = currentStreamingTrack;
    updateStreamingDownloadUI(false, true);

    try {
      await downloadSingleTrack(track);
      updateStreamingDownloadUI(true, false);
      showToast(`✓ Saved "${track.title}" to library!`, 'success');
    } catch (e) {
      updateStreamingDownloadUI(false, false);
      showToast(e.message || 'Download failed', 'error');
    }
  }

  function renderTrendingTracks(tracks) {
    if (!trendingTracksGrid) return;
    trendingTracksGrid.innerHTML = '';
    trendingTracksQueue = tracks || [];

    tracks.forEach((track, idx) => {
      const card = createExploreTrackCard(track, trendingTracksQueue, idx);
      trendingTracksGrid.appendChild(card);
    });
  }

  function createExploreTrackCard(track, queue = [], idx = -1) {
    const card = document.createElement('div');
    card.className = 'explore-song-card';

    const durationText = (track.duration && track.duration > 0) ? formatSeconds(track.duration) : '3:30';
    const coverUrl = track.cover_url || 'placeholder.svg';
    const isSaved = !!findLocalLibraryMatch(track);

    card.innerHTML = `
      <div class="explore-song-thumb-wrap">
        <img class="explore-song-thumb" src="${coverUrl}" onerror="this.src='placeholder.svg'" alt="Cover" />
        <div class="explore-song-preview-overlay" title="Play Full Track Online (Stream)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
      <div class="explore-song-info">
        <div class="explore-song-title truncate" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</div>
        <div class="explore-song-artist truncate" title="${escapeHtml(track.artist)}">${escapeHtml(track.artist)}</div>
        <div class="explore-song-meta">${durationText} • Studio Master</div>
      </div>
      <div class="explore-song-actions">
        <button class="btn-quick-download ${isSaved ? 'downloaded' : ''}" title="${isSaved ? 'In Library' : 'Save to Library (320 kbps)'}">
          ${isSaved ? `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Added</span>
          ` : `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Get</span>
          `}
        </button>
      </div>
    `;

    // Clicking play overlay or song info plays full track online without downloading!
    const playHandler = (e) => {
      e.stopPropagation();
      playOnlineTrack(track, queue, idx);
    };

    const previewBtn = card.querySelector('.explore-song-preview-overlay');
    if (previewBtn) previewBtn.addEventListener('click', playHandler);
    const infoSection = card.querySelector('.explore-song-info');
    if (infoSection) infoSection.addEventListener('click', playHandler);

    // 1-click Download / Save
    const downloadBtn = card.querySelector('.btn-quick-download');
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (downloadBtn.classList.contains('downloaded')) {
        showToast(`"${track.title}" is already in your library`, 'info');
        return;
      }
      downloadSingleTrack(track, downloadBtn);
    });

    return card;
  }

  function playOnlineTrack(track, queue = [], index = -1) {
    if (!track) return;

    // Check if song already exists locally in user's library
    const localMatch = findLocalLibraryMatch(track);
    if (localMatch) {
      const localIdx = librarySongs.findIndex(s => s.filename === localMatch.filename);
      if (localIdx >= 0) {
        showToast(`Playing local library file: ${localMatch.title}`, 'info');
        playTrack(localIdx);
        return;
      }
    }

    isOnlineStreaming = true;
    currentSongIndex = -1;
    currentStreamingTrack = track;
    hasRecordedPlayForCurrentTrack = false;

    if (queue && queue.length) {
      currentOnlineQueue = queue;
      currentOnlineQueueIndex = index >= 0 ? index : queue.findIndex(t => t.title === track.title && t.artist === track.artist);
    } else {
      currentOnlineQueue = [track];
      currentOnlineQueueIndex = 0;
    }

    const query = track.query || `${track.title} ${track.artist}`;
    const streamEndpoint = resolveApiUrl(`/api/stream?q=${encodeURIComponent(query)}`);
    const coverUrl = track.cover_url || 'placeholder.svg';
    const totalSec = (track.duration && track.duration > 0) ? track.duration : 0;

    audioEngine.src = streamEndpoint;
    audioEngine.load();
    const playPromise = audioEngine.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        updatePlayIcon(false);
      });
    }

    // Update Dock
    playerCover.src = coverUrl;
    playerTitle.textContent = track.title || 'Unknown Track';
    playerArtist.textContent = track.artist || 'Online Stream';
    playerScrubber.value = 0;
    updateScrubberFill(0);
    playerCurrentTime.textContent = '0:00';
    playerTotalTime.textContent = totalSec ? formatSeconds(totalSec) : '--:--';

    const dockStreamBadge = document.getElementById('dock-stream-badge');
    if (dockStreamBadge) dockStreamBadge.style.display = 'inline-block';
    const dockQuickDl = document.getElementById('dock-quick-dl-btn');
    if (dockQuickDl) {
      dockQuickDl.style.display = 'inline-flex';
      updateStreamingDownloadUI(false, false);
    }

    // Synchronize to Fullscreen "Now Playing" Overlay
    if (fsCover) fsCover.src = coverUrl;
    if (fsTitle) fsTitle.textContent = track.title || 'Unknown Track';
    if (fsArtist) fsArtist.textContent = track.artist || 'Online Stream';
    if (fsAlbum) fsAlbum.textContent = track.album || 'Online Stream Master';
    if (fsScrubber) {
      fsScrubber.value = 0;
      updateFsScrubberFill(0);
    }
    if (fsCurrentTime) fsCurrentTime.textContent = '0:00';
    if (fsTotalTime) fsTotalTime.textContent = totalSec ? formatSeconds(totalSec) : '--:--';

    const fsStreamActions = document.getElementById('fs-stream-actions');
    if (fsStreamActions) fsStreamActions.style.display = 'flex';
    const fsStreamBadge = document.getElementById('fs-stream-badge-floating');
    if (fsStreamBadge) fsStreamBadge.style.display = 'inline-flex';

    // Synchronize to Mac Notch HUD & HTML5 MediaSession
    setupMediaSession({
      title: track.title || 'Unknown Track',
      artist: track.artist || 'Online Stream',
      album: track.album || 'Online Stream Master',
      artwork_url: coverUrl,
      duration: totalSec
    });
    updateNotchHUD({
      title: track.title || 'Unknown Track',
      artist: track.artist || 'Online Stream',
      artwork_url: coverUrl,
      duration: totalSec
    });

    isPlaying = true;
    updatePlayIcon(true);
    highlightPlayingRow();
    showToast(`Streaming live: ${track.title} - ${track.artist}`, 'info');
  }

  function previewTrackAudio(track) {
    playOnlineTrack(track);
  }

  async function downloadSingleTrack(track, btnEl) {
    if (btnEl) {
      btnEl.classList.add('downloading');
      btnEl.innerHTML = `<span class="pulse-dot"></span> <span>Saving...</span>`;
    }

    try {
      const res = await fetch('/api/download/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          album: track.album || 'Single',
          cover_url: track.cover_url,
          query: track.query || `${track.title} ${track.artist}`,
          quality: settingQuality ? settingQuality.value : '320k',
          naming: settingNaming ? settingNaming.value : 'title'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Download request failed');
      }

      showToast(`Downloading: ${track.title}`, 'success');
      statusBadge.className = 'hud-status-badge active-download';
      statusBadge.textContent = 'Downloading';

      if (btnEl) {
        btnEl.classList.remove('downloading');
        btnEl.classList.add('downloaded');
        btnEl.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>Added</span>`;
      }
    } catch (e) {
      showToast(e.message, 'error');
      if (btnEl) {
        btnEl.classList.remove('downloading');
        btnEl.innerHTML = `<span>Retry</span>`;
      }
    }
  }

  // ==================== LIVE SEARCH ====================
  if (exploreSearchInput) {
    exploreSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (btnClearExploreSearch) {
        btnClearExploreSearch.style.display = q ? 'block' : 'none';
      }
      clearTimeout(exploreSearchDebounce);
      if (!q) {
        exploreSearchSection.style.display = 'none';
        return;
      }
      exploreSearchDebounce = setTimeout(() => {
        performExploreSearch(q);
      }, 250);
    });
  }

  if (btnClearExploreSearch) {
    btnClearExploreSearch.addEventListener('click', () => {
      exploreSearchInput.value = '';
      btnClearExploreSearch.style.display = 'none';
      exploreSearchSection.style.display = 'none';
    });
  }

  // Search Hint Pills
  document.querySelectorAll('.hint-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const q = pill.getAttribute('data-query');
      if (exploreSearchInput && q) {
        exploreSearchInput.value = q;
        if (btnClearExploreSearch) btnClearExploreSearch.style.display = 'block';
        performExploreSearch(q);
      }
    });
  });

  // Search Filter Pills Listener
  document.querySelectorAll('.search-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.search-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentSearchFilter = pill.getAttribute('data-filter') || 'all';
      renderSearchResults(exploreSearchInput ? exploreSearchInput.value.trim() : '');
    });
  });

  async function performExploreSearch(q) {
    if (!q) return;
    try {
      exploreSearchSection.style.display = 'block';
      exploreSearchTitle.textContent = `Searching for "${q}"...`;
      exploreSearchCount.textContent = 'Fetching songs & albums...';

      const res = await fetch(`/api/explore/search?q=${encodeURIComponent(q)}&type=all`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      currentSearchResults = {
        tracks: data.tracks || data.results || [],
        albums: data.albums || []
      };

      renderSearchResults(q);
    } catch (e) {
      exploreSearchTitle.textContent = 'Search Error';
      exploreSearchCount.textContent = e.message;
    }
  }

  function renderSearchResults(q = '') {
    const { tracks, albums } = currentSearchResults;
    const searchFilter = currentSearchFilter;
    const queryStr = q || (exploreSearchInput ? exploreSearchInput.value.trim() : '');

    const hasAlbums = albums && albums.length > 0;
    const hasTracks = tracks && tracks.length > 0;

    const showAlbums = (searchFilter === 'all' || searchFilter === 'albums') && hasAlbums;
    const showTracks = (searchFilter === 'all' || searchFilter === 'tracks') && hasTracks;

    exploreSearchTitle.textContent = `Results for "${queryStr}"`;

    if (searchFilter === 'all') {
      exploreSearchCount.textContent = `${albums.length} albums • ${tracks.length} songs found`;
    } else if (searchFilter === 'albums') {
      exploreSearchCount.textContent = `${albums.length} albums found`;
    } else {
      exploreSearchCount.textContent = `${tracks.length} songs found`;
    }

    // Render Albums Section
    if (showAlbums && searchAlbumsContainer && searchAlbumsGrid) {
      searchAlbumsContainer.style.display = 'block';
      if (searchAlbumsBadge) searchAlbumsBadge.textContent = `${albums.length} albums`;
      searchAlbumsGrid.innerHTML = '';
      albums.forEach(album => {
        const card = createSearchAlbumCard(album);
        searchAlbumsGrid.appendChild(card);
      });
    } else if (searchAlbumsContainer) {
      searchAlbumsContainer.style.display = 'none';
    }

    // Render Tracks Section
    if (showTracks && searchTracksContainer && exploreSearchGrid) {
      searchTracksContainer.style.display = 'block';
      if (searchTracksSubTitle) {
        searchTracksSubTitle.style.display = (searchFilter === 'all' && hasAlbums) ? 'block' : 'none';
      }
      exploreSearchGrid.innerHTML = '';
      tracks.forEach(track => {
        const card = createExploreTrackCard(track);
        exploreSearchGrid.appendChild(card);
      });
    } else if (searchTracksContainer) {
      searchTracksContainer.style.display = 'none';
    }

    // Empty state
    if (!hasAlbums && !hasTracks) {
      if (searchAlbumsContainer) searchAlbumsContainer.style.display = 'none';
      if (searchTracksContainer) searchTracksContainer.style.display = 'block';
      exploreSearchGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>No results found for "${escapeHtml(queryStr)}". Try searching another artist, band, or song title.</p></div>`;
    }
  }

  function createSearchAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'search-album-card';
    const coverUrl = album.cover_url || 'placeholder.svg';
    const trackCountText = album.track_count ? `${album.track_count} Tracks` : 'Album';
    const metaText = album.year ? `${album.year} • ${trackCountText}` : trackCountText;

    card.innerHTML = `
      <div class="album-card-art-wrap">
        <img class="album-card-art" src="${coverUrl}" onerror="this.src='placeholder.svg'" alt="Cover" />
        <span class="album-card-badge">Album</span>
      </div>
      <div class="album-card-info">
        <div class="album-card-title truncate" title="${escapeHtml(album.title)}">${escapeHtml(album.title)}</div>
        <div class="album-card-artist truncate" title="${escapeHtml(album.artist)}">${escapeHtml(album.artist)}</div>
        <div class="album-card-meta">${escapeHtml(metaText)}</div>
      </div>
      <div class="album-card-actions">
        <button class="btn-album-download" title="Download Entire Album (${trackCountText})">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Download Album</span>
        </button>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-album-download')) return;
      openPlaylistModal(`album_${album.id}`);
    });

    const btnDownload = card.querySelector('.btn-album-download');
    btnDownload.addEventListener('click', async (e) => {
      e.stopPropagation();
      downloadEntireAlbum(album, btnDownload);
    });

    return card;
  }

  async function downloadEntireAlbum(album, btnEl) {
    if (btnEl) {
      btnEl.classList.add('downloading');
      btnEl.innerHTML = `<span class="pulse-dot"></span> <span>Fetching...</span>`;
    }
    try {
      const res = await fetch(`/api/explore/album/${album.id}`);
      if (!res.ok) throw new Error('Failed to fetch album tracks');
      const data = await res.json();
      await downloadEntirePlaylist(data);
      if (btnEl) {
        btnEl.classList.remove('downloading');
        btnEl.classList.add('downloaded');
        btnEl.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>Queued (${data.tracks ? data.tracks.length : 0})</span>`;
      }
    } catch (err) {
      showToast(err.message, 'error');
      if (btnEl) {
        btnEl.classList.remove('downloading');
        btnEl.innerHTML = `<span>Error</span>`;
      }
    }
  }

  // ==================== PLAYLIST & ALBUM PREVIEW MODAL ====================
  async function openPlaylistModal(playlistId, isAlbumParam = false, existingData = null) {
    if (!playlistModal) return;
    playlistModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    let data = existingData || null;

    if (!data) {
      const isAlbum = isAlbumParam || String(playlistId).startsWith('album_') || String(playlistId).startsWith('album-');
      if (modalBadge) modalBadge.textContent = isAlbum ? 'OFFICIAL ALBUM' : 'CURATED COLLECTION';
      modalTitle.textContent = isAlbum ? 'Loading album...' : 'Loading playlist...';
      modalSubtitle.textContent = 'Fetching tracklist and studio metadata...';
      modalTrackCount.textContent = '...';
      modalTracklist.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-tertiary);"><span class="pulse-dot"></span> Loading tracks...</div>`;

      try {
        let res = await fetch(`/api/explore/playlist/${encodeURIComponent(playlistId)}`);
        if (!res.ok) {
          res = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}`);
        }
        if (!res.ok) throw new Error('Failed to load collection');
        data = await res.json();
      } catch (e) {
        modalTitle.textContent = 'Error Loading Collection';
        modalSubtitle.textContent = e.message;
        modalTracklist.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-tertiary);">${e.message}</div>`;
        return;
      }
    }

    currentModalPlaylist = data;
    const isCustom = Boolean(data.is_custom) || data.type === 'custom';
    const isAlbType = (data.type === 'album' || isAlbumParam || String(data.id || '').startsWith('album_'));

    modalTitle.textContent = data.title;
    modalSubtitle.textContent = data.subtitle || data.description || (isCustom ? 'Personal Custom Playlist' : (isAlbType ? `${data.artist || 'Artist'} • Album Master` : 'Curated Studio Collection'));
    modalCover.src = data.cover_url || 'placeholder.svg';
    const count = (data.tracks ? data.tracks.length : (data.track_count || 0));
    modalTrackCount.textContent = `${count} track${count === 1 ? '' : 's'}`;

    if (modalBadge) {
      modalBadge.textContent = isCustom ? 'CUSTOM PLAYLIST' : (isAlbType ? 'OFFICIAL ALBUM' : 'CURATED COLLECTION');
    }

    // Check favorite state
    updateModalFavoriteBtnState();

    if (btnModalDownloadAll) {
      btnModalDownloadAll.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>${isAlbType ? `Download Entire Album (${count} Songs)` : 'Download Entire Playlist'}</span>
      `;

      btnModalDownloadAll.onclick = () => {
        downloadEntirePlaylist(data);
      };
    }

    renderModalTracklist(data.tracks || []);
  }

  function updateModalFavoriteBtnState() {
    if (!btnModalFavorite) return;
    if (!currentModalPlaylist) {
      btnModalFavorite.style.display = 'none';
      return;
    }
    if (Boolean(currentModalPlaylist.is_custom) || currentModalPlaylist.type === 'custom') {
      btnModalFavorite.style.display = 'none';
      return;
    }
    btnModalFavorite.style.display = 'inline-flex';
    const isFav = userPlaylists.some(p => p.id === currentModalPlaylist.id || (!p.is_custom && p.title === currentModalPlaylist.title));
    if (isFav) {
      btnModalFavorite.classList.add('favorited');
      if (modalFavText) modalFavText.textContent = 'Favorited ♥';
    } else {
      btnModalFavorite.classList.remove('favorited');
      if (modalFavText) modalFavText.textContent = 'Save Playlist';
    }
  }

  if (btnModalFavorite) {
    btnModalFavorite.addEventListener('click', async () => {
      if (!currentModalPlaylist) return;
      const alreadyFav = userPlaylists.some(p => p.id === currentModalPlaylist.id || (!p.is_custom && p.title === currentModalPlaylist.title));
      if (alreadyFav) {
        showToast(`"${currentModalPlaylist.title}" is already saved in your Library!`, 'info');
        return;
      }

      try {
        btnModalFavorite.disabled = true;
        const res = await fetch('/api/playlists/favorite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentModalPlaylist.id,
            title: currentModalPlaylist.title,
            description: currentModalPlaylist.subtitle || currentModalPlaylist.description || '',
            cover_url: currentModalPlaylist.cover_url || '',
            tracks: currentModalPlaylist.tracks || []
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to save playlist');
        }

        showToast(`Saved "${currentModalPlaylist.title}" to your Playlists!`, 'success');
        btnModalFavorite.classList.add('favorited');
        if (modalFavText) modalFavText.textContent = 'Favorited ♥';
        await loadUserPlaylists();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        btnModalFavorite.disabled = false;
      }
    });
  }

  function closePlaylistModal() {
    if (!playlistModal) return;
    playlistModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closePlaylistModal);
  if (playlistModalBackdrop) playlistModalBackdrop.addEventListener('click', closePlaylistModal);

  function renderModalTracklist(tracks) {
    modalTracklist.innerHTML = '';
    if (!tracks.length) {
      modalTracklist.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-tertiary);">No tracks found in this collection.</div>`;
      return;
    }

    const isCustom = currentModalPlaylist && (Boolean(currentModalPlaylist.is_custom) || currentModalPlaylist.type === 'custom');

    tracks.forEach((track, idx) => {
      const row = document.createElement('div');
      row.className = 'modal-track-row';
      const durationText = (track.duration && track.duration > 0) ? formatSeconds(track.duration) : '3:30';
      const coverUrl = track.cover_url || 'placeholder.svg';

      row.innerHTML = `
        <span class="row-num">${idx + 1}</span>
        <div class="row-meta">
          <img class="row-thumb" src="${coverUrl}" onerror="this.src='placeholder.svg'" alt="Cover" />
          <div class="row-text">
            <div class="row-title truncate" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</div>
            <div class="row-artist truncate" title="${escapeHtml(track.artist)}">${escapeHtml(track.artist)}</div>
          </div>
        </div>
        <div class="row-album truncate" title="${escapeHtml(track.album || '')}">${escapeHtml(track.album || '—')}</div>
        <div class="row-time">${durationText}</div>
        <div class="row-actions">
          <button class="btn-row-preview" title="Play Track">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="btn-row-add-pl" title="Add to Playlist">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          ${isCustom ? `
          <button class="btn-row-remove-pl" title="Remove from Playlist">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          ` : `
          <button class="btn-row-download" title="Download This Track">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          `}
        </div>
      `;

      // Preview audio listener
      const prevBtn = row.querySelector('.btn-row-preview');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          playOnlineTrack(track, tracks, idx);
        });
      }

      // Add to playlist listener
      const addPlBtn = row.querySelector('.btn-row-add-pl');
      if (addPlBtn) {
        addPlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openAddToPlaylistModal(track);
        });
      }

      // If custom playlist, remove track listener
      const removeBtn = row.querySelector('.btn-row-remove-pl');
      if (removeBtn) {
        removeBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            const res = await fetch(`/api/playlists/${encodeURIComponent(currentModalPlaylist.id)}/tracks/${idx}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              const updated = await res.json();
              currentModalPlaylist.tracks = updated.tracks;
              renderModalTracklist(currentModalPlaylist.tracks);
              modalTrackCount.textContent = `${currentModalPlaylist.tracks.length} track${currentModalPlaylist.tracks.length === 1 ? '' : 's'}`;
              showToast(`Removed from playlist`, 'info');
              loadUserPlaylists();
            }
          } catch (err) {
            showToast('Failed to remove track', 'error');
          }
        });
      }

      // Download single track listener
      const dlBtn = row.querySelector('.btn-row-download');
      if (dlBtn) {
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadSingleTrack(track, dlBtn);
        });
      }

      modalTracklist.appendChild(row);
    });
  }

  // ==================== CREATE PLAYLIST MODAL HANDLERS ====================
  function openCreatePlaylistModal() {
    if (!createPlaylistModal) return;
    createPlaylistModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    pendingCoverBase64 = null;
    if (coverPreviewImg) coverPreviewImg.src = 'placeholder.svg';
    if (playlistNameInput) {
      playlistNameInput.value = '';
      setTimeout(() => playlistNameInput.focus(), 100);
    }
    if (playlistDescInput) playlistDescInput.value = '';
    if (playlistUrlInput) playlistUrlInput.value = '';
    if (playlistFileInput) playlistFileInput.value = '';
  }

  function closeCreatePlaylistModal() {
    if (!createPlaylistModal) return;
    createPlaylistModal.style.display = 'none';
    document.body.style.overflow = '';
    pendingCoverBase64 = null;
  }

  if (btnCreatePlaylist) btnCreatePlaylist.addEventListener('click', openCreatePlaylistModal);
  if (createPlaylistClose) createPlaylistClose.addEventListener('click', closeCreatePlaylistModal);
  if (createPlaylistBackdrop) createPlaylistBackdrop.addEventListener('click', closeCreatePlaylistModal);
  if (btnCancelPlaylist) btnCancelPlaylist.addEventListener('click', closeCreatePlaylistModal);

  if (coverPreviewBox && playlistFileInput) {
    coverPreviewBox.addEventListener('click', () => {
      playlistFileInput.click();
    });

    playlistFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        pendingCoverBase64 = evt.target.result;
        coverPreviewImg.src = pendingCoverBase64;
      };
      reader.readAsDataURL(file);
    });

    coverPreviewBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      coverPreviewBox.style.borderColor = 'var(--emerald)';
    });
    coverPreviewBox.addEventListener('dragleave', () => {
      coverPreviewBox.style.borderColor = '';
    });
    coverPreviewBox.addEventListener('drop', (e) => {
      e.preventDefault();
      coverPreviewBox.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
          pendingCoverBase64 = evt.target.result;
          coverPreviewImg.src = pendingCoverBase64;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (playlistUrlInput) {
    playlistUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url && !pendingCoverBase64) {
        coverPreviewImg.src = url;
      } else if (!pendingCoverBase64) {
        coverPreviewImg.src = 'placeholder.svg';
      }
    });
  }

  if (createPlaylistForm) {
    createPlaylistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = playlistNameInput ? playlistNameInput.value.trim() : '';
      if (!title) {
        showToast('Please enter a playlist title', 'error');
        return;
      }
      const description = playlistDescInput ? playlistDescInput.value.trim() : '';
      const cover_url = playlistUrlInput ? playlistUrlInput.value.trim() : '';

      try {
        const submitBtn = document.getElementById('btn-submit-playlist');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating...';
        }

        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, cover_url })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to create playlist');
        }

        const newPlaylist = await res.json();

        // If custom uploaded local image
        if (pendingCoverBase64) {
          try {
            await fetch(`/api/playlists/${newPlaylist.id}/cover`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_data: pendingCoverBase64 })
            });
          } catch (covErr) {
            console.error('Failed to upload cover', covErr);
          }
        }

        closeCreatePlaylistModal();
        showToast(`Playlist "${newPlaylist.title}" created successfully!`, 'success');

        // If we had a track waiting to be added, add it now!
        if (trackToAdd) {
          await addTrackToPlaylistById(newPlaylist.id, trackToAdd);
          trackToAdd = null;
        }

        // Switch to playlists view in library
        activateTab('library');
        currentGroupMode = 'playlists';
        groupPills.forEach(p => p.classList.toggle('active', p.dataset.group === 'playlists'));
        await loadUserPlaylists();
        renderLibrary();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        const submitBtn = document.getElementById('btn-submit-playlist');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Playlist';
        }
      }
    });
  }

  // ==================== ADD TO PLAYLIST MODAL HANDLERS ====================
  function openAddToPlaylistModal(track) {
    trackToAdd = track;
    if (!addToPlaylistModal) return;
    addToPlaylistModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (addToPlaylistTrackName) {
      addToPlaylistTrackName.textContent = `Select a playlist for "${track.title}"`;
    }

    renderAddToPlaylistList();
  }

  function closeAddToPlaylistModal() {
    if (!addToPlaylistModal) return;
    addToPlaylistModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (addToPlaylistClose) addToPlaylistClose.addEventListener('click', closeAddToPlaylistModal);
  if (addToPlaylistBackdrop) addToPlaylistBackdrop.addEventListener('click', closeAddToPlaylistModal);

  if (btnQuickCreateFromAdd) {
    btnQuickCreateFromAdd.addEventListener('click', () => {
      closeAddToPlaylistModal();
      openCreatePlaylistModal();
    });
  }

  function renderAddToPlaylistList() {
    if (!addToPlaylistList) return;
    addToPlaylistList.innerHTML = '';

    if (!userPlaylists.length) {
      addToPlaylistList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
          No playlists created yet. Create your first playlist below!
        </div>
      `;
      return;
    }

    userPlaylists.forEach(pl => {
      const item = document.createElement('div');
      item.className = 'add-to-playlist-item';
      const count = pl.track_count || (pl.tracks ? pl.tracks.length : 0);
      const thumbSrc = pl.cover_url || 'placeholder.svg';
      const badgeClass = pl.is_custom ? 'playlist-badge-custom' : 'playlist-badge-saved';
      const badgeText = pl.is_custom ? 'Custom' : 'Saved';

      item.innerHTML = `
        <img class="add-to-playlist-thumb" src="${thumbSrc}" onerror="this.src='placeholder.svg'" alt="Cover" />
        <div class="add-to-playlist-info">
          <div class="add-to-playlist-name truncate">${escapeHtml(pl.title)}</div>
          <div class="add-to-playlist-sub">${count} track${count === 1 ? '' : 's'}</div>
        </div>
        <span class="add-to-playlist-badge ${badgeClass}">${badgeText}</span>
      `;

      item.addEventListener('click', async () => {
        if (!trackToAdd) return;
        await addTrackToPlaylistById(pl.id, trackToAdd);
        closeAddToPlaylistModal();
      });

      addToPlaylistList.appendChild(item);
    });
  }

  async function addTrackToPlaylistById(playlistId, track) {
    try {
      const payload = {
        title: track.title,
        artist: track.artist || 'Unknown Artist',
        album: track.album || '',
        cover_url: track.cover_url || (track.filename ? `/api/songs/artwork/${encodeURIComponent(track.filename)}` : ''),
        duration: track.duration || 0,
        query: track.query || `${track.artist || ''} - ${track.title}`
      };

      const res = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to add track');
      }

      showToast(`Added "${track.title}" to playlist!`, 'success');
      await loadUserPlaylists();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  if (drawerAddPlaylistBtn) {
    drawerAddPlaylistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectedSong) {
        openAddToPlaylistModal({
          title: selectedSong.title,
          artist: selectedSong.artist,
          album: selectedSong.album,
          filename: selectedSong.filename,
          cover_url: `/api/songs/artwork/${encodeURIComponent(selectedSong.filename)}`,
          duration: selectedSong.duration
        });
      }
    });
  }

  async function downloadEntirePlaylist(playlistData) {
    if (!playlistData || !playlistData.tracks || !playlistData.tracks.length) return;

    closePlaylistModal();

    try {
      const res = await fetch('/api/download/playlist-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: playlistData.title,
          tracks: playlistData.tracks,
          threads: parseInt(settingThreads ? settingThreads.value : 3) || 3,
          quality: settingQuality ? settingQuality.value : '320k',
          naming: settingNaming ? settingNaming.value : 'title'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to start batch download');
      }

      showToast(`Downloading "${playlistData.title}" (${playlistData.tracks.length} tracks)...`, 'success');
      btnStop.style.display = 'inline-flex';
      statusBadge.className = 'hud-status-badge active-download';
      statusBadge.textContent = 'Downloading';

      // Switch to Downloader tab to show live progress HUD
      const dlTabBtn = document.querySelector('.nav-item[data-tab="downloader"]');
      if (dlTabBtn) dlTabBtn.click();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  // ==================== AUDIO PLAYER ENGINE ====================
  function updateScrubberFill(pct) {
    if (!playerScrubber) return;
    const clamped = Math.max(0, Math.min(pct || 0, 100));
    playerScrubber.style.background = `linear-gradient(to right, var(--emerald) 0%, var(--emerald) ${clamped}%, rgba(255, 255, 255, 0.12) ${clamped}%, rgba(255, 255, 255, 0.12) 100%)`;
  }

  function updateVolumeFill(val) {
    if (!playerVolume) return;
    const pct = Math.max(0, Math.min((val || 0) * 100, 100));
    playerVolume.style.background = `linear-gradient(to right, var(--emerald) 0%, var(--emerald) ${pct}%, rgba(255, 255, 255, 0.12) ${pct}%, rgba(255, 255, 255, 0.12) 100%)`;
  }

  function updateShuffleUI() {
    if (!playerShuffle) return;
    if (isShuffle) {
      playerShuffle.classList.add('active');
      playerShuffle.title = 'Shuffle: On (S)';
    } else {
      playerShuffle.classList.remove('active');
      playerShuffle.title = 'Shuffle: Off (S)';
    }
  }

  function updateRepeatUI() {
    if (!playerRepeat) return;
    if (repeatMode === 'off') {
      playerRepeat.classList.remove('active');
      playerRepeat.title = 'Repeat: Off (R)';
      if (repeatBadge) repeatBadge.classList.remove('show');
    } else if (repeatMode === 'all') {
      playerRepeat.classList.add('active');
      playerRepeat.title = 'Repeat: All (R)';
      if (repeatBadge) repeatBadge.classList.remove('show');
    } else if (repeatMode === 'one') {
      playerRepeat.classList.add('active');
      playerRepeat.title = 'Repeat: Current Track (R)';
      if (repeatBadge) repeatBadge.classList.add('show');
    }
  }

  function highlightPlayingRow() {
    document.querySelectorAll('.song-card, .song-row').forEach(el => {
      el.classList.remove('playing');
    });
    if (currentSongIndex >= 0) {
      const activeEls = document.querySelectorAll(
        `.song-card[data-index="${currentSongIndex}"], .song-row[data-index="${currentSongIndex}"]`
      );
      activeEls.forEach(el => el.classList.add('playing'));
    }
  }

  // -------------------------------------------------------------
  // HTML5 MediaSession & Mac Notch Dynamic Island HUD System
  // -------------------------------------------------------------
  function setupMediaSession(meta) {
    if (!('mediaSession' in navigator)) return;
    try {
      const artworkSrc = meta.artwork_url || 'placeholder.svg';
      const absoluteArt = new URL(artworkSrc, window.location.origin).href;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title || 'Music Studio Track',
        artist: meta.artist || 'Music Studio',
        album: meta.album || 'Music Studio Master',
        artwork: [
          { src: absoluteArt, sizes: '96x96', type: 'image/jpeg' },
          { src: absoluteArt, sizes: '128x128', type: 'image/jpeg' },
          { src: absoluteArt, sizes: '256x256', type: 'image/jpeg' },
          { src: absoluteArt, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      const handlers = [
        ['play', () => { audioEngine.play().catch(() => {}); }],
        ['pause', () => { audioEngine.pause(); }],
        ['previoustrack', () => { playPrevTrack(); }],
        ['nexttrack', () => { playNextTrack(); }],
        ['seekbackward', (details) => {
          const skip = (details && details.seekOffset) || 10;
          audioEngine.currentTime = Math.max(0, audioEngine.currentTime - skip);
        }],
        ['seekforward', (details) => {
          const skip = (details && details.seekOffset) || 10;
          audioEngine.currentTime = Math.min(audioEngine.duration || 0, audioEngine.currentTime + skip);
        }],
        ['seekto', (details) => {
          if (details && details.seekTime !== undefined && details.seekTime !== null) {
            audioEngine.currentTime = details.seekTime;
          }
        }],
        ['stop', () => {
          audioEngine.pause();
          audioEngine.currentTime = 0;
        }]
      ];

      for (const [action, handler] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('setupMediaSession failed', e);
    }
  }

  function updateMediaSessionPlaybackState(state) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (e) {}
  }

  function updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || !audioEngine.duration || !isFinite(audioEngine.duration)) return;
    try {
      if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, audioEngine.duration),
          playbackRate: audioEngine.playbackRate || 1.0,
          position: Math.max(0, Math.min(audioEngine.currentTime, audioEngine.duration))
        });
      }
    } catch (e) {}
  }

  function updateNotchHUD(meta) {
    if (!notchHud) return;
    if (!meta) {
      notchHud.classList.add('hud-hidden');
      return;
    }
    notchHud.classList.remove('hud-hidden');

    const title = meta.title || 'Unknown Track';
    const artist = meta.artist || 'Unknown Artist';
    const artUrl = meta.artwork_url || 'placeholder.svg';

    if (notchMiniArt) notchMiniArt.src = artUrl;
    if (notchMiniTitle) notchMiniTitle.textContent = title;
    if (notchMiniArtist) notchMiniArtist.textContent = artist;

    if (notchExpandedArt) notchExpandedArt.src = artUrl;
    if (notchExpandedTitle) notchExpandedTitle.textContent = title;
    if (notchExpandedArtist) notchExpandedArtist.textContent = artist;

    if (notchTotalTime && meta.duration) {
      notchTotalTime.textContent = formatSeconds(meta.duration);
    }
  }

  function updateNotchProgress(pct, currentSec) {
    if (notchProgressFill) notchProgressFill.style.width = `${pct}%`;
    if (notchCurrTime) notchCurrTime.textContent = formatSeconds(currentSec);
  }

  function playTrack(idx) {
    if (idx < 0 || idx >= librarySongs.length) return;
    isOnlineStreaming = false;
    currentStreamingTrack = null;
    currentSongIndex = idx;
    hasRecordedPlayForCurrentTrack = false;
    playHistory.push(idx);
    if (playHistory.length > 100) playHistory.shift();

    const song = librarySongs[idx];
    const audioUrl = resolveApiUrl(`/api/songs/audio/${encodeURIComponent(song.filename)}`);
    const coverUrl = resolveApiUrl(`/api/songs/artwork/${encodeURIComponent(song.filename)}`);

    audioEngine.src = audioUrl;
    audioEngine.load();
    const playPromise = audioEngine.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        updatePlayIcon(false);
      });
    }

    playerCover.src = coverUrl;
    playerTitle.textContent = song.title || 'Unknown Track';
    playerArtist.textContent = song.artist || 'Unknown Artist';

    playerScrubber.value = 0;
    updateScrubberFill(0);
    playerCurrentTime.textContent = '0:00';
    playerTotalTime.textContent = formatSeconds(song.duration || 0);

    // Hide stream actions
    const dockStreamBadge = document.getElementById('dock-stream-badge');
    if (dockStreamBadge) dockStreamBadge.style.display = 'none';
    const dockQuickDl = document.getElementById('dock-quick-dl-btn');
    if (dockQuickDl) dockQuickDl.style.display = 'none';

    // Synchronize to Fullscreen "Now Playing" Overlay
    if (fsCover) fsCover.src = coverUrl;
    if (fsTitle) fsTitle.textContent = song.title || 'Unknown Track';
    if (fsArtist) fsArtist.textContent = song.artist || 'Unknown Artist';
    if (fsAlbum) fsAlbum.textContent = song.album || 'Music Studio Master';
    if (fsScrubber) {
      fsScrubber.value = 0;
      updateFsScrubberFill(0);
    }
    if (fsCurrentTime) fsCurrentTime.textContent = '0:00';
    if (fsTotalTime) fsTotalTime.textContent = formatSeconds(song.duration || 0);

    const fsStreamActions = document.getElementById('fs-stream-actions');
    if (fsStreamActions) fsStreamActions.style.display = 'none';
    const fsStreamBadge = document.getElementById('fs-stream-badge-floating');
    if (fsStreamBadge) fsStreamBadge.style.display = 'none';

    // Synchronize to Mac Notch HUD & HTML5 MediaSession
    setupMediaSession({
      title: song.title || 'Unknown Track',
      artist: song.artist || 'Unknown Artist',
      album: song.album || 'Music Studio Master',
      artwork_url: coverUrl,
      duration: song.duration
    });
    updateNotchHUD({
      title: song.title || 'Unknown Track',
      artist: song.artist || 'Unknown Artist',
      artwork_url: coverUrl,
      duration: song.duration
    });

    isPlaying = true;
    updatePlayIcon(true);
    highlightPlayingRow();
  }

  function togglePlay() {
    if (!audioEngine.src) {
      if (librarySongs.length > 0) {
        playTrack(0);
      }
      return;
    }
    if (audioEngine.paused) {
      audioEngine.play().catch(() => {});
      isPlaying = true;
      updatePlayIcon(true);
    } else {
      audioEngine.pause();
      isPlaying = false;
      updatePlayIcon(false);
    }
  }

  function updatePlayIcon(playing) {
    const playSvg = `<polygon points="5 3 19 12 5 21 5 3"/>`;
    const pauseSvg = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
    if (playerPlayIcon) playerPlayIcon.innerHTML = playing ? pauseSvg : playSvg;
    if (fsPlayIcon) fsPlayIcon.innerHTML = playing ? pauseSvg : playSvg;
    if (notchMiniPlayIcon) notchMiniPlayIcon.innerHTML = playing ? pauseSvg : playSvg;
    if (notchPlayIcon) notchPlayIcon.innerHTML = playing ? pauseSvg : playSvg;
    if (notchHud) {
      if (playing) {
        notchHud.classList.add('is-playing');
      } else {
        notchHud.classList.remove('is-playing');
      }
    }
    updateMediaSessionPlaybackState(playing ? 'playing' : 'paused');
  }

  // Fisher-Yates Shuffled Permutation Engine
  function generateShuffleQueue(startIdx = -1) {
    if (!librarySongs.length) {
      shuffleQueue = [];
      shufflePointer = 0;
      return;
    }
    const arr = Array.from({ length: librarySongs.length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (startIdx >= 0) {
      const p = arr.indexOf(startIdx);
      if (p > 0) {
        arr.splice(p, 1);
        arr.unshift(startIdx);
      }
    }
    shuffleQueue = arr;
    shufflePointer = 0;
  }

  function playNextTrack() {
    if (repeatMode === 'one') {
      audioEngine.currentTime = 0;
      audioEngine.play().catch(() => {});
      return;
    }

    if (isOnlineStreaming) {
      if (!currentOnlineQueue || !currentOnlineQueue.length) return;
      if (isShuffle) {
        const nextIdx = Math.floor(Math.random() * currentOnlineQueue.length);
        playOnlineTrack(currentOnlineQueue[nextIdx], currentOnlineQueue, nextIdx);
      } else {
        if (currentOnlineQueueIndex < currentOnlineQueue.length - 1) {
          const nextIdx = currentOnlineQueueIndex + 1;
          playOnlineTrack(currentOnlineQueue[nextIdx], currentOnlineQueue, nextIdx);
        } else if (repeatMode === 'all') {
          playOnlineTrack(currentOnlineQueue[0], currentOnlineQueue, 0);
        } else {
          audioEngine.pause();
          audioEngine.currentTime = 0;
          isPlaying = false;
          updatePlayIcon(false);
        }
      }
      return;
    }

    if (!librarySongs.length) return;

    if (isShuffle) {
      if (!shuffleQueue.length || shuffleQueue.length !== librarySongs.length) {
        generateShuffleQueue(currentSongIndex);
      }
      shufflePointer++;
      if (shufflePointer >= shuffleQueue.length) {
        if (repeatMode === 'all') {
          generateShuffleQueue();
        } else {
          audioEngine.pause();
          audioEngine.currentTime = 0;
          isPlaying = false;
          updatePlayIcon(false);
          return;
        }
      }
      playTrack(shuffleQueue[shufflePointer]);
    } else {
      if (currentSongIndex < librarySongs.length - 1) {
        playTrack(currentSongIndex + 1);
      } else {
        if (repeatMode === 'all') {
          playTrack(0);
        } else {
          audioEngine.pause();
          audioEngine.currentTime = 0;
          isPlaying = false;
          updatePlayIcon(false);
        }
      }
    }
  }

  function playPrevTrack() {
    // Standard player UX: if played > 3s, restart current track
    if (audioEngine.currentTime > 3) {
      audioEngine.currentTime = 0;
      return;
    }

    if (isOnlineStreaming) {
      if (!currentOnlineQueue || !currentOnlineQueue.length) return;
      if (isShuffle) {
        const prevIdx = Math.floor(Math.random() * currentOnlineQueue.length);
        playOnlineTrack(currentOnlineQueue[prevIdx], currentOnlineQueue, prevIdx);
      } else {
        if (currentOnlineQueueIndex > 0) {
          const prevIdx = currentOnlineQueueIndex - 1;
          playOnlineTrack(currentOnlineQueue[prevIdx], currentOnlineQueue, prevIdx);
        } else if (repeatMode === 'all') {
          const prevIdx = currentOnlineQueue.length - 1;
          playOnlineTrack(currentOnlineQueue[prevIdx], currentOnlineQueue, prevIdx);
        } else {
          audioEngine.currentTime = 0;
        }
      }
      return;
    }

    if (!librarySongs.length) return;

    if (isShuffle && shuffleQueue.length) {
      if (shufflePointer > 0) {
        shufflePointer--;
        playTrack(shuffleQueue[shufflePointer]);
        return;
      }
    }

    if (currentSongIndex > 0) {
      playTrack(currentSongIndex - 1);
    } else if (repeatMode === 'all' || isShuffle) {
      playTrack(librarySongs.length - 1);
    } else {
      audioEngine.currentTime = 0;
    }
  }

  playerPlayBtn.addEventListener('click', togglePlay);
  playerNext.addEventListener('click', playNextTrack);
  playerPrev.addEventListener('click', playPrevTrack);

  if (playerShuffle) {
    playerShuffle.addEventListener('click', () => {
      isShuffle = !isShuffle;
      localStorage.setItem('musicstudio_shuffle', isShuffle ? 'true' : 'false');
      generateShuffleQueue(currentSongIndex);
      updateShuffleUI();
      showToast(isShuffle ? 'Shuffle: On' : 'Shuffle: Off', 'info');
    });
  }

  if (playerRepeat) {
    playerRepeat.addEventListener('click', () => {
      if (repeatMode === 'off') {
        repeatMode = 'all';
      } else if (repeatMode === 'all') {
        repeatMode = 'one';
      } else {
        repeatMode = 'off';
      }
      localStorage.setItem('musicstudio_repeat', repeatMode);
      updateRepeatUI();
      const label = repeatMode === 'one' ? 'Repeat: Current Track' : (repeatMode === 'all' ? 'Repeat: All Tracks' : 'Repeat: Off');
      showToast(label, 'info');
    });
  }

  function updateShuffleUI() {
    const title = isShuffle ? 'Shuffle: On (S)' : 'Shuffle: Off (S)';
    if (playerShuffle) {
      playerShuffle.classList.toggle('active', isShuffle);
      playerShuffle.title = title;
    }
    if (fsShuffle) {
      fsShuffle.classList.toggle('active', isShuffle);
      fsShuffle.title = title;
    }
  }

  function updateRepeatUI() {
    const title = repeatMode === 'one' ? 'Repeat: Current Track (R)' : (repeatMode === 'all' ? 'Repeat: All Tracks (R)' : 'Repeat: Off (R)');
    if (playerRepeat) {
      playerRepeat.classList.toggle('active', repeatMode !== 'off');
      playerRepeat.title = title;
      if (repeatBadge) repeatBadge.classList.toggle('show', repeatMode === 'one');
    }
    if (fsRepeat) {
      fsRepeat.classList.toggle('active', repeatMode !== 'off');
      fsRepeat.title = title;
      if (fsRepeatBadge) fsRepeatBadge.classList.toggle('show', repeatMode === 'one');
    }
  }

  function updateFsScrubberFill(pct) {
    if (!fsScrubber) return;
    const clamped = Math.max(0, Math.min(pct || 0, 100));
    fsScrubber.style.background = `linear-gradient(to right, var(--emerald) 0%, var(--emerald) ${clamped}%, rgba(255, 255, 255, 0.12) ${clamped}%, rgba(255, 255, 255, 0.12) 100%)`;
  }

  function updateFsVolumeFill(val) {
    if (!fsVolume) return;
    const pct = Math.max(0, Math.min((val || 0) * 100, 100));
    fsVolume.style.background = `linear-gradient(to right, var(--emerald) 0%, var(--emerald) ${pct}%, rgba(255, 255, 255, 0.12) ${pct}%, rgba(255, 255, 255, 0.12) 100%)`;
  }

  // Audio Engine Lifecycle
  let lastPlaybackBroadcast = 0;
  function broadcastPlaybackState() {
    let title = 'Music Studio';
    let artist = 'Local Library';
    let album = '';
    let coverUrl = 'placeholder.svg';

    if (isOnlineStreaming && currentStreamMeta) {
      title = currentStreamMeta.title || title;
      artist = currentStreamMeta.artist || artist;
      album = currentStreamMeta.album || album;
      coverUrl = currentStreamMeta.cover_url || coverUrl;
    } else if (currentSongIndex >= 0 && librarySongs[currentSongIndex]) {
      const s = librarySongs[currentSongIndex];
      title = s.title || title;
      artist = s.artist || artist;
      album = s.album || album;
      coverUrl = `/api/songs/artwork/${encodeURIComponent(s.filename)}`;
    }

    fetch('/api/playback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_playing: !audioEngine.paused,
        title: title,
        artist: artist,
        album: album,
        cover_url: coverUrl,
        current_time: audioEngine.currentTime || 0,
        duration: audioEngine.duration || 0,
        index: currentSongIndex
      })
    }).catch(() => {});
  }

  function recordActiveTrackPlay() {
    let payload = null;
    if (isOnlineStreaming && currentStreamingTrack) {
      payload = {
        title: currentStreamingTrack.title || '',
        artist: currentStreamingTrack.artist || '',
        album: currentStreamingTrack.album || 'Online Stream',
        duration: currentStreamingTrack.duration || 0,
        filename: ''
      };
    } else if (currentSongIndex >= 0 && librarySongs[currentSongIndex]) {
      const s = librarySongs[currentSongIndex];
      payload = {
        title: s.title || '',
        artist: s.artist || '',
        album: s.album || '',
        duration: s.duration || 0,
        filename: s.filename || ''
      };
    }
    if (!payload || !payload.title) return;

    try {
      const stored = JSON.parse(localStorage.getItem('musicstudio_play_counts') || '{}');
      const key = payload.filename || `${payload.title.toLowerCase()} - ${payload.artist.toLowerCase()}`;
      stored[key] = (stored[key] || 0) + 1;
      localStorage.setItem('musicstudio_play_counts', JSON.stringify(stored));
    } catch (e) {}

    if (!isDeviceOffline) {
      fetch('/api/play-stats/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  }

  audioEngine.addEventListener('timeupdate', () => {
    if (!isSeeking && audioEngine.duration && isFinite(audioEngine.duration)) {
      const pct = (audioEngine.currentTime / audioEngine.duration) * 100;
      playerScrubber.value = pct;
      updateScrubberFill(pct);
      playerCurrentTime.textContent = formatSeconds(audioEngine.currentTime);

      if (!hasRecordedPlayForCurrentTrack && audioEngine.currentTime >= 15) {
        hasRecordedPlayForCurrentTrack = true;
        recordActiveTrackPlay();
      }

      if (fsScrubber) {
        fsScrubber.value = pct;
        updateFsScrubberFill(pct);
      }
      if (fsCurrentTime) {
        fsCurrentTime.textContent = formatSeconds(audioEngine.currentTime);
      }
      updateNotchProgress(pct, audioEngine.currentTime);
      updateMediaSessionPosition();

      const now = Date.now();
      if (now - lastPlaybackBroadcast > 1000) {
        lastPlaybackBroadcast = now;
        broadcastPlaybackState();
      }
    }
  });

  audioEngine.addEventListener('loadedmetadata', () => {
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      playerTotalTime.textContent = formatSeconds(audioEngine.duration);
      if (fsTotalTime) fsTotalTime.textContent = formatSeconds(audioEngine.duration);
      if (notchTotalTime) notchTotalTime.textContent = formatSeconds(audioEngine.duration);
      updateMediaSessionPosition();
      broadcastPlaybackState();
    }
  });

  audioEngine.addEventListener('durationchange', () => {
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      playerTotalTime.textContent = formatSeconds(audioEngine.duration);
      if (fsTotalTime) fsTotalTime.textContent = formatSeconds(audioEngine.duration);
      if (notchTotalTime) notchTotalTime.textContent = formatSeconds(audioEngine.duration);
      updateMediaSessionPosition();
      broadcastPlaybackState();
    }
  });

  audioEngine.addEventListener('play', () => {
    isPlaying = true;
    updatePlayIcon(true);
    highlightPlayingRow();
    broadcastPlaybackState();
  });

  audioEngine.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayIcon(false);
    broadcastPlaybackState();
  });

  audioEngine.addEventListener('ended', () => {
    if (!hasRecordedPlayForCurrentTrack && audioEngine.currentTime >= 5) {
      hasRecordedPlayForCurrentTrack = true;
      recordActiveTrackPlay();
    }

    if (repeatMode === 'one') {
      audioEngine.currentTime = 0;
      audioEngine.play().catch(() => {});
      return;
    }
    if (isOnlineStreaming) {
      playNextTrack();
    } else if (currentSongIndex >= 0 && librarySongs.length > 0) {
      playNextTrack();
    } else {
      isPlaying = false;
      updatePlayIcon(false);
      playerScrubber.value = 0;
      updateScrubberFill(0);
      playerCurrentTime.textContent = '0:00';
      if (fsScrubber) {
        fsScrubber.value = 0;
        updateFsScrubberFill(0);
      }
      if (fsCurrentTime) fsCurrentTime.textContent = '0:00';
    }
  });

  // Dock & Fullscreen Streaming Save Buttons
  const dockQuickDlBtn = document.getElementById('dock-quick-dl-btn');
  if (dockQuickDlBtn) {
    dockQuickDlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveCurrentStreamingTrack();
    });
  }

  const fsSaveBtn = document.getElementById('fs-save-btn');
  if (fsSaveBtn) {
    fsSaveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveCurrentStreamingTrack();
    });
  }

  // Dock Scrubber: Live Dragging & Seeking
  playerScrubber.addEventListener('pointerdown', () => {
    isSeeking = true;
  });

  playerScrubber.addEventListener('input', (e) => {
    isSeeking = true;
    const pct = parseFloat(e.target.value);
    updateScrubberFill(pct);
    updateFsScrubberFill(pct);
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      const previewTime = (pct / 100) * audioEngine.duration;
      playerCurrentTime.textContent = formatSeconds(previewTime);
      if (fsCurrentTime) fsCurrentTime.textContent = formatSeconds(previewTime);
    }
  });

  playerScrubber.addEventListener('change', (e) => {
    const pct = parseFloat(e.target.value);
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      const targetTime = (pct / 100) * audioEngine.duration;
      audioEngine.currentTime = Math.max(0, Math.min(targetTime, audioEngine.duration - 0.2));
    }
    setTimeout(() => {
      isSeeking = false;
    }, 120);
  });

  // Fullscreen Scrubber: Live Dragging & Seeking
  if (fsScrubber) {
    fsScrubber.addEventListener('pointerdown', () => {
      isSeeking = true;
    });

    fsScrubber.addEventListener('input', (e) => {
      isSeeking = true;
      const pct = parseFloat(e.target.value);
      updateScrubberFill(pct);
      updateFsScrubberFill(pct);
      if (audioEngine.duration && isFinite(audioEngine.duration)) {
        const previewTime = (pct / 100) * audioEngine.duration;
        playerCurrentTime.textContent = formatSeconds(previewTime);
        if (fsCurrentTime) fsCurrentTime.textContent = formatSeconds(previewTime);
      }
    });

    fsScrubber.addEventListener('change', (e) => {
      const pct = parseFloat(e.target.value);
      if (audioEngine.duration && isFinite(audioEngine.duration)) {
        const targetTime = (pct / 100) * audioEngine.duration;
        audioEngine.currentTime = Math.max(0, Math.min(targetTime, audioEngine.duration - 0.2));
      }
      setTimeout(() => {
        isSeeking = false;
      }, 120);
    });
  }

  // Scrubber Wheel Scrolling
  if (scrubberWrap) {
    scrubberWrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!audioEngine.duration || !isFinite(audioEngine.duration)) return;

      const direction = (e.deltaY < 0 || e.deltaX > 0) ? 1 : -1;
      const step = direction * 4;
      const targetTime = Math.max(0, Math.min(audioEngine.currentTime + step, audioEngine.duration - 0.2));
      audioEngine.currentTime = targetTime;

      const pct = (targetTime / audioEngine.duration) * 100;
      playerScrubber.value = pct;
      updateScrubberFill(pct);
      playerCurrentTime.textContent = formatSeconds(targetTime);
      if (fsScrubber) {
        fsScrubber.value = pct;
        updateFsScrubberFill(pct);
      }
      if (fsCurrentTime) fsCurrentTime.textContent = formatSeconds(targetTime);
    }, { passive: false });

    scrubberWrap.addEventListener('mousemove', (e) => {
      if (!scrubberTooltip || !audioEngine.duration || !isFinite(audioEngine.duration)) return;
      const rect = scrubberWrap.getBoundingClientRect();
      const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const ratio = offsetX / rect.width;
      const previewSec = ratio * audioEngine.duration;
      scrubberTooltip.textContent = formatSeconds(previewSec);
      scrubberTooltip.style.left = `${offsetX}px`;
    });
  }

  // Volume & Mute Initialization
  const initialVol = Math.max(0, Math.min(previousVolume, 1));
  audioEngine.volume = initialVol;
  playerVolume.value = initialVol;
  updateVolumeFill(initialVol);
  updateVolumeIcon(initialVol);
  if (fsVolume) {
    fsVolume.value = initialVol;
    updateFsVolumeFill(initialVol);
  }

  playerVolume.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audioEngine.volume = val;
    previousVolume = val;
    localStorage.setItem('musicstudio_volume', val.toString());
    updateVolumeFill(val);
    updateVolumeIcon(val);
    if (fsVolume) {
      fsVolume.value = val;
      updateFsVolumeFill(val);
    }
  });

  playerMuteBtn.addEventListener('click', () => {
    if (audioEngine.volume > 0) {
      previousVolume = audioEngine.volume;
      audioEngine.volume = 0;
      playerVolume.value = 0;
      updateVolumeFill(0);
      updateVolumeIcon(0);
      if (fsVolume) {
        fsVolume.value = 0;
        updateFsVolumeFill(0);
      }
    } else {
      const restored = previousVolume > 0 ? previousVolume : 0.8;
      audioEngine.volume = restored;
      playerVolume.value = restored;
      updateVolumeFill(restored);
      updateVolumeIcon(restored);
      if (fsVolume) {
        fsVolume.value = restored;
        updateFsVolumeFill(restored);
      }
    }
  });

  // Fullscreen Player Controls
  if (fsPlay) fsPlay.addEventListener('click', togglePlay);
  if (fsNext) fsNext.addEventListener('click', playNextTrack);
  if (fsPrev) fsPrev.addEventListener('click', playPrevTrack);
  if (fsShuffle) {
    fsShuffle.addEventListener('click', () => {
      if (playerShuffle) playerShuffle.click();
    });
  }
  if (fsRepeat) {
    fsRepeat.addEventListener('click', () => {
      if (playerRepeat) playerRepeat.click();
    });
  }
  if (fsVolume) {
    fsVolume.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      audioEngine.volume = val;
      previousVolume = val;
      localStorage.setItem('musicstudio_volume', val.toString());
      playerVolume.value = val;
      updateVolumeFill(val);
      updateVolumeIcon(val);
      updateFsVolumeFill(val);
    });
  }
  if (fsMuteBtn) {
    fsMuteBtn.addEventListener('click', () => {
      if (playerMuteBtn) playerMuteBtn.click();
    });
  }
  if (fsDrawerBtn) {
    fsDrawerBtn.addEventListener('click', () => {
      if (currentSongIndex >= 0 && currentSongIndex < librarySongs.length) {
        openDrawer(librarySongs[currentSongIndex], currentSongIndex);
      }
    });
  }

  // Fullscreen Player Open / Close
  function openFullscreenPlayer() {
    if (!fullscreenPlayer) return;
    fullscreenPlayer.style.display = 'flex';
    fullscreenPlayer.offsetHeight; // trigger CSS transition
    fullscreenPlayer.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Synchronize current track data
    if (currentSongIndex >= 0 && currentSongIndex < librarySongs.length) {
      const song = librarySongs[currentSongIndex];
      if (fsTitle) fsTitle.textContent = song.title || 'Unknown Track';
      if (fsArtist) fsArtist.textContent = song.artist || 'Unknown Artist';
      if (fsAlbum) fsAlbum.textContent = song.album || 'Music Studio Master';
      if (fsCover) fsCover.src = `/api/songs/artwork/${encodeURIComponent(song.filename)}`;
    }
    updatePlayIcon(isPlaying);
    updateShuffleUI();
    updateRepeatUI();
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      const pct = (audioEngine.currentTime / audioEngine.duration) * 100;
      if (fsScrubber) {
        fsScrubber.value = pct;
        updateFsScrubberFill(pct);
      }
      if (fsCurrentTime) fsCurrentTime.textContent = formatSeconds(audioEngine.currentTime);
      if (fsTotalTime) fsTotalTime.textContent = formatSeconds(audioEngine.duration);
    }
  }

  function closeFullscreenPlayer() {
    if (!fullscreenPlayer) return;
    fullscreenPlayer.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!fullscreenPlayer.classList.contains('active')) {
        fullscreenPlayer.style.display = 'none';
      }
    }, 400);
  }

  if (fsMinimizeBtn) fsMinimizeBtn.addEventListener('click', closeFullscreenPlayer);
  if (playerExpandBtn) {
    playerExpandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openFullscreenPlayer();
    });
  }
  if (dockTrackInfo) {
    dockTrackInfo.addEventListener('click', () => {
      openFullscreenPlayer();
    });
  }
  if (playerDock) {
    playerDock.addEventListener('click', (e) => {
      if (e.target.closest('.btn-transport') || e.target.closest('.btn-play-pause') || e.target.closest('.dock-volume-col') || e.target.closest('input')) {
        return;
      }
      openFullscreenPlayer();
    });
  }

  // Mobile swipe down gesture to dismiss fullscreen player
  let fsTouchStartY = 0;
  if (fullscreenPlayer) {
    fullscreenPlayer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        fsTouchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    fullscreenPlayer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        const fsTouchEndY = e.changedTouches[0].clientY;
        if (fsTouchEndY - fsTouchStartY > 80) {
          closeFullscreenPlayer();
        }
      }
    }, { passive: true });
  }

  // Mobile drawer drag bar to dismiss track drawer
  const drawerDragBar = document.querySelector('.drawer-drag-bar');
  if (drawerDragBar) {
    drawerDragBar.addEventListener('click', () => {
      if (trackDrawer) trackDrawer.classList.remove('open');
      if (drawerOverlay) drawerOverlay.classList.remove('open');
    });
  }

  function updateVolumeIcon(vol) {
    const muteSvg = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
    const lowSvg = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
    const highSvg = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`;

    const iconHtml = vol === 0 ? muteSvg : (vol < 0.5 ? lowSvg : highSvg);
    if (volumeIcon) volumeIcon.innerHTML = iconHtml;
    if (fsVolIcon) fsVolIcon.innerHTML = iconHtml;
  }

  // ==================== GLOBAL KEYBOARD SHORTCUTS ====================
  document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (audioEngine.duration && isFinite(audioEngine.duration)) {
        audioEngine.currentTime = Math.max(0, audioEngine.currentTime - 5);
      }
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      if (audioEngine.duration && isFinite(audioEngine.duration)) {
        audioEngine.currentTime = Math.min(audioEngine.duration, audioEngine.currentTime + 5);
      }
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
      const newVol = Math.min(1, audioEngine.volume + 0.05);
      audioEngine.volume = newVol;
      playerVolume.value = newVol;
      updateVolumeFill(newVol);
      updateVolumeIcon(newVol);
      if (fsVolume) {
        fsVolume.value = newVol;
        updateFsVolumeFill(newVol);
      }
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      const newVol = Math.max(0, audioEngine.volume - 0.05);
      audioEngine.volume = newVol;
      playerVolume.value = newVol;
      updateVolumeFill(newVol);
      updateVolumeIcon(newVol);
      if (fsVolume) {
        fsVolume.value = newVol;
        updateFsVolumeFill(newVol);
      }
    } else if (e.key === 's' || e.key === 'S') {
      if (playerShuffle) playerShuffle.click();
    } else if (e.key === 'r' || e.key === 'R') {
      if (playerRepeat) playerRepeat.click();
    } else if (e.key === 'm' || e.key === 'M') {
      if (playerMuteBtn) playerMuteBtn.click();
    } else if (e.key === 'f' || e.key === 'F') {
      if (fullscreenPlayer && fullscreenPlayer.classList.contains('active')) {
        closeFullscreenPlayer();
      } else {
        openFullscreenPlayer();
      }
    } else if (e.key === 'n' || e.key === 'N' || (e.shiftKey && e.code === 'ArrowRight')) {
      playNextTrack();
    } else if (e.key === 'p' || e.key === 'P' || (e.shiftKey && e.code === 'ArrowLeft')) {
      playPrevTrack();
    } else if (e.code === 'Escape') {
      if (fullscreenPlayer && fullscreenPlayer.classList.contains('active')) {
        closeFullscreenPlayer();
      } else {
        closeDrawer();
        closePlaylistModal();
      }
    }
  });

  // ==================== TOAST NOTIFICATIONS ====================
  function showToast(msg, type = 'info') {
    const stack = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // Helper formatting utilities
  function formatSeconds(sec) {
    const num = Number(sec);
    if (!num || isNaN(num) || !isFinite(num) || num < 0) return '0:00';
    const m = Math.floor(num / 60);
    const s = Math.floor(num % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Hash-based Tab Routing (e.g. #library, #settings, #discover)
  function handleHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const targetBtn = document.querySelector(`.nav-item[data-tab="${hash}"]`);
      if (targetBtn) {
        targetBtn.click();
      }
    }
  }
  // -------------------------------------------------------------
  // Mac Notch HUD Event Listeners & Interactive Controls
  // -------------------------------------------------------------
  if (notchHud) {
    // Prevent clicks inside the expanded island from closing it immediately
    if (notchExpandedIsland) {
      notchExpandedIsland.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Toggle expand/collapse when clicking the notch pill
    if (notchPill) {
      notchPill.addEventListener('click', (e) => {
        e.stopPropagation();
        notchHud.classList.toggle('is-expanded');
      });
    }

    // Play/Pause from mini notch pill button
    if (notchMiniPlayBtn) {
      notchMiniPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    // Play/Pause from expanded notch controls
    if (notchPlayBtn) {
      notchPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    // Prev / Next from expanded notch
    if (notchPrevBtn) {
      notchPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playPrevTrack();
      });
    }

    if (notchNextBtn) {
      notchNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playNextTrack();
      });
    }

    // Open Fullscreen player from Notch HUD
    if (notchFsBtn) {
      notchFsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notchHud.classList.remove('is-expanded');
        openFullscreenPlayer();
      });
    }

    // Click seeking on notch progress bar
    if (notchProgressTrack) {
      notchProgressTrack.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!audioEngine.duration || !isFinite(audioEngine.duration)) return;
        const rect = notchProgressTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(clickX / rect.width, 1));
        audioEngine.currentTime = ratio * audioEngine.duration;
      });
    }

    // Clicking anywhere else in the document collapses the notch
    document.addEventListener('click', (e) => {
      if (notchHud.classList.contains('is-expanded') && !notchHud.contains(e.target)) {
        notchHud.classList.remove('is-expanded');
      }
    });
  }

  // -------------------------------------------------------------
  // Import Playlist Modal & API Wiring
  // -------------------------------------------------------------
  function openImportPlaylistModal() {
    if (!importPlaylistModal) return;
    if (importPlaylistUrl) importPlaylistUrl.value = '';
    if (importPlaylistCustomName) importPlaylistCustomName.value = '';
    if (importPlaylistStatus) importPlaylistStatus.style.display = 'none';
    if (btnSubmitImport) {
      btnSubmitImport.disabled = false;
      btnSubmitImport.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Import Now</span>
      `;
    }
    importPlaylistModal.style.display = 'flex';
    importPlaylistModal.classList.add('open');
    if (importPlaylistBackdrop) importPlaylistBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (importPlaylistUrl) importPlaylistUrl.focus();
    }, 100);
  }

  function closeImportPlaylistModal() {
    if (!importPlaylistModal) return;
    importPlaylistModal.classList.remove('open');
    importPlaylistModal.style.display = 'none';
    if (importPlaylistBackdrop) importPlaylistBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (btnImportPlaylist) {
    btnImportPlaylist.addEventListener('click', openImportPlaylistModal);
  }
  if (importPlaylistClose) {
    importPlaylistClose.addEventListener('click', closeImportPlaylistModal);
  }
  if (importPlaylistBackdrop) {
    importPlaylistBackdrop.addEventListener('click', closeImportPlaylistModal);
  }
  if (btnCancelImport) {
    btnCancelImport.addEventListener('click', closeImportPlaylistModal);
  }

  // Paste from clipboard helper
  if (btnImportPaste) {
    btnImportPaste.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text && importPlaylistUrl) {
            importPlaylistUrl.value = text.trim();
            showToast('Pasted URL from clipboard', 'info');
          }
        } else {
          showToast('Clipboard API not available; please paste manually', 'warning');
        }
      } catch (err) {
        showToast('Clipboard access denied; please paste manually (Cmd+V)', 'warning');
      }
    });
  }

  // Form submission & import execution
  if (importPlaylistForm) {
    importPlaylistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = importPlaylistUrl ? importPlaylistUrl.value.trim() : '';
      const customName = importPlaylistCustomName ? importPlaylistCustomName.value.trim() : '';

      if (!url) {
        showToast('Please enter a Spotify or YouTube Music playlist link', 'warning');
        return;
      }

      // Show in-modal loader
      if (importPlaylistStatus) importPlaylistStatus.style.display = 'block';
      if (importStatusTitle) importStatusTitle.textContent = 'Analyzing and importing playlist...';
      if (importStatusSubtitle) importStatusSubtitle.textContent = 'Extracting track information and metadata. This takes just a moment.';
      if (btnSubmitImport) {
        btnSubmitImport.disabled = true;
        btnSubmitImport.innerHTML = `
          <div class="inline-spinner" style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
          <span>Importing...</span>
        `;
      }

      try {
        const res = await fetch('/api/playlists/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, custom_name: customName })
        });
        const data = await res.json();

        if (res.ok && data.success && data.playlist) {
          showToast(`Successfully imported "${data.playlist.name}" (${data.playlist.track_count || 0} tracks)!`, 'success');
          closeImportPlaylistModal();

          // Refresh user playlists
          await loadUserPlaylists();

          // Switch tab to library #custom-playlists subfilter or open modal directly
          const customSubPill = document.querySelector('.group-pill[data-subfilter="custom"]');
          if (customSubPill) {
            const libraryTabBtn = document.querySelector('.nav-item[data-tab="library"]');
            if (libraryTabBtn) libraryTabBtn.click();
            customSubPill.click();
          }

          // Open the imported playlist in modal view
          openPlaylistModal(data.playlist);
        } else {
          const errMsg = data.detail || data.error || 'Failed to import playlist';
          if (importStatusTitle) importStatusTitle.textContent = 'Import Error';
          if (importStatusSubtitle) importStatusSubtitle.textContent = errMsg;
          showToast(errMsg, 'error');
          if (btnSubmitImport) {
            btnSubmitImport.disabled = false;
            btnSubmitImport.innerHTML = `<span>Try Again</span>`;
          }
        }
      } catch (err) {
        console.error('Import playlist error:', err);
        const errMsg = err.message || 'Connection failure while importing playlist';
        if (importStatusTitle) importStatusTitle.textContent = 'Network Error';
        if (importStatusSubtitle) importStatusSubtitle.textContent = errMsg;
        showToast(errMsg, 'error');
        if (btnSubmitImport) {
          btnSubmitImport.disabled = false;
          btnSubmitImport.innerHTML = `<span>Try Again</span>`;
        }
      }
    });
  }

  function initOfflineDetection() {
    const offlinePill = document.getElementById('offline-mode-pill');
    const forceOfflineToggle = document.getElementById('setting-force-offline');

    function applyOfflineState(offline) {
      isDeviceOffline = offline;
      document.body.classList.toggle('is-offline-mode', offline);

      if (offlinePill) {
        offlinePill.style.display = offline ? 'inline-flex' : 'none';
      }

      document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(b => {
        const tab = b.getAttribute('data-tab');
        if (tab === 'discover' || tab === 'downloader') {
          b.classList.toggle('tab-offline-disabled', offline);
          b.setAttribute('title', offline ? 'Unavailable offline' : '');
        }
      });

      if (offline) {
        const activeTab = document.querySelector('.tab-view.active');
        if (activeTab && (activeTab.id === 'tab-discover' || activeTab.id === 'tab-downloader')) {
          activateTab('library');
          showToast('⚡ Offline Mode: Switched to downloaded music library', 'warning');
        }
      }
    }

    window.addEventListener('online', () => {
      if (forceOfflineToggle && forceOfflineToggle.checked) return;
      applyOfflineState(false);
      showToast('🌐 Connection restored: Online streaming & downloader active.', 'success');
    });

    window.addEventListener('offline', () => {
      applyOfflineState(true);
      showToast('⚡ Device offline: Switched to local offline Library.', 'warning');
    });

    if (forceOfflineToggle) {
      forceOfflineToggle.addEventListener('change', (e) => {
        applyOfflineState(e.target.checked || !navigator.onLine);
      });
    }

    // Server URL configuration in Settings
    const serverUrlInput = document.getElementById('setting-server-url');
    const saveServerUrlBtn = document.getElementById('btn-save-server-url');
    if (serverUrlInput) {
      serverUrlInput.value = localStorage.getItem('musicstudio_server_url') || window.location.origin;
    }
    if (saveServerUrlBtn && serverUrlInput) {
      saveServerUrlBtn.addEventListener('click', () => {
        const val = serverUrlInput.value.trim();
        if (val) {
          localStorage.setItem('musicstudio_server_url', val);
          showToast(`Server URL saved: ${val}`, 'success');
        }
      });
    }

    applyOfflineState(!navigator.onLine);
  }

  // Initial Load
  initOfflineDetection();
  initEventStream();
  loadExplore();
  loadLibrary();
  loadUserPlaylists();
  handleHash();
  updateShuffleUI();
  updateRepeatUI();
  updateScrubberFill(0);
});

