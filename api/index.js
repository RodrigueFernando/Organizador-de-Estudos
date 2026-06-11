require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://organizador-de-estudos-ucy2.vercel.app"
  ]
}));

app.use(express.json());

// arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, "..")));

// cloudinary
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// config cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// storage cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tarefas",
    resource_type: "auto",
  },
});

const upload = multer({ storage });

// rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// teste api
app.get("/api", (req, res) => {
  res.json({
    mensagem: "API funcionando"
  });
});

// health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "Servidor online"
  });
});

// teste post
app.post("/api/teste-post", (req, res) => {
  console.log(req.body);

  res.json({
    sucesso: true,
    dados: req.body
  });
});

// salvar tarefa (upload pdf cloudinary)
app.post("/api/salvar-tarefa", upload.single("pdf"), (req, res) => {

  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  if (!req.file) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "PDF não enviado"
    });
  }

  res.json({
    sucesso: true,
    mensagem: "Tarefa recebida com sucesso",
    fileUrl: req.file.path
  });
});

// listar tarefas (desativado por enquanto)
/*
app.get("/api/tarefas", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM tarefa ORDER BY id DESC"
    );

    res.json(resultado.rows);

  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message
    });
  }
});
*/

// servidor local
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
  });
}

// export vercel
module.exports = app;