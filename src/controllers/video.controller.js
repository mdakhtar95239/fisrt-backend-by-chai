import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinay } from "../utils/cloudinary.js";


const getAllVideo = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // get all video based on query ,sort, pegination

  const pipeline = [];

  // Agar userId di gayi hai, toh sirf us specific user ke videos filter kare
  if (userId) {
    if (!isValidObjectId) {
      throw new ApiError(400, "User Is Not Valid");
    }
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  //Search query handle karein (Title ya Description mein match karein)
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" }},
        ],
      },
    });
  }

  // sorting ke liye
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else{
    pipeline.push({ $sort: { $createdAt: -1 } });
  }

  // Mongoose Aggregate Paginate ka use karke pagination apply kare
  const videoAggregate = Video.aggregate(pipeline);
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videos = await Video.aggregatePaginate(videoAggregate, options);

  if (!videos || videos.docs.length === 0) {
    return res.status(200).json(new ApiResponce(200, [], "video Not Fount"));
  }

  return res
    .status(200)
    .json(new ApiResponce(200, videos, "Video fetched Successfully"));
});


const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // get video, upload to Cloudinatry, create Video
});



export { 
    getAllVideo, 
    publishVideo,

 };
