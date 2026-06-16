require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");

const app = express();

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://organizador-de-estudos-ucy2.vercel.app"
  ]
}));

app.use(express.json());

// Arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, "..")));

// ==========================================
// CONFIGURAÇÃO DO CLOUDINARY E MULTER (RAM)
// ==========================================
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// O Multer salva o arquivo direto na memória RAM (essencial para a Vercel Serverless)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==========================================
// CONEXÃO COM O NEON POSTGRESQL
// ==========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Garante a conexão estável com o Neon em qualquer ambiente
  }
});

pool.query("SELECT NOW()")
  .then(() => console.log("Neon PostgreSQL conectado!"))
  .catch(err => console.error("Erro banco:", err.message));


// ==========================================
// ROTAS GENÉRICAS / TESTES
// ==========================================

// Rota principal (Serve o index.html da raiz)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Teste da API
app.get("/api", (req, res) => {
  res.json({ mensagem: "API funcionando" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor online" });
});


// ==========================================
// ROTA: SALVAR TAREFA BLINDADA (ESTRATÉGIA IMAGE)
// ==========================================
app.post("/api/salvar-tarefa", upload.single("pdf"), (req, res) => {
  console.log("BODY RECEBIDO:", req.body);
  console.log("ARQUIVO NA MEMÓRIA RAM:", req.file);

  // Captura o 'dataProva' enviado pelo seu formulário HTML
  const { materia, topico, dificuldade, dataProva } = req.body;

  if (!req.file) {
    return res.status(400).json({ 
      sucesso: false, 
      mensagem: "Nenhum arquivo PDF foi enviado." 
    });
  }

  // DEFINIÇÃO DA VARIÁVEL (Corrige o ReferenceError):
  // Convertemos o arquivo PDF que está na memória RAM para Base64 antes do upload
  const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

  // Cria um nome totalmente limpo: remove espaços, acentos e símbolos para evitar problemas na URL
  const nomeArquivoLimpo = req.file.originalname
    .split('.')[0]
    .normalize("NFD")                  
    .replace(/[\u0300-\u036f]/g, "")   
    .replace(/[^a-zA-Z0-9-_]/g, "_");  

  // Forçamos a extensão física .pdf no identificador único do Cloudinary
  const publicIdComExtensao = `tarefas/${nomeArquivoLimpo}_${Date.now()}.pdf`;

  console.log("Enviando para o Cloudinary como tipo imagem:", publicIdComExtensao);

  // Enviamos usando resource_type: "image" para burlar a trava de segurança do 404
  cloudinary.uploader.upload(fileBase64, {
    resource_type: "image", 
    public_id: publicIdComExtensao 
  }, async (error, result) => {
    
    if (error) {
      console.error("Erro no upload nativo do Cloudinary:", error);
      return res.status(500).json({ 
        sucesso: false, 
        mensagem: "Erro ao enviar o PDF para o Cloudinary." 
      });
    }

    console.log("RESULTADO CLOUDINARY:", result);
    let pdfUrl = result.secure_url; 

    try {
      // TRATAMENTO DA DATA: Garante formato YYYY-MM-DD aceito pelo PostgreSQL
      let dataFormatada = null;
      if (dataProva && dataProva.trim() !== "") {
        dataFormatada = dataProva.split("T")[0]; 
      } else {
        dataFormatada = new Date().toISOString().split("T")[0];
      }

      console.log("DATA FORMATADA PARA O NEON:", dataFormatada);

      // Executa a Query de inserção no Neon com todas as variáveis tratadas
      const novaTarefa = await pool.query(
        "INSERT INTO tarefa (materia, topico, titulo, dificuldade, prazo, pdf, concluida) VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *",
        [
          materia || "Sem matéria", 
          topico || "Sem tópico", 
          topico || "Sem título", 
          dificuldade || "1", 
          dataFormatada,          
          pdfUrl                  
        ]
      );

      res.json({
        sucesso: true,
        mensagem: "Tarefa recebida e salva com absoluto sucesso no banco!",
        dados: novaTarefa.rows[0]
      });

    } catch (erroBanco) {
      console.error("ERRO CRÍTICO NO NEON POSTGRESQL:", erroBanco.message);
      res.status(500).json({ 
        sucesso: false, 
        mensagem: "Erro no banco de dados: " + erroBanco.message 
      });
    }
  });
});


// ==========================================
// ROTA: LISTAR TAREFAS
// ==========================================
app.get("/api/tarefas", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM tarefa ORDER BY id DESC");
    res.json(resultado.rows);
  } catch (erro) {
    console.error("Erro ao listar tarefas do Neon:", erro);
    res.status(500).json({ error: "Erro ao buscar tarefas do servidor." });
  }
});


// ==========================================
// ROTA: ATUALIZAR STATUS DA TAREFA
// ==========================================
app.post("/api/atualizar-tarefa/:id", async (req, res) => {
  const { id } = req.params;
  const { concluida } = req.body;

  try {
    await pool.query(
      "UPDATE tarefa SET concluida = $1 WHERE id = $2",
      [concluida, id]
    );

    res.json({
      sucesso: true,
      mensagem: "Status atualizado com sucesso!"
    });
  } catch (erro) {
    console.error("Erro ao atualizar status no Neon:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar tarefa no servidor."
    });
  }
});


// ==========================================
// ROTA: CADASTRAR USUÁRIO
// ==========================================
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


// ==========================================
// ROTA: LOGIN
// ==========================================
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


// ==========================================
// INICIALIZAÇÃO DO SERVIDOR LOCAL
// ==========================================
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
  });
}

// Exportação para a Vercel
module.exports = app;