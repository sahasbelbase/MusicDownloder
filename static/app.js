/**
 * SpotiStudio - Ultra-Clean Client Application
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

  // Application State
  let librarySongs = [];
  let currentSongIndex = -1;
  let isPlaying = false;
  let isSeeking = false;
  let isShuffle = localStorage.getItem('spotistudio_shuffle') === 'true';
  let repeatMode = localStorage.getItem('spotistudio_repeat') || 'off'; // 'off' | 'all' | 'one'
  let playHistory = [];
  let selectedSong = null;
  let searchDebounce = null;
  let previousVolume = parseFloat(localStorage.getItem('spotistudio_volume')) || 0.8;

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

  // ==================== LIBRARY LOADING & RENDERING ====================
  async function loadLibrary(query = '') {
    try {
      const url = query ? `/api/songs?search=${encodeURIComponent(query)}` : '/api/songs';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load songs');

      librarySongs = await res.json();
      navSongCount.textContent = librarySongs.length;
      libraryCountLabel.textContent = `${librarySongs.length} track${librarySongs.length === 1 ? '' : 's'}`;

      renderLibrary();
    } catch (e) {
      console.error(e);
      libraryContainer.innerHTML = `<div class="empty-state glass"><p>Failed to load music library</p></div>`;
    }
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
          <p>No tracks found in library</p>
        </div>
      `;
      return;
    }

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
            <div class="song-card-tags">
              ${song.year ? `<span class="card-mini-tag">${song.year}</span>` : ''}
              <span class="card-mini-tag">${song.bitrate || '320k'}</span>
            </div>
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

  // Library Search
  librarySearch.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    btnClearSearch.style.display = q ? 'block' : 'none';
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      loadLibrary(q);
    }, 250);
  });

  btnClearSearch.addEventListener('click', () => {
    librarySearch.value = '';
    btnClearSearch.style.display = 'none';
    loadLibrary('');
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

  drawerCloseBtn.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  drawerPlayBtn.addEventListener('click', () => {
    if (selectedSong && currentSongIndex >= 0) {
      playTrack(currentSongIndex);
    }
  });

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
    if (!playerPlayIcon) return;
    if (playing) {
      playerPlayIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
    } else {
      playerPlayIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
    }
  }

  function playNextTrack() {
    if (!librarySongs.length) return;

    if (repeatMode === 'one') {
      audioEngine.currentTime = 0;
      audioEngine.play().catch(() => {});
      return;
    }

    if (isShuffle) {
      if (librarySongs.length === 1) {
        playTrack(0);
        return;
      }
      let nextIdx;
      let attempts = 0;
      do {
        nextIdx = Math.floor(Math.random() * librarySongs.length);
        attempts++;
      } while (nextIdx === currentSongIndex && attempts < 15);
      playTrack(nextIdx);
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

    if (isShuffle && playHistory.length > 1) {
      playHistory.pop(); // current track
      const prevIdx = playHistory.pop();
      playTrack(prevIdx);
      return;
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
      localStorage.setItem('spotistudio_shuffle', isShuffle ? 'true' : 'false');
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
      localStorage.setItem('spotistudio_repeat', repeatMode);
      updateRepeatUI();
      const label = repeatMode === 'one' ? 'Repeat: Current Track' : (repeatMode === 'all' ? 'Repeat: All Tracks' : 'Repeat: Off');
      showToast(label, 'info');
    });
  }

  // Audio Engine Lifecycle
  audioEngine.addEventListener('timeupdate', () => {
    if (!isSeeking && audioEngine.duration && isFinite(audioEngine.duration)) {
      const pct = (audioEngine.currentTime / audioEngine.duration) * 100;
      playerScrubber.value = pct;
      updateScrubberFill(pct);
      playerCurrentTime.textContent = formatSeconds(audioEngine.currentTime);
    }
  });

  audioEngine.addEventListener('loadedmetadata', () => {
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      playerTotalTime.textContent = formatSeconds(audioEngine.duration);
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
    playNextTrack();
  });

  // Scrubber: Live Dragging & Seeking
  playerScrubber.addEventListener('pointerdown', () => {
    isSeeking = true;
  });

  playerScrubber.addEventListener('input', (e) => {
    isSeeking = true;
    const pct = parseFloat(e.target.value);
    updateScrubberFill(pct);
    if (audioEngine.duration && isFinite(audioEngine.duration)) {
      const previewTime = (pct / 100) * audioEngine.duration;
      playerCurrentTime.textContent = formatSeconds(previewTime);
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

  // Scrubber Wheel Scrolling
  if (scrubberWrap) {
    scrubberWrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!audioEngine.duration || !isFinite(audioEngine.duration)) return;

      const direction = (e.deltaY < 0 || e.deltaX > 0) ? 1 : -1;
      const step = direction * 4; // 4 seconds per wheel step
      const targetTime = Math.max(0, Math.min(audioEngine.currentTime + step, audioEngine.duration - 0.2));
      audioEngine.currentTime = targetTime;

      const pct = (targetTime / audioEngine.duration) * 100;
      playerScrubber.value = pct;
      updateScrubberFill(pct);
      playerCurrentTime.textContent = formatSeconds(targetTime);
    }, { passive: false });

    // Scrubber hover preview tooltip
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

  playerVolume.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audioEngine.volume = val;
    previousVolume = val;
    localStorage.setItem('spotistudio_volume', val.toString());
    updateVolumeFill(val);
    updateVolumeIcon(val);
  });

  playerMuteBtn.addEventListener('click', () => {
    if (audioEngine.volume > 0) {
      previousVolume = audioEngine.volume;
      audioEngine.volume = 0;
      playerVolume.value = 0;
      updateVolumeFill(0);
      updateVolumeIcon(0);
    } else {
      const restored = previousVolume > 0 ? previousVolume : 0.8;
      audioEngine.volume = restored;
      playerVolume.value = restored;
      updateVolumeFill(restored);
      updateVolumeIcon(restored);
    }
  });

  function updateVolumeIcon(vol) {
    if (vol === 0) {
      volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
    } else if (vol < 0.5) {
      volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
    } else {
      volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
    }
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
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      const newVol = Math.max(0, audioEngine.volume - 0.05);
      audioEngine.volume = newVol;
      playerVolume.value = newVol;
      updateVolumeFill(newVol);
      updateVolumeIcon(newVol);
    } else if (e.key === 's' || e.key === 'S') {
      if (playerShuffle) playerShuffle.click();
    } else if (e.key === 'r' || e.key === 'R') {
      if (playerRepeat) playerRepeat.click();
    } else if (e.key === 'm' || e.key === 'M') {
      if (playerMuteBtn) playerMuteBtn.click();
    } else if (e.key === 'n' || e.key === 'N' || (e.shiftKey && e.code === 'ArrowRight')) {
      playNextTrack();
    } else if (e.key === 'p' || e.key === 'P' || (e.shiftKey && e.code === 'ArrowLeft')) {
      playPrevTrack();
    } else if (e.code === 'Escape') {
      closeDrawer();
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
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
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

  // Hash-based Tab Routing (e.g. #library, #settings)
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
  loadLibrary();
  handleHash();
  updateShuffleUI();
  updateRepeatUI();
  updateScrubberFill(0);
});

