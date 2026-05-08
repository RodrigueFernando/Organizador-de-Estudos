const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("usuarios.json")) {
  fs.writeFileSync("usuarios.json", "[]");
}

if (!fs.existsSync("tarefas.json")) {
  fs.writeFileSync("tarefas.json", "[]");
}

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

// cadastrar usuário
app.post("/cadastrar", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.json({
      sucesso: false,
      mensagem: "Preencha todos os campos"
    });
  }

  const usuarios = JSON.parse(fs.readFileSync("usuarios.json"));

  const existe = usuarios.find(u => u.email === email);

  if (existe) {
    return res.json({
      sucesso: false,
      mensagem: "Usuário já existe"
    });
  }

  usuarios.push({ email, senha });

  fs.writeFileSync("usuarios.json", JSON.stringify(usuarios, null, 2));

  res.json({
    sucesso: true,
    mensagem: "Usuário cadastrado"
  });
});

// login
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  const usuarios = JSON.parse(fs.readFileSync("usuarios.json"));

  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (!usuario) {
    return res.json({
      sucesso: false,
      mensagem: "Login inválido"
    });
  }

  res.json({
    sucesso: true,
    mensagem: "Login realizado com sucesso"
  });
});

// salvar tarefa com pdf
app.post("/salvar-tarefa", upload.single("pdf"), (req, res) => {
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

  const tarefas = JSON.parse(fs.readFileSync("tarefas.json"));

  tarefas.push({
    materia,
    topico,
    dificuldade,
    dataProva,
    pdf: req.file.filename,
    concluida: false
  });

  fs.writeFileSync("tarefas.json", JSON.stringify(tarefas, null, 2));

  res.json({
    sucesso: true,
    mensagem: "Tarefa salva com sucesso"
  });
});

// listar tarefas
app.get("/tarefas", (req, res) => {
  const tarefas = JSON.parse(fs.readFileSync("tarefas.json"));
  res.json(tarefas);
});

// atualizar status das tarefas
app.post("/atualizar-tarefas", (req, res) => {
  fs.writeFileSync(
    "tarefas.json",
    JSON.stringify(req.body, null, 2)
  );

  res.json({
    sucesso: true,
    mensagem: "Tarefas atualizadas"
  });
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});