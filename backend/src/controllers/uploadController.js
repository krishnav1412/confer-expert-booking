import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import storageService from '../services/storageService.js';
import User from '../models/User.js';
import Expert from '../models/Expert.js';

/**
 * POST /api/uploads/avatar  (multipart/form-data field: 'file')
 * Replaces the current user's avatar.
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const { buffer, mimetype, originalname } = req.file;

  let result;
  try {
    result = await storageService.upload(buffer, {
      folder: `avatars/user-${req.user._id}`,
      filename: originalname,
      mimetype,
    });
  } catch (err) {
    throw new ApiError(400, err.message || 'Upload failed');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'Account not found');

  user.avatar = result.url;
  await user.save();

  // If this user is also an expert, mirror the image to the public profile
  if (user.expertProfile) {
    await Expert.findByIdAndUpdate(user.expertProfile, {
      profileImage: result.url,
    });
  }

  res.json({
    success: true,
    data: {
      url: result.url,
      provider: result.provider,
      user: user.toPublicJSON(),
    },
  });
});
