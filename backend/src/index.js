// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { uploader } = require('cloudinary').v2;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/api/images', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM images ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo.' });

    const uploadResult = await new Promise((resolve) => {
        uploader.upload_stream({ resource_type: "image" }, (error, result) => resolve(result)).end(req.file.buffer);
    });

    const { title } = req.body;
    const imageUrl = uploadResult.secure_url;
    const query = 'INSERT INTO images (title, image_url) VALUES ($1, $2) RETURNING *';
    const newImage = await pool.query(query, [title, imageUrl]);

    res.status(201).json(newImage.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al subir la imagen.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});