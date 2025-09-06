// Esta função wrapper captura erros de funções async e os passa para o próximo middleware de erro.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
