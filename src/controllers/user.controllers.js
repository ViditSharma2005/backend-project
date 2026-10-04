import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  //validation (nothing empty)
  //check if user already exists - username, email
  //check for images, check for avatar
  //upload them to cloudinary , avatar
  //create user object - create entryy in db
  //remove password and refresh token field
  //check for user creation
  //return response

  const { fullname, email, username, password } = req.body;
  // console.log("email : ", email);

  // console.log(req.body);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All feilds are required !!");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarlocalPath = req.files?.avatar?.[0]?.path;
  // const coverImagelocalPath = req.files?.coverImage?.[0]?.path;

  let coverImagelocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalPath = req.files.coverImage[0].path;
  }

  if (!avatarlocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarlocalPath);
  const coverImage = await uploadOnCloudinary(coverImagelocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something wemt wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered succesfully"));
});

export { registerUser };
