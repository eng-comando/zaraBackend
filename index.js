const port = 4000;
const express = require("express");
const app = express();

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const axios = require('axios');

const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const processOrderRoutes = require('./routes/processOrderRoutes');
require('dotenv').config();

const API_HOST = process.env.API_HOST;
const PASSWORD_MONGO = process.env.PASSWORD_MONGO;
const CLUSTER = process.env.CLUSTER;

// Middleware
app.use(express.json());
app.use(cors());

// Monta a URI completa de conexão MongoDB
const mongoURI = `mongodb+srv://edsonanibal:${encodeURIComponent(PASSWORD_MONGO)}${CLUSTER}`;

// Conecta ao MongoDB com tratamento de sucesso e erro
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Rotas
app.use('/', productRoutes);
app.use('/', userRoutes);
app.use('/', paymentRoutes);
app.use('/', processOrderRoutes);

// Configuração do storage para imagens
const storage = multer.diskStorage({
    destination: "./upload/images",
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});

// Servir imagens estáticas
app.use("/images", express.static("upload/images"));

// Endpoint para upload de imagens
app.post("/upload", upload.array('image'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Nenhuma imagem foi carregada." });
    }

    const imageUrls = req.files.map(file => `${API_HOST}/images/${file.filename}`);

    console.log('URLs das imagens:', imageUrls);

    res.json({
        success: 1,
        image_urls: imageUrls
    });
});

// Endpoint para servir imagens via URL
app.get('/images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, 'upload', 'images', imageName);

    res.sendFile(imagePath);
});

// Inicia servidor
app.listen(port, () => {
    console.log(`Server Running on Port ${port}`);
});
