require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://organizador-de-estudos-ucy2.vercel.app"
  ]
}));
app.use(express.json());


// FRONTEND


// serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// rota principal do site
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});



// CLOUDINARY CONFIG


// configura credenciais do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// define storage do multer usando Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "tarefas-pdfs", // pasta no cloudinary
    resource_type: "raw",   // necessário para PDF
    public_id: (req, file) => Date.now() + "-" + file.originalname
  }
});

// inicializa multer com Cloudinary
const upload = multer({ storage });



// BANCO (NEON)


// conexão com PostgreSQL Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

// teste de conexão com banco
pool.query("SELECT NOW()")
  .then(() => console.log("Neon PostgreSQL conectado!"))
  .catch(err => console.error("Erro banco:", err.message));



// GEMINI IA


// inicializa API do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// modelo usado
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});



// TESTE SERVER


// rota de teste
app.get("/teste", (req, res) => {
  res.json({ mensagem: "Servidor funcionando" });
});


// =========================
// SALVAR TAREFA
// =========================

// cria tarefa com upload de PDF no Cloudinary
app.post("/salvar-tarefa", upload.single("pdf"), async (req, res) => {

  const { materia, topico, dificuldade, dataProva } = req.body;

  // valida campos obrigatórios
  if (!materia || !topico || !dificuldade || !dataProva) {
    return res.status(400).json({ erro: "Campos obrigatórios faltando" });
  }

  // valida arquivo
  if (!req.file) {
    return res.status(400).json({ erro: "PDF não enviado" });
  }

  try {

    // URL do PDF no Cloudinary
    const pdfUrl = req.file.path;

    // salva no banco
    await pool.query(
      `INSERT INTO tarefa
      (titulo, prazo, materia, topico, dificuldade, pdf, concluida)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        topico,
        dataProva,
        materia,
        topico,
        dificuldade,
        pdfUrl,
        false
      ]
    );

    // resposta sucesso
    res.json({
      sucesso: true,
      pdf: pdfUrl
    });

  } catch (err) {
    // erro interno
    res.status(500).json({ erro: err.message });
  }
});



// EXPORT VERCEL


// necessário para Vercel funcionar
module.exports = app;