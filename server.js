const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Tạo thư mục uploads nếu chưa có
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Kết nối database
const db = new sqlite3.Database('./database.sqlite');

// Tạo bảng songs
db.run(`
    CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        filePath TEXT NOT NULL,
        uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Cấu hình multer để upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/mpeg') {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file MP3'), false);
        }
    }
});

// API lấy danh sách bài hát
app.get('/api/songs', (req, res) => {
    db.all('SELECT * FROM songs ORDER BY uploadDate DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API upload bài hát mới
app.post('/api/upload', upload.single('songFile'), (req, res) => {
    const { title, artist } = req.body;
    const filePath = req.file.path;

    if (!title || !artist || !req.file) {
        return res.status(400).json({ error: 'Thiếu thông tin bài hát hoặc file MP3' });
    }

    db.run(
        'INSERT INTO songs (title, artist, filePath) VALUES (?, ?, ?)',
        [title, artist, filePath],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true, 
                id: this.lastID,
                message: 'Upload thành công!'
            });
        }
    );
});

// API xóa bài hát
app.delete('/api/songs/:id', (req, res) => {
    const songId = req.params.id;

    db.get('SELECT * FROM songs WHERE id = ?', [songId], (err, song) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!song) {
            return res.status(404).json({ error: 'Không tìm thấy bài hát' });
        }

        // Xóa file vật lý
        fs.unlink(song.filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Lỗi xóa file:', unlinkErr);
            }
        });

        // Xóa record trong database
        db.run('DELETE FROM songs WHERE id = ?', [songId], (delErr) => {
            if (delErr) {
                return res.status(500).json({ error: delErr.message });
            }
            res.json({ success: true, message: 'Xóa bài hát thành công!' });
        });
    });
});

// Phục vụ file tĩnh
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log(`Trang nghe nhạc: http://localhost:${PORT}`);
    console.log(`Trang quản lý: http://localhost:${PORT}/admin`);
});