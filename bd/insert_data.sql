-- USUARIO
INSERT INTO usuario (id,email,senha) VALUES
(1, '1', 'joao@email.com');

-- PLANEJAMENTO DE ESTUDO
INSERT INTO planejamento_de_estudo (id, prazo, usuario_id) VALUES
(1, '2026-05-30', 1);

-- MATERIA
INSERT INTO materia (id, nome, planejamento_id) VALUES
(1, 'Matemática', 1);

-- TAREFA
INSERT INTO tarefa (id, titulo, prazo, usuario_id, planejamento_id) VALUES
(1, 'Estudar equações', '2026-05-10', 1, 1);

-- SIMULADO
INSERT INTO simulado (id, data, usuario_id, planejamento_id) VALUES
(1, '2026-05-15', 1, 1);

-- QUESTIONARIO
INSERT INTO questionario (id, descricao, usuario_id, simulado_id, planejamento_id) VALUES
(1, 'Questões básicas', 1, 1, 1);

-- RESULTADO
INSERT INTO resultado (id, nota, feedback, usuario_id, simulado_id) VALUES
(1, 8.5, 'Bom desempenho', 1, 1);