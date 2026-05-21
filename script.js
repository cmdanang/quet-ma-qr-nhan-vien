let songs = [];
let currentSongIndex = 0;
let isPlaying = false;
const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const currentTimeSpan = document.getElementById('currentTime');
const totalTimeSpan = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volumeSlider');
const currentTitle = document.getElementById('currentTitle');
const currentArtist = document.getElementById('currentArtist');
const songsGrid = document.getElementById('songsGrid');
const searchInput = document.getElementById('searchInput');

// Load songs from API
async function loadSongs() {
    try {
        const response = await fetch('/api/songs');
        songs = await response.json();
        displaySongs(songs);
        if (songs.length > 0 && !audio.src) {
            loadSong(0);
        }
    } catch (error) {
        console.error('Error loading songs:', error);
        songsGrid.innerHTML = '<div class="loading">Không thể tải danh sách nhạc. Vui lòng thử lại sau.</div>';
    }
}

// Display songs in grid
function displaySongs(songsToShow) {
    if (songsToShow.length === 0) {
        songsGrid.innerHTML = '<div class="loading">Không tìm thấy bài hát nào.</div>';
        return;
    }

    songsGrid.innerHTML = songsToShow.map((song, index) => `
        <div class="song-card" data-index="${songs.findIndex(s => s.id === song.id)}">
            <div class="song-avatar-card">
                <i class="fas fa-music"></i>
            </div>
            <h3>${escapeHtml(song.title)}</h3>
            <p>${escapeHtml(song.artist)}</p>
        </div>
    `).join('');

    // Add click events to song cards
    document.querySelectorAll('.song-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.index);
            playSong(index);
        });
    });
}

// Load a song
function loadSong(index) {
    if (index < 0) index = 0;
    if (index >= songs.length) index = songs.length - 1;
    
    currentSongIndex = index;
    const song = songs[currentSongIndex];
    currentTitle.textContent = song.title;
    currentArtist.textContent = song.artist;
    audio.src = '/' + song.filePath;
    audio.load();
    
    // Highlight active song
    document.querySelectorAll('.song-card').forEach((card, i) => {
        if (i === currentSongIndex) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

// Play song
function playSong(index) {
    loadSong(index);
    audio.play();
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
}

// Toggle play/pause
function togglePlayPause() {
    if (songs.length === 0) return;
    
    if (isPlaying) {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audio.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

// Next song
function nextSong() {
    if (songs.length === 0) return;
    let newIndex = currentSongIndex + 1;
    if (newIndex >= songs.length) newIndex = 0;
    playSong(newIndex);
}

// Previous song
function prevSong() {
    if (songs.length === 0) return;
    let newIndex = currentSongIndex - 1;
    if (newIndex < 0) newIndex = songs.length - 1;
    playSong(newIndex);
}

// Update progress bar
function updateProgress() {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = percent + '%';
        currentTimeSpan.textContent = formatTime(audio.currentTime);
        totalTimeSpan.textContent = formatTime(audio.duration);
    }
}

// Set progress on click
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

// Format time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Set volume
function setVolume() {
    audio.volume = volumeSlider.value;
}

// Auto next when song ends
audio.addEventListener('ended', () => {
    nextSong();
});

// Event listeners
playPauseBtn.addEventListener('click', togglePlayPause);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('timeupdate', updateProgress);
progressBar.addEventListener('click', setProgress);
volumeSlider.addEventListener('input', setVolume);
audio.addEventListener('loadedmetadata', () => {
    totalTimeSpan.textContent = formatTime(audio.duration);
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredSongs = songs.filter(song => 
        song.title.toLowerCase().includes(searchTerm) || 
        song.artist.toLowerCase().includes(searchTerm)
    );
    displaySongs(filteredSongs);
});

// Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Initialize
loadSongs();