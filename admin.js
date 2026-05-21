// Load songs on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSongsForAdmin();
    
    // Upload form handler
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.addEventListener('submit', handleUpload);
    
    // File input name display
    const fileInput = document.getElementById('songFile');
    fileInput.addEventListener('change', (e) => {
        const fileName = e.target.files[0]?.name || 'Chưa có file nào được chọn';
        document.querySelector('.file-name').textContent = fileName;
    });
});

// Load songs for admin table
async function loadSongsForAdmin() {
    const tableBody = document.getElementById('songsTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="loading">Đang tải danh sách...</td></tr>';
    
    try {
        const response = await fetch('/api/songs');
        const songs = await response.json();
        
        if (songs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="loading">Chưa có bài hát nào. Hãy upload bài hát đầu tiên!</td></tr>';
            return;
        }
        
        tableBody.innerHTML = songs.map((song, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(song.title)}</strong></td>
                <td>${escapeHtml(song.artist)}</td>
                <td>${formatDate(song.uploadDate)}</td>
                <td class="action-buttons">
                    <button class="btn-download" onclick="downloadSong(${song.id}, '${escapeHtml(song.title)}')">
                        <i class="fas fa-download"></i> Tải
                    </button>
                    <button class="btn-delete" onclick="deleteSong(${song.id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading songs:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">Lỗi khi tải danh sách. Vui lòng thử lại.</td></tr>';
    }
}

// Handle upload
async function handleUpload(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const songFile = document.getElementById('songFile').files[0];
    const messageDiv = document.getElementById('uploadMessage');
    
    if (!title || !artist || !songFile) {
        showMessage('Vui lòng điền đầy đủ thông tin và chọn file MP3', 'error');
        return;
    }
    
    if (songFile.type !== 'audio/mpeg') {
        showMessage('Chỉ chấp nhận file MP3', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('songFile', songFile);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('Upload thành công! Bài hát đã được thêm vào thư viện.', 'success');
            // Reset form
            document.getElementById('title').value = '';
            document.getElementById('artist').value = '';
            document.getElementById('songFile').value = '';
            document.querySelector('.file-name').textContent = 'Chưa có file nào được chọn';
            // Reload song list
            loadSongsForAdmin();
        } else {
            showMessage(result.error || 'Upload thất bại. Vui lòng thử lại.', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showMessage('Có lỗi xảy ra khi upload. Vui lòng thử lại.', 'error');
    }
}

// Delete song
async function deleteSong(songId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bài hát này?')) return;
    
    try {
        const response = await fetch(`/api/songs/${songId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('Xóa bài hát thành công!', 'success');
            loadSongsForAdmin();
        } else {
            showMessage(result.error || 'Xóa thất bại', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showMessage('Có lỗi xảy ra khi xóa bài hát.', 'error');
    }
}

// Download song
async function downloadSong(songId, songTitle) {
    try {
        const response = await fetch('/api/songs');
        const songs = await response.json();
        const song = songs.find(s => s.id === songId);
        
        if (song) {
            // Create download link
            const link = document.createElement('a');
            link.href = '/' + song.filePath;
            link.download = `${song.title} - ${song.artist}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showMessage(`Đang tải xuống: ${songTitle}`, 'success');
        } else {
            showMessage('Không tìm thấy bài hát để tải', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showMessage('Có lỗi xảy ra khi tải bài hát', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('uploadMessage');
    messageDiv.textContent = message;
    messageDiv.className = `upload-message ${type}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'upload-message';
    }, 3000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}