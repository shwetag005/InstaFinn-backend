import HttpStatus from 'http-status-codes';
import jwt from 'jsonwebtoken';
import config from '../config/config'; //  for JWT secret
import User from '../models/user.model'; // Import the User model

// Interface for user role
export const UserRole = {
    MasterAdmin: 'masterAdmin',
    Admin: 'admin',
    Agent: 'agent',
    SubAgent: 'subAgent',
    BankOperator: 'bankOperator',
    User: 'user'
};

// Authentication middleware
export const authMiddleware = async (req, res, next) => {
    // Get the token from the header
    //const token = req.header('Authorization')?.replace('Bearer ', '');
    const token = req.headers['authorization']?.split(' ')[1];

    // Check if token exists
    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, config.jwtSecret); // Use config.jwtSecret
        // Fetch the user.  Important for authorization checks and to have user data.
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token: User not found' });
        }

        // Store the user object in the request
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};


// Authorization middleware
export const hasRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Check if the user's role is included in the allowed roles
        if (!roles.includes(req.user.role)) {
            // return res.status(403).json({ message: 'Unauthorized: req, res' });
            return res.status(403).json({ message: `Access denied: User role '${req.user.role}' is not authorized` });

        }
        next();
    };
};


// export const hasPermission = (permissions) => {
//   return (req, res, next) => {
//     const userPermissions = req.user.permissions || [];
//     const hasRequiredPermission = permissions.every(permission => userPermissions.includes(permission));
//     if (!hasRequiredPermission) {
//       return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
//     }
//     next();
//   };
// };
