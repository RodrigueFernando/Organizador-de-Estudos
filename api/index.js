require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");

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

// teste rápido 
cloudinary.api.ping()
  .then(res => console.log("Cloudinary OK:", res))
  .catch(err => console.error("Cloudinary erro:", err));

// storage cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tarefas",
    resource_type: "auto",
  },
});

const upload = multer({ storage });

cloudinary.api.ping()
  .then(res => console.log("Cloudinary OK:", res))
  .catch(err => console.error("Cloudinary erro:", err));


// CONEXÃO COM O NEON
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

pool.query("SELECT NOW()")
  .then(() => console.log("Neon PostgreSQL conectado!"))
  .catch(err => console.error("Erro banco:", err.message));

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


// =========================
// CADASTRAR USUÁRIO
// =========================

app.post("/api/cadastrar", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Preencha todos os campos."
    });
  }

  try {
    const usuarioExistente = await pool.query(
      "SELECT id FROM usuario WHERE email = $1",
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail já cadastrado."
      });
    }

    await pool.query(
      "INSERT INTO usuario (email, senha) VALUES ($1, $2)",
      [email, senha]
    );

    res.json({
      sucesso: true,
      mensagem: "Usuário cadastrado com sucesso!"
    });

  } catch (erro) {
    console.error("Erro cadastro:", erro);

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao cadastrar usuário."
    });
  }
});


// LOGIN


app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Preencha todos os campos."
    });
  }

  try {
    const resultado = await pool.query(
      "SELECT * FROM usuario WHERE email = $1 AND senha = $2",
      [email, senha]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "E-mail ou senha inválidos."
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso!"
    });

  } catch (erro) {
    console.error("Erro login:", erro);

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao realizar login."
    });
  }
});
// export vercel
module.exports = app;