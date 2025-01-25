const validateJwt = require("../validations/jwtValidation");

const authMiddleware = async (req, res, next) => {
  const allowedRoutes = [
    "/users/login",
    "/users/register",
    "/transactions/totals",
    "/transactions/report/monthly",
    "/transactions/totals/balance",
  ];

  const isAllowedRoute = allowedRoutes.includes(req.url);
  if (isAllowedRoute) {
    return next();
  }

  const jwt = validateJwt(req);
  if (!jwt) {
    return res.status(401).send({
      error: "Acesso negado",
    });
  }

  res.locals.token = jwt;

  const adminRoutes = ["/admin/dashboard", "/admin/settings"];
  if (adminRoutes.includes(req.url)) {
    if (!jwt.isAdmin) {
      return res.status(403).send({
        error: "Acesso restrito a administradores",
      });
    }
  }

  next();
};

module.exports = authMiddleware;
