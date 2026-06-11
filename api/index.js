require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// SERVIR ARQUIVOS HTML, CSS E JS DA PASTA RAIZ
app.use(express.static(path.join(__dirname, "..")));

const upload = multer({
  dest: "uploads/"
});

// PÁGINA INICIAL
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "index.html")
  );
});

// API
app.get("/api", (req, res) => {
  res.json({
    mensagem: "API funcionando"
  });
});

// HEALTH
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "Servidor online"
  });
});

// TESTE POST
app.post("/api/teste-post", (req, res) => {
  console.log(req.body);

  res.json({
    sucesso: true,
    dados: req.body
  });
});

// SALVAR TAREFA
app.post(
  "/api/salvar-tarefa",
  upload.single("pdf"),
  (req, res) => {

    console.log("BODY:");
    console.log(req.body);

    console.log("FILE:");
    console.log(req.file);

    res.json({
      sucesso: true,
      mensagem: "Tarefa recebida com sucesso"
    });
  }
);

app.get("/api/tarefas", async (req, res) => {
  try {

    const resultado = await pool.query(
      "SELECT * FROM tarefa ORDER BY id DESC"
    );

    res.json(resultado.rows);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      sucesso: false,
      mensagem: erro.message
    });
  }
});

// RODAR LOCALMENTE
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
  });
}



// VERCEL
module.exports = app;