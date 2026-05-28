module.exports = function handler(req, res) {
  res.status(200).json({
    status: "ok",
    mensagem: "Servidor online no Vercel"
  });
};