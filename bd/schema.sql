CREATE TABLE usuario (
    id INT PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE
);

CREATE TABLE planejamento_de_estudo (
    id INT PRIMARY KEY,
    prazo DATE,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE materia (
    id INT PRIMARY KEY,
    nome VARCHAR(100),
    planejamento_id INT,
    FOREIGN KEY (planejamento_id) REFERENCES planejamento_de_estudo(id)
);

CREATE TABLE tarefa (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100),
    prazo DATE,
    usuario_id INT,
    planejamento_id INT,
    materia VARCHAR(100),
    topico VARCHAR(100),
    dificuldade VARCHAR(50),
    pdf VARCHAR(255),
    concluida BOOLEAN DEFAULT false
);

CREATE TABLE simulado (
    id INT PRIMARY KEY,
    data DATE,
    usuario_id INT,
    planejamento_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (planejamento_id) REFERENCES planejamento_de_estudo(id)
);

CREATE TABLE questionario (
    id INT PRIMARY KEY,
    descricao TEXT,
    usuario_id INT,
    simulado_id INT,
    planejamento_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (simulado_id) REFERENCES simulado(id),
    FOREIGN KEY (planejamento_id) REFERENCES planejamento_de_estudo(id)
);

CREATE TABLE resultado (
    id INT PRIMARY KEY,
    nota DECIMAL(5,2),
    usuario_id INT,
    simulado_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (simulado_id) REFERENCES simulado(id)
);