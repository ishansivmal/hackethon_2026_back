const authorizeRoles = (...allowedRoles) => {

    return (req, res, next) => {

        // User must already be authenticated
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // Check whether user's role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};

module.exports = authorizeRoles;