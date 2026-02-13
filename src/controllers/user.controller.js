import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinay } from "../utils/cloudinary.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefershToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesstoken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accesstoken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // console.log("postman data")
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // check for user creation
  // remove password and refresh token field from response
  // return res
  const { username, email, fullName, password } = req.body;
  console.log("Email", username);

  if (
    [username, password, email, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], //
  });

  if (existedUser) {
    throw new ApiError(409, " User with username or email are already exist");
  }
  // console.log(req.files)

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImagelocalPath= req.files?.coverImage[0]?.path;

  let coverImagelocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required ");
  }

  const avatar = await uploadOnCloudinay(avatarLocalPath);
  const coverImage = await uploadOnCloudinay(coverImagelocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar Image is Required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While Registering User");
  }

  return res
    .status(201)
    .json(new ApiResponce(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find user
  // chech password
  // access and referesh token
  // send cookie

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username and email are required");
  }

  // if(!username || !email){
  //     throw new ApiError(400,"username and email are required")
  // }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const passwordValid = await user.isPasswordCorrect(password);

  if (!passwordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accesstoken, refreshToken } = await generateAccessAndRefershToken(
    user._id,
  );

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accesstoken", accesstoken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponce(
        200,
        {
          user: loggedinUser,
          accesstoken,
          refreshToken,
        },
        "User successfully Logged in",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refershToken: 1, // this remove the field from  document
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponce(200, {}, "User Iogged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refershToken) {
      throw new ApiError(401, "refreshToken Expired Or Used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefershToken } =
      await generateAccessAndRefershToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refershToken", newRefershToken, options)
      .json(
        new ApiResponce(
          { accessToken, refershToken: newRefershToken },
          "Access Token Refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refrsh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid OldPassword");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponce(200, {}, "Password Successfully Updated"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponce(200, req.user, "USer Fetched Successfully"));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All Fieds are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    {
      new: true,
    },
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponce(200, user, "All Detail of USer Are Successfully Updated"),
    );
});


const updateUseravatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Is Missing");
  }

  const avatar = await uploadOnCloudinay(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error While Uploading Avatar ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponce(200, user, "Avatar or User Is Successfully Updated"));
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is Missing");
  }

  const coverImage = await uploadOnCloudinay(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error While Uploasding Cover Image ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponce(200, user, "Cover Image Is Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username}= req.params

    if(!username?.trim()){
      throw new ApiError(400,"User in missing")
    }

    const channel = await User.aggregate([
      {
        $match:{
          username:username?.toLowerCase()
        }
      },
      {
        $lookup:{
          from:"subcriptions",
          localField:"_id",
          foreignField:"channel",
          as:"subscribers"
        }
      },
      {
        $lookup:{
          from:"subcriptions",
          localField:"_id",
          foreignField:"subscriber",
          as:"subscribedTo"
        }
      },
      {
        $addFields:{
         subscribersCount:{
           $size :"$subscribers"
          },
          channelSubscribedToCount:  {
            $size:"$subscribedTo"
          },
          isSubscribed:{
            $cond:{
            if: { $in:[req.user?._id,"$subscribers.subscriber"] },
            then:true,
            else:false
            }
          }

        }
      },
      {
        $project:{
          fullName:1,
          username:1,
          isSubscribed:1,
          subscribersCount:1,
          channelSubscribedToCount:1,
          avatar:1,
          coverImage:1,
          email:1,

        }
      }
    ])
    // console.log(channel)
    
      if(!channel.length){
        throw new ApiError(404,"Channel Does Not Exist")
      }

      return res
      .status(200)
      .json(new ApiResponce(200,channel[0],"User Channel Fetched Successfully"))

});


const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
      {
        $match:{
          _id:new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $lookup:{
          from:"videos",
          localField:"watchhistory",
          foreignField:"_id",
          as:"watchhistory",
          pipeline:[
         { 
           $lookup: {
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                  fullName:1,
                  username:1,
                  avatar:1
                }
               }
              ]

            }
          }
          ]
        }
      },
      {
        $addFields:{
         owner:{
            $first :"$owner"
          }
        }
      }

    ])

    return res
    .status(200)
    .json(new ApiResponce(200,user[0].watchhistory || [],"Watch History fetch successfully"))
})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUseravatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
