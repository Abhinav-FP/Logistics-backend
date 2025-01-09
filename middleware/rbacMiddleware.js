const Permissions = require('../model/permissions');

exports.checkPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const userPermissions = new Permissions().getPermissionsByRoleName(req.user.role);

      if (userPermissions.includes(permission)) {
        return next();
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};