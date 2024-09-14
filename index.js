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
const PRERENDER_TOKEN = process.env.const;

app.use(express.json());
app.use(cors());
app.use(require('prerender-node').set('prerenderToken', PRERENDER_TOKEN));

// Database Connection With MongoDB
mongoose.connect("mongodb+srv://edsonanibal:"+ encodeURIComponent(PASSWORD_MONGO)+CLUSTER);

app.use('/', productRoutes);
app.use('/', userRoutes);
app.use('/', paymentRoutes);
app.use('/', processOrderRoutes);

// Image Stogare Engine

const storage = multer.diskStorage({
    destination: "./upload/images",
    filename: (req, file, cb) => {
        return cb(null, `${file.originalname}`);
    }
});


const upload = multer({storage: storage});

// Criando um endpoint de upload para imagens
app.use("/images", express.static("upload/images"));

app.post("/upload", upload.array('image'), (req, res) => {
    const imageUrls = req.files.map(file => `${API_HOST}/images/${file.filename}`);
    
    res.json({
        success: 1,
        image_urls: imageUrls
    });
});

app.get('/images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = __dirname + '/upload/images/' + imageName; 

    res.sendFile(imagePath);
});


app.listen(port, (error) => {
    if(!error) {
        console.log("Server Running on Port "+port);
    } else {
        console.log("Error :" +error);
    }
});

