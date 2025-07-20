// src/controllers/user.controller.js
import {
    getAllUsers as getAllUsersService,
    getUserById as getUserByIdService,
    createUser as createUserService,
    updateUser as updateUserService,
    deleteUser as deleteUserService,
    verifyOTP as verifyOTPService,
    sendOTP as sendOTPService,
    resendOTP as resendOTPService,
} from '../services/user.service';

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await getAllUsersService(req.params.id);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await getUserByIdService(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

//  Login Controller (OTP Based)
export const loginController = async (req, res) => {
    const { mobileNumber, otp } = req.body;

    try {
        const {user, token} = await verifyOTPService(mobileNumber, otp);
        res.status(200).json({ message: 'User logged in successfully', token, user });

    } catch (error) {
        res.status(401).json({ message: error.message }); //  Use 401 for authentication errors
    }
};
// Controller for sending OTP
export const sendOTPController = async (req, res) => {
    const { mobileNumber,otp } = req.body;

    try {
        const { otp, mobileNumber: userMobileNumber } = await sendOTPService(mobileNumber);
        res.status(200).json({ message: 'OTP sent successfully', mobileNumber: userMobileNumber, otp: otp }); //  IMPORTANT:  Do NOT send the OTP back in the response in a real application
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controller for resending OTP
export const resendOTPController = async (req, res) => {
    const { mobileNumber } = req.body;
    try {
        const { otp, mobileNumber: userMobileNumber } = await sendOTPService(mobileNumber);
         res.status(200).json({ message: 'OTP resent successfully', mobileNumber: userMobileNumber,otp: otp }); //  IMPORTANT:  Do NOT send the OTP back in the response in a real application
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new user
export const createUser = async (req, res) => {
    try {
        const { user, token } = await createUserService(req.body);
        res.status(201).json({ message: 'User Created Successfully', user, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user by ID
export const updateUser = async (req, res) => {
    try {
        const updatedUser = await updateUserService(req.params.id, req.body);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Delete user by ID
export const deleteUser = async (req, res) => {
    try {
        const result = await deleteUserService(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};