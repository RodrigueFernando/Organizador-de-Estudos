require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

// serve index.html, Style/style.css, script etc.
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
// CONEXÃO NEON
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

// TESTAR CONEXÃO
pool.query("SELECT NOW()")
  .then(() => {
    console.log("Neon PostgreSQL conectado!");
  })
  .catch((err) => {
    console.error("Erro ao conectar:", err.message);
  });

// GEMINI IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});
// CRIAR PASTA UPLOADS
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// CONFIGURAÇÃO MULTER
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

// TESTE SERVIDOR
app.get("/teste", (req, res) => {
  res.json({
    mensagem: "Servidor funcionando"
  });
});

// TESTE BANCO
app.get("/teste-banco", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");

    res.json({
      sucesso: true,
      mensagem: "Banco funcionando",
      horario: resultado.rows[0]
    });

  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: err.message
    });
  }
});

// CADASTRAR USUÁRIO
app.post("/cadastrar", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.json({
      sucesso: false,
      mensagem: "Preencha todos os campos"
    });
  }

  try {
    const existe = await pool.query(
      "SELECT * FROM usuario WHERE email = $1",
      [email]
    );

    if (existe.rows.length > 0) {
      return res.json({
        sucesso: false,
        mensagem: "Usuário já existe"
      });
    }

    await pool.query(
      "INSERT INTO usuario (email, senha) VALUES ($1, $2)",
      [email, senha]
    );

    res.json({
      sucesso: true,
      mensagem: "Usuário cadastrado"
    });

  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: err.message
    });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.json({
      sucesso: false,
      mensagem: "Preencha todos os campos"
    });
  }

  try {
    const resultado = await pool.query(
      "SELECT * FROM usuario WHERE email = $1 AND senha = $2",
      [email, senha]
    );

    if (resultado.rows.length === 0) {
      return res.json({
        sucesso: false,
        mensagem: "Login inválido"
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso",
      usuario: resultado.rows[0]
    });

  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: err.message
    });
  }
});

// SALVAR TAREFA
app.post("/salvar-tarefa", upload.single("pdf"), async (req, res) => {
  const { materia, topico, dificuldade, dataProva } = req.body;

  if (!materia || !topico || !dificuldade || !dataProva) {
    return res.json({
      sucesso: false,
      mensagem: "Preencha todos os campos"
    });
  }

  if (!req.file) {
    return res.json({
      sucesso: false,
      mensagem: "PDF não enviado"
    });
  }

  try {
    await pool.query(
      `
      INSERT INTO tarefa
      (
        titulo,
        prazo,
        materia,
        topico,
        dificuldade,
        pdf,
        concluida
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        topico,
        dataProva,
        materia,
        topico,
        dificuldade,
        req.file.filename,
        false
      ]
    );

    res.json({
      sucesso: true,
      mensagem: "Tarefa salva com sucesso"
    });

  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: err.message
    });
  }
});

// LISTAR TAREFAS
app.get("/tarefas", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM tarefa ORDER BY id DESC"
    );

    res.json(resultado.rows);

  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: err.message
    });
  }
});

// ATUALIZAR STATUS
app.post("/atualizar-tarefa/:id", async (req, res) => {
  const { id } = req.params;
  const { concluida } = req.body;

  try {
    await pool.query(
      "UPDATE tarefa SET concluida = $1 WHERE id = $2",
      [concluida, id]
    );

    res.json({
      sucesso: true,
      mensagem: "Tarefa atualizada"
    });

  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: err.message
    });
  }
});

// GERAR SIMULADO COM GEMINI
app.get("/gerar-simulado", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT materia, topico, dificuldade
      FROM tarefa
      WHERE materia IS NOT NULL
      AND topico IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 5
    `);

    const tarefas = resultado.rows;

    if (tarefas.length === 0) {
      return res.json({
        sucesso: false,
        mensagem: "Nenhuma tarefa cadastrada."
      });
    }

    const prompt = `
Gere perguntas de múltipla escolha em português do Brasil.

Baseado nestas tarefas:
${JSON.stringify(tarefas)}

Retorne APENAS um JSON válido neste formato:

[
  {
    "materia": "Matemática",
    "pergunta": "Qual alternativa está correta?",
    "alternativas": [
      "Alternativa A",
      "Alternativa B",
      "Alternativa C",
      "Alternativa D"
    ],
    "correta": 0
  }
]

Regras:
- Gere uma pergunta para cada tópico.
- Cada pergunta deve ser básica e clara.
- Cada pergunta deve ter 4 alternativas.
- correta deve ser 0, 1, 2 ou 3.
- Não escreva texto fora do JSON.
`;

    const respostaIA = await model.generateContent(prompt);

    const texto = respostaIA.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const perguntas = JSON.parse(texto);

    res.json({
      sucesso: true,
      perguntas
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      sucesso: false,
      mensagem: err.message
    });
  }
});

// GERAR QUESTIONÁRIO COM GEMINI
app.get("/gerar-questionario/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query(
      "SELECT materia, topico, titulo FROM tarefa WHERE id = $1",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.json({
        sucesso: false,
        mensagem: "Tarefa não encontrada."
      });
    }

    const tarefa = resultado.rows[0];

    const materia = tarefa.materia || "Matéria";
    const topico = tarefa.topico || tarefa.titulo;

    const prompt = `
Crie uma pergunta básica de questionário em português do Brasil.

Matéria: ${materia}
Tópico: ${topico}

Retorne APENAS um JSON válido neste formato:

{
  "materia": "${materia}",
  "topico": "${topico}",
  "pergunta": "Texto da pergunta",
  "alternativas": [
    "Alternativa A",
    "Alternativa B",
    "Alternativa C",
    "Alternativa D"
  ],
  "correta": 0
}

Regras:
- A pergunta deve ser simples e básica.
- Deve avaliar se o aluno entendeu o tópico.
- Deve ter 4 alternativas.
- correta deve ser 0, 1, 2 ou 3.
- Não escreva nada fora do JSON.
`;

    const respostaIA = await model.generateContent(prompt);

    const texto = respostaIA.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const questionario = JSON.parse(texto);

    res.json({
      sucesso: true,
      questionario
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      sucesso: false,
      mensagem: err.message
    });
  }
});

// SERVIDOR
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
  });
}

module.exports = app;