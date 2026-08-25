/**
 * Role-based Authorization Middleware
 * Restricts route access to specific roles (e.g. 'ADMIN', 'OFFICER', 'SUPERVISOR')
 * @param  {...string} allowedRoles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before accessing this resource.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
};

module.exports = { authorize };
