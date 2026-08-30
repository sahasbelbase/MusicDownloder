/**
 * SpotiDownloader Studio - Client Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputUrl = document.getElementById('input-url');
    const btnDownload = document.getElementById('btn-download');
    const btnPaste = document.getElementById('btn-paste');
    const btnStop = document.getElementById('btn-stop-download');
    const btnEnrichAll = document.getElementById('btn-enrich-all');
    const btnOpenFolder = document.getElementById('btn-open-folder');
    const btnRefreshLibrary = document.getElementById('btn-refresh-library');
    
    // Status & Metrics
    const statusBadge = document.getElementById('status-badge');
    const metricPlaylistName = document.getElementById('metric-playlist-name');
    const metricStatusMsg = document.getElementById('metric-status-msg');
    const metricDownloaded = document.getElementById('metric-downloaded');
    const metricSkipped = document.getElementById('metric-skipped');
    const metricTotal = document.getElementById('metric-total');
    const metricPercent = document.getElementById('metric-percent');
    const metricSpeed = document.getElementById('metric-speed');
    const progressBar = document.getElementById('progress-bar');
    const progressSubtitle = document.getElementById('progress-subtitle');
    const streamFeed = document.getElementById('stream-feed');
    const navSongCount = document.getElementById('nav-song-count');
    
    // Settings
    const settingThreads = document.getElementById('setting-threads');
    const settingQuality = document.getElementById('setting-quality');
    const settingSort = document.getElementById('setting-sort');
    const settingNaming = document.getElementById('setting-naming');
    
    // Library
    const libraryGrid = document.getElementById('library-song-grid');
    const librarySearch = document.getElementById('library-search');
    
    // Audio Player
    const audioEngine = document.getElementById('audio-engine');
    const playerBar = document.getElementById('player-bar');
    const playerCover = document.getElementById('player-cover');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerPlayBtn = document.getElementById('player-play');
    const playerPlayIcon = document.getElementById('player-play-icon');
    const playerPrev = document.getElementById('player-prev');
    const playerNext = document.getElementById('player-next');
    const playerScrubber = document.getElementById('player-scrubber');
    const playerCurrentTime = document.getElementById('player-current-time');
    const playerTotalTime = document.getElementById('player-total-time');
    const playerVolume = document.getElementById('player-volume');

    // Local State
    let currentPlaylistSongs = [];
    let currentSongIndex = -1;
    let isPlaying = false;
    let hasStreamItems = false;

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-tab');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            
            if (targetTab === 'library') {
                loadLibrary();
            }
        });
    });

    // Quick Action Chips
    document.getElementById('chip-my-list').addEventListener('click', () => {
        inputUrl.value = "https://music.youtube.com/playlist?list=RDCLAK5uy_n9Fbdw7e6ap-98_A-8JYMwLLacZleCcD8";
        showToast("Loaded Top Hits playlist!");
    });
    document.getElementById('chip-spotify-hit').addEventListener('click', () => {
        inputUrl.value = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
        showToast("Loaded Spotify Top Hits playlist!");
    });
    document.getElementById('chip-single-test').addEventListener('click', () => {
        inputUrl.value = "https://open.spotify.com/track/4P9Q0GoiGfFp2WrmUkyv1m";
        showToast("Loaded single track link!");
    });

    // Paste from Clipboard
    btnPaste.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                inputUrl.value = text.trim();
                showToast("URL pasted from clipboard!");
            }
        } catch (e) {
            showToast("Clipboard access denied. Please paste manually.", "warning");
        }
    });

    // Open Folder
    btnOpenFolder.addEventListener('click', async () => {
        try {
            await fetch('/api/open-folder', { method: 'POST' });
            showToast("Opened Songs folder in Finder!");
        } catch (e) {
            showToast("Failed to open folder", "error");
        }
    });

    // Start Download
    btnDownload.addEventListener('click', async () => {
        const url = inputUrl.value.trim();
        if (!url) {
            showToast("Please enter a valid Spotify or YouTube Music URL", "warning");
            return;
        }

        const payload = {
            url: url,
            threads: parseInt(settingThreads.value),
            quality: settingQuality.value,
            sort: settingSort.value,
            naming: settingNaming.value
        };

        try {
            btnDownload.disabled = true;
            btnDownload.innerHTML = `<svg class="rotating" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Starting...`;
            
            const res = await fetch('/api/download/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Download failed to start");
            }

            showToast("🚀 Download initiated! Processing tracks...");
            btnStop.style.display = "inline-flex";
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            btnDownload.disabled = false;
            btnDownload.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Download`;
        }
    });

    // Stop Download
    btnStop.addEventListener('click', async () => {
        try {
            await fetch('/api/download/stop', { method: 'POST' });
            showToast("Stopping download workers...", "warning");
        } catch (e) {
            showToast("Failed to stop download", "error");
        }
    });

    // Enrich Studio Metadata
    btnEnrichAll.addEventListener('click', async () => {
        try {
            btnEnrichAll.disabled = true;
            btnEnrichAll.innerHTML = `✨ Enriching with Apple Music...`;
            
            const res = await fetch('/api/enrich/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threads: 8, upgrade_artwork: true })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Enrichment failed");
            }

            showToast("✨ Started studio metadata & HD cover art enrichment!");
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            btnEnrichAll.disabled = false;
            btnEnrichAll.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> ✨ Enrich Studio Metadata & HD Art`;
        }
    });

    // Real-Time SSE Stream Listener
    function initEventStream() {
        const evtSource = new EventSource('/api/events');

        evtSource.onmessage = (e) => {
            try {
                const packet = JSON.parse(e.data);
                handleLiveEvent(packet.type, packet.data);
            } catch (err) {
                console.error("SSE parse error", err);
            }
        };

        evtSource.onerror = () => {
            console.log("SSE disconnected, polling fallback active");
        };
    }

    function handleLiveEvent(type, data) {
        if (type === "progress") {
            updateDashboard(data);
            if (data.last_song) {
                addStreamCard(data.last_song);
            }
        } else if (type === "status") {
            metricStatusMsg.textContent = data.message;
            if (data.running) {
                statusBadge.textContent = "Downloading";
                statusBadge.classList.add("active");
                btnStop.style.display = "inline-flex";
            }
        } else if (type === "playlist_loaded") {
            metricPlaylistName.textContent = data.title;
            metricTotal.textContent = `0 / ${data.total}`;
            progressSubtitle.textContent = `Processing ${data.total} tracks in parallel...`;
        } else if (type === "completed") {
            statusBadge.textContent = "Finished";
            statusBadge.classList.remove("active");
            btnStop.style.display = "none";
            showToast(`🎉 Playlist download complete! (${data.downloaded} new, ${data.skipped} skipped) in ${data.time}s`);
            loadLibrary();
        } else if (type === "enrich_progress") {
            progressSubtitle.textContent = `Enriching ${data.current}/${data.total}: ${data.filename}`;
            progressBar.style.width = `${data.percent}%`;
        } else if (type === "enrich_complete") {
            showToast(`✨ Enriched ${data.updated} of ${data.total} songs with HD album art and studio tags!`);
            loadLibrary();
        }
    }

    function updateDashboard(data) {
        progressBar.style.width = `${data.percent}%`;
        metricDownloaded.textContent = data.downloaded;
        metricSkipped.textContent = data.skipped;
        metricTotal.textContent = `${data.processed} / ${data.total}`;
        metricPercent.textContent = `${data.percent}% Completed`;
        progressSubtitle.textContent = `Processing track ${data.processed} of ${data.total}...`;
        statusBadge.textContent = "Downloading";
        statusBadge.classList.add("active");
        btnStop.style.display = "inline-flex";
    }

    function addStreamCard(song) {
        if (!hasStreamItems) {
            streamFeed.innerHTML = "";
            hasStreamItems = true;
        }

        const card = document.createElement('div');
        card.className = "stream-card glass";
        
        const coverSrc = song.cover_url || `/api/songs/artwork/${encodeURIComponent(song.filename)}`;
        const badgeClass = song.status === "skipped" ? "skipped" : "downloaded";
        const badgeText = song.status === "skipped" ? "Resumed (Skipped)" : "Downloaded (320k)";

        card.innerHTML = `
            <img src="${coverSrc}" class="stream-cover" alt="Cover" onerror="this.src='/static/placeholder.svg'">
            <div class="stream-info">
                <div class="stream-title truncate">${song.title || song.filename}</div>
                <div class="stream-artist truncate">${song.artist || "Unknown Artist"}</div>
            </div>
            <span class="stream-badge ${badgeClass}">${badgeText}</span>
        `;

        streamFeed.insertBefore(card, streamFeed.firstChild);

        // Keep maximum 30 cards in live stream
        if (streamFeed.children.length > 30) {
            streamFeed.removeChild(streamFeed.lastChild);
        }
    }

    // Polling Status Fallback
    async function pollStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            if (data.is_downloading) {
                statusBadge.textContent = "Downloading";
                statusBadge.classList.add("active");
                btnStop.style.display = "inline-flex";
                progressBar.style.width = `${data.percent}%`;
                metricDownloaded.textContent = data.downloaded;
                metricSkipped.textContent = data.skipped;
                metricTotal.textContent = `${data.downloaded + data.skipped + data.failed} / ${data.total_tracks}`;
                metricPercent.textContent = `${data.percent}% Completed`;
                metricSpeed.textContent = data.speed_songs_per_min;
                metricPlaylistName.textContent = data.playlist_title || "Active Download";
            }
        } catch (e) {}
    }

    // Library Functions
    async function loadLibrary() {
        try {
            const search = librarySearch.value.trim();
            const url = search ? `/api/songs?search=${encodeURIComponent(search)}` : '/api/songs';
            const res = await fetch(url);
            const songs = await res.json();
            currentPlaylistSongs = songs;
            navSongCount.textContent = songs.length;

            if (songs.length === 0) {
                libraryGrid.innerHTML = `
                    <div class="empty-feed glass" style="grid-column: 1 / -1;">
                        <p>No songs found. Start downloading to fill your library!</p>
                    </div>
                `;
                return;
            }

            libraryGrid.innerHTML = songs.map((s, idx) => `
                <div class="song-card glass" data-index="${idx}">
                    <div class="card-artwork-wrapper">
                        <img src="/api/songs/artwork/${encodeURIComponent(s.filename)}" class="card-artwork" alt="Artwork" loading="lazy" onerror="this.src='/static/placeholder.svg'">
                        <button class="card-play-btn" data-index="${idx}" title="Play Track">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </button>
                    </div>
                    <div class="card-title truncate" title="${s.title}">${s.title}</div>
                    <div class="card-artist truncate" title="${s.artist}">${s.artist}</div>
                    <div class="card-meta">
                        <span>${s.album !== 'My_list' ? s.album : 'Single'}</span>
                        <span>${formatDuration(s.duration)}</span>
                    </div>
                </div>
            `).join('');

            // Attach play click listeners
            document.querySelectorAll('.card-play-btn, .song-card').forEach(el => {
                el.addEventListener('click', (e) => {
                    const idx = parseInt(el.getAttribute('data-index'));
                    if (!isNaN(idx)) {
                        playTrack(idx);
                    }
                });
            });

        } catch (e) {
            console.error("Library load error", e);
        }
    }

    librarySearch.addEventListener('input', debounce(loadLibrary, 300));
    btnRefreshLibrary.addEventListener('click', loadLibrary);

    // In-Browser Audio Player Engine
    function playTrack(index) {
        if (index < 0 || index >= currentPlaylistSongs.length) return;
        currentSongIndex = index;
        const song = currentPlaylistSongs[index];

        playerCover.src = `/api/songs/artwork/${encodeURIComponent(song.filename)}`;
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;

        audioEngine.src = `/api/songs/audio/${encodeURIComponent(song.filename)}`;
        audioEngine.play();
        isPlaying = true;
        updatePlayIcon(true);
    }

    function updatePlayIcon(playing) {
        if (playing) {
            playerPlayIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
        } else {
            playerPlayIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
        }
    }

    playerPlayBtn.addEventListener('click', () => {
        if (!audioEngine.src) {
            if (currentPlaylistSongs.length > 0) playTrack(0);
            return;
        }
        if (isPlaying) {
            audioEngine.pause();
            isPlaying = false;
            updatePlayIcon(false);
        } else {
            audioEngine.play();
            isPlaying = true;
            updatePlayIcon(true);
        }
    });

    playerNext.addEventListener('click', () => {
        if (currentSongIndex < currentPlaylistSongs.length - 1) {
            playTrack(currentSongIndex + 1);
        } else {
            playTrack(0);
        }
    });

    playerPrev.addEventListener('click', () => {
        if (currentSongIndex > 0) {
            playTrack(currentSongIndex - 1);
        }
    });

    audioEngine.addEventListener('timeupdate', () => {
        if (audioEngine.duration) {
            const pct = (audioEngine.currentTime / audioEngine.duration) * 100;
            playerScrubber.value = pct;
            playerCurrentTime.textContent = formatDuration(Math.floor(audioEngine.currentTime));
            playerTotalTime.textContent = formatDuration(Math.floor(audioEngine.duration));
        }
    });

    audioEngine.addEventListener('ended', () => {
        playerNext.click();
    });

    playerScrubber.addEventListener('input', () => {
        if (audioEngine.duration) {
            audioEngine.currentTime = (playerScrubber.value / 100) * audioEngine.duration;
        }
    });

    playerVolume.addEventListener('input', () => {
        audioEngine.volume = playerVolume.value;
    });

    // Helper Utilities
    function formatDuration(sec) {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function showToast(msg, type = "info") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast glass ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Initialize
    initEventStream();
    loadLibrary();
    setInterval(pollStatus, 3000);
});
