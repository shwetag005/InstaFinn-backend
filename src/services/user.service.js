// src/sercreateUserices/user.service.js
import User from '../models/user.model';
import { Bank } from '../models/bank.model'; // Import Bank model
import { Branch } from '../models/branch.model'; // Import Branch model
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/config'; //  configure your JWT secret and other settings
import { generateOTP } from '../middlewares/validation.middleware';

// Utility function for generating JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    // Use config.jwtSecret
    expiresIn: '1h' // Set an appropriate expiration time
  });
};

// Get all users
export const getAllUsers = async (id) => {
  try {
    // Fetch the current user to determine role
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    let query = {
       _id: { $ne: user._id } //Exclude the logged in user
    };

    switch (user.role) {
      case 'masterAdmin':
      //case 'admin':
        // Fetch all users
        //query = {};
        break;

      case 'admin':
        //Fetch all users except masterAdmin
        query ={
          createdBy: user._id,
          _id: { $ne: user._id}
        };
        break;

      case 'agent':
      case 'subAgent':
        // Fetch users created by this agent or sub-agent
        query = {
           createdBy: user._id ,
           _id: { $ne: user._id }
          };
        break;

      case 'bankOperator':
        // Fetch users associated with this bank and branch
        query = {
          bankId: user.bankId,
          branches: { $in: user.branches },
          _id: { $ne: user._id }
        };
        break;

      case 'user':
      default:
        // Return empty array for regular users
        return [];
    }

    const users = await User.find(query).sort({ createdAt: -1 }); 

    return users;
  } catch (error) {
    throw new Error('Error fetching users: ' + error.message);
  }
};

// Get user by ID
export const getUserById = async (id) => {
  try {
    const user = await User.findById(id)
      .populate('bankId', 'name')
      .populate('branches', 'name location');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw new Error('Error fetching user: ' + error.message);
  }
};

export const findUserByMobileNumber = async (mobileNumber) => {
  console.log(mobileNumber);
  try {
    if (!mobileNumber) {
      throw new Error('Invalid mobileNumber');
    }
    const user = await User.findOne({ mobileNumber }); // ✅ Use findOne instead of find
    console.log(user);
    if(!user){
      throw new Error('Invalid mobileNumber');
    }
    const otp = generateOTP();
    const now = new Date();
    const otpExpiry = new Date(now.getTime() + 5 * 60 * 1000); // OTP expires in 5 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    return { user, otp };
  } catch (error) {
    console.error('Error finding user by mobileNumber:', error);
    throw error;
  }
};

export const sendOTP = async (mobileNumber) => {
  const { otp, user } = await findUserByMobileNumber(mobileNumber);
  if (!user) {
    throw new Error('Invalid mobileNumber');
  }

  //  TODO: Send OTP via mobileNumber/SMS.  Replace this with your actual sending mechanism.
  console.log(`Sending OTP ${otp} to ${mobileNumber}`); // REMOVE THIS LINE IN PRODUCTION
  //  You would use a service like Twilio, SendGrid, etc.

  return { otp, mobileNumber }; // Return OTP and mobileNumber for use in controller
};

export const verifyOTP = async (mobileNumber, otp) => {
  try {
    if (!mobileNumber) {
      throw new Error('Invalid Mobile Number');
    }
    const user = await User.findOne({ mobileNumber }); // ✅ Use findOne instead of find
    if (!user) {
      throw new Error('Invalid Mobile Number');
    }

    if (!user.otp) {
      throw new Error('OTP not sent.  Please request OTP.');
    }

    if (user.otpExpiry < new Date()) {
      throw new Error('OTP expired');
    }

    if (otp !== user.otp) {
      throw new Error('Invalid OTP');
    }
    const token = generateToken(user._id);

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return { user, token };
  } catch (error) {
    throw new Error('Error creating user: ' + error.message);
  }
};

// Create a new user
export const createUser = async (userData) => {
  try {
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    const token = generateToken(savedUser._id);
    return { user: savedUser, token };
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Email or mobile number already exists');
    }
    throw new Error('Error creating user: ' + error.message);
  }
};

// Update user by ID
export const updateUser = async (id, updateData) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('bankId', 'name')
      .populate('branches', 'name location');
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  } catch (error) {
    throw new Error('Error updating user: ' + error.message);
  }
};

// Delete user by ID
export const deleteUser = async (id) => {
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new Error('User not found');
    }
    return { message: 'User deleted successfully' };
  } catch (error) {
    throw new Error('Error deleting user: ' + error.message);
  }
};
