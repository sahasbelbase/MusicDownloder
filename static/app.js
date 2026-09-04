/**
 * Music Studio - Ultra-Clean Client Application
 */

document.addEventListener('DOMContentLoaded', () => {
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

  // Playlist Modal Elements
  const playlistModal = document.getElementById('playlist-modal');
  const playlistModalBackdrop = document.getElementById('playlist-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCover = document.getElementById('modal-cover');
  const modalBadge = document.getElementById('modal-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalTrackCount = document.getElementById('modal-track-count');
  const btnModalDownloadAll = document.getElementById('btn-modal-download-all');
  const modalTracklist = document.getElementById('modal-tracklist');
  let currentModalPlaylist = null;
  let exploreSearchDebounce = null;

  // Application State
  let rawLibrarySongs = [];
  let librarySongs = [];
  let currentSongIndex = -1;
  let isPlaying = false;
  let isSeeking = false;
  let isShuffle = (localStorage.getItem('musicstudio_shuffle') || localStorage.getItem('spotistudio_shuffle')) === 'true';
  let repeatMode = localStorage.getItem('musicstudio_repeat') || localStorage.getItem('spotistudio_repeat') || 'off'; // 'off' | 'all' | 'one'
  let currentGroupMode = 'tracks'; // 'tracks' | 'artists' | 'albums' | 'genres'
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

  // ==================== NAVIGATION TABS ====================
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      const view = document.getElementById(`tab-${target}`);
      if (view) view.classList.add('active');

      if (target === 'library') {
        loadLibrary();
      } else if (target === 'discover') {
        loadExplore();
      }
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
        <img class="feed-thumb" src="${coverUrl}" onerror="this.src='/static/placeholder.svg'" alt="Cover" />
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
      navSongCount.textContent = rawLibrarySongs.length;
      libraryCountLabel.textContent = `${rawLibrarySongs.length} track${rawLibrarySongs.length === 1 ? '' : 's'}`;

      applySortAndFilter();
    } catch (e) {
      console.error(e);
      libraryContainer.innerHTML = `<div class="empty-state glass"><p>Failed to load music library</p></div>`;
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
    libraryCountLabel.textContent = `${librarySongs.length} track${librarySongs.length === 1 ? '' : 's'}`;
    generateShuffleQueue(currentSongIndex >= 0 ? currentSongIndex : -1);
    renderLibrary();
  }

  function renderLibrary() {
    libraryContainer.innerHTML = '';

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
              <img class="song-card-art" src="${coverUrl}" onerror="this.src='/static/placeholder.svg'" alt="Cover" loading="lazy" />
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
              <img class="song-row-thumb" src="${coverUrl}" onerror="this.src='/static/placeholder.svg'" alt="Cover" />
              <div class="song-row-meta truncate">
                <div class="song-row-title truncate">${escapeHtml(song.title)}</div>
                <div class="song-row-artist truncate">${escapeHtml(song.artist)}</div>
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
          <img class="artist-avatar" src="${repCover}" onerror="this.src='/static/placeholder.svg'" alt="${escapeHtml(artist)}" />
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
            <img src="${repCover}" onerror="this.src='/static/placeholder.svg'" alt="${escapeHtml(item.album)}" />
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
    trackDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
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
          <div class="playlist-card-title truncate">${escapeHtml(pl.title)}</div>
          <div class="playlist-card-subtitle truncate">${escapeHtml(pl.subtitle)}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        openPlaylistModal(pl.id);
      });

      featuredPlaylistsGrid.appendChild(card);
    });
  }

  function renderTrendingTracks(tracks) {
    if (!trendingTracksGrid) return;
    trendingTracksGrid.innerHTML = '';

    tracks.forEach(track => {
      const card = createExploreTrackCard(track);
      trendingTracksGrid.appendChild(card);
    });
  }

  function createExploreTrackCard(track) {
    const card = document.createElement('div');
    card.className = 'explore-song-card';

    const durationText = (track.duration && track.duration > 0) ? formatSeconds(track.duration) : '3:30';
    const coverUrl = track.cover_url || '/static/placeholder.svg';

    card.innerHTML = `
      <div class="explore-song-thumb-wrap">
        <img class="explore-song-thumb" src="${coverUrl}" onerror="this.src='/static/placeholder.svg'" alt="Cover" />
        ${track.preview_url ? `
          <div class="explore-song-preview-overlay" title="Preview 30s Snippet">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        ` : ''}
      </div>
      <div class="explore-song-info">
        <div class="explore-song-title truncate" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</div>
        <div class="explore-song-artist truncate" title="${escapeHtml(track.artist)}">${escapeHtml(track.artist)}</div>
        <div class="explore-song-meta">${durationText} • Studio Master</div>
      </div>
      <div class="explore-song-actions">
        <button class="btn-quick-download" title="1-Click Download">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Get</span>
        </button>
      </div>
    `;

    // Preview snippet audio play
    const previewBtn = card.querySelector('.explore-song-preview-overlay');
    if (previewBtn && track.preview_url) {
      previewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        previewTrackAudio(track);
      });
    }

    // 1-click Download
    const downloadBtn = card.querySelector('.btn-quick-download');
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadSingleTrack(track, downloadBtn);
    });

    return card;
  }

  function previewTrackAudio(track) {
    if (!track.preview_url) return;
    currentSongIndex = -1;
    audioEngine.src = track.preview_url;
    audioEngine.play().catch(() => {});
    
    playerTitle.textContent = `${track.title} (Preview)`;
    playerArtist.textContent = track.artist;
    playerCover.src = track.cover_url || '/static/placeholder.svg';

    playerScrubber.value = 0;
    updateScrubberFill(0);
    playerCurrentTime.textContent = '0:00';
    const totalSec = (track.duration && track.duration > 0) ? track.duration : 30;
    playerTotalTime.textContent = formatSeconds(totalSec);

    // Synchronize to Fullscreen "Now Playing" Overlay
    if (fsCover) fsCover.src = track.cover_url || '/static/placeholder.svg';
    if (fsTitle) fsTitle.textContent = `${track.title} (Preview)`;
    if (fsArtist) fsArtist.textContent = track.artist;
    if (fsAlbum) fsAlbum.textContent = track.album || 'Music Studio Preview';
    if (fsScrubber) {
      fsScrubber.value = 0;
      updateFsScrubberFill(0);
    }
    if (fsCurrentTime) fsCurrentTime.textContent = '0:00';
    if (fsTotalTime) fsTotalTime.textContent = formatSeconds(totalSec);

    isPlaying = true;
    updatePlayIcon(true);
    highlightPlayingRow();
    showToast(`Playing 30s preview: ${track.title}`, 'info');
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
          query: track.query,
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

  async function performExploreSearch(q) {
    if (!q) return;
    try {
      exploreSearchSection.style.display = 'block';
      exploreSearchTitle.textContent = `Searching for "${q}"...`;
      exploreSearchCount.textContent = 'Fetching songs...';

      const res = await fetch(`/api/explore/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const results = data.results || [];

      exploreSearchTitle.textContent = `Results for "${q}"`;
      exploreSearchCount.textContent = `${results.length} songs found`;
      exploreSearchGrid.innerHTML = '';

      if (!results.length) {
        exploreSearchGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>No songs found for "${escapeHtml(q)}". Try another artist or song title.</p></div>`;
        return;
      }

      results.forEach(track => {
        const card = createExploreTrackCard(track);
        exploreSearchGrid.appendChild(card);
      });
    } catch (e) {
      exploreSearchTitle.textContent = 'Search Error';
      exploreSearchCount.textContent = e.message;
    }
  }

  // ==================== PLAYLIST PREVIEW MODAL ====================
  async function openPlaylistModal(playlistId) {
    if (!playlistModal) return;
    playlistModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    modalTitle.textContent = 'Loading playlist...';
    modalSubtitle.textContent = 'Fetching tracklist and studio metadata...';
    modalTrackCount.textContent = '...';
    modalTracklist.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-tertiary);"><span class="pulse-dot"></span> Loading songs...</div>`;

    try {
      const res = await fetch(`/api/explore/playlist/${encodeURIComponent(playlistId)}`);
      if (!res.ok) throw new Error('Failed to load playlist');
      const data = await res.json();
      currentModalPlaylist = data;

      modalTitle.textContent = data.title;
      modalSubtitle.textContent = data.subtitle || 'Curated Studio Collection';
      modalCover.src = data.cover_url || '/static/placeholder.svg';
      modalTrackCount.textContent = `${data.track_count || (data.tracks ? data.tracks.length : 0)} tracks`;

      renderModalTracklist(data.tracks || []);

      btnModalDownloadAll.onclick = () => {
        downloadEntirePlaylist(data);
      };
    } catch (e) {
      modalTitle.textContent = 'Error Loading Playlist';
      modalSubtitle.textContent = e.message;
      modalTracklist.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-tertiary);">${e.message}</div>`;
    }
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

    tracks.forEach((track, idx) => {
      const row = document.createElement('div');
      row.className = 'modal-track-row';
      const durationText = (track.duration && track.duration > 0) ? formatSeconds(track.duration) : '3:30';
      const coverUrl = track.cover_url || '/static/placeholder.svg';

      row.innerHTML = `
        <span class="row-num">${idx + 1}</span>
        <div class="row-meta">
          <img class="row-thumb" src="${coverUrl}" onerror="this.src='/static/placeholder.svg'" alt="Cover" />
          <div class="row-text">
            <div class="row-title truncate" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</div>
            <div class="row-artist truncate" title="${escapeHtml(track.artist)}">${escapeHtml(track.artist)}</div>
          </div>
        </div>
        <div class="row-album truncate" title="${escapeHtml(track.album || '')}">${escapeHtml(track.album || '—')}</div>
        <div class="row-time">${durationText}</div>
        <div class="row-actions">
          ${track.preview_url ? `
            <button class="btn-row-preview" title="Preview Audio">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          ` : ''}
          <button class="btn-row-download" title="Download This Track">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      `;

      // Preview audio listener
      const prevBtn = row.querySelector('.btn-row-preview');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          previewTrackAudio(track);
        });
      }

      // Download single track listener
      const dlBtn = row.querySelector('.btn-row-download');
      dlBtn.addEventListener('click', () => {
        downloadSingleTrack(track, dlBtn);
      });

      modalTracklist.appendChild(row);
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

  function playTrack(idx) {
    if (idx < 0 || idx >= librarySongs.length) return;
    currentSongIndex = idx;
    playHistory.push(idx);
    if (playHistory.length > 100) playHistory.shift();

    const song = librarySongs[idx];
    const audioUrl = `/api/songs/audio/${encodeURIComponent(song.filename)}`;
    const coverUrl = `/api/songs/artwork/${encodeURIComponent(song.filename)}`;

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
    if (!librarySongs.length) return;

    if (repeatMode === 'one') {
      audioEngine.currentTime = 0;
      audioEngine.play().catch(() => {});
      return;
    }

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
    if (!librarySongs.length) return;

    // Standard player UX: if played > 3s, restart current track
    if (audioEngine.currentTime > 3) {
      audioEngine.currentTime = 0;
      return;
    }

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
  audioEngine.addEventListener('timeupdate', () => {
    if (!isSeeking && audioEngine.duration && isFinite(audioEngine.duration)) {
      const pct = (audioEngine.currentTime / audioEngine.duration) * 100;
      playerScrubber.value = pct;
      updateScrubberFill(pct);
      playerCurrentTime.textContent = formatSeconds(audioEngine.currentTime);

      if (fsScrubber) {
        fsScrubber.value = pct;
        updateFsScrubberFill(pct);
      }
      if (fsCurrentTime) {
        fsCurrentTime.textContent = formatSeconds(audioEngine.currentTime);
      }
    }
  });

  audioEngine.addEventListener('loadedmetadata', () => {
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      playerTotalTime.textContent = formatSeconds(audioEngine.duration);
      if (fsTotalTime) fsTotalTime.textContent = formatSeconds(audioEngine.duration);
    }
  });

  audioEngine.addEventListener('durationchange', () => {
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      playerTotalTime.textContent = formatSeconds(audioEngine.duration);
      if (fsTotalTime) fsTotalTime.textContent = formatSeconds(audioEngine.duration);
    }
  });

  audioEngine.addEventListener('play', () => {
    isPlaying = true;
    updatePlayIcon(true);
    highlightPlayingRow();
  });

  audioEngine.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayIcon(false);
  });

  audioEngine.addEventListener('ended', () => {
    if (currentSongIndex >= 0 && librarySongs.length > 0) {
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
  window.addEventListener('hashchange', handleHash);

  // Initial Load
  initEventStream();
  loadExplore();
  loadLibrary();
  handleHash();
  updateShuffleUI();
  updateRepeatUI();
  updateScrubberFill(0);
});

