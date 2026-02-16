import mongoose,{isValidObjectId} from "mongoose";
import { Like} from '../models/like.model.js'
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleVideoLike = asyncHandler(async(req,res)=>{
    const { videoId } =  req.params;
    // validate video Exist or not
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video Id not valid ")
    }

   const alreadyLike = await Like.findOne({
    video:videoId,
    likedBy:req.user?._id
   })
//    console.log(alreadyLike)

   if(alreadyLike){
    await Like.findByIdAndDelete(alreadyLike._id)

    return res
    .status(200)
    .json(new ApiResponce(200,{ isLiked:false },"Video Unliked Successfully"))
   }

   const newLike = await Like.create({
    video:videoId,
    likedBy:req.user?._id
   })

   if(!newLike){
   throw new ApiError(500,"Like Failed ") 
   }

   return res
   .status(200)
   .json(new ApiResponce(200,{ isLiked:true },"Video Liked Successfully"))

})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Comment Id Invalid")
    }

    const alreadyLikeComment = await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })

    if(alreadyLikeComment){
        await Like.findByIdAndDelete(alreadyLikeComment._id)

        return res
        .status(200)
        .json(new ApiResponce(200,{isLiked:false},"Comment Unlike Success"))
    }

    const newLikeComment = await Like.create({
        comment:commentId,
        likedBy:req.user?._id
    })

    if(!newLikeComment){
        throw new ApiError(500,"Comment Unliked failed")
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{isLiked:true},"Comment Like Successfully"))

})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Tweet id not valid")
    }

    const alreadyLikeTweet = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })

    if(alreadyLikeTweet){
        await Like.findByIdAndDelete(alreadyLikeTweet._id)

        return res
        .status(200)
        .json(new ApiResponce(200,{isLiked:false},"Tweet unLike success"))
    }

    const newLikeTweet = await Like.create({
        tweet:tweetId,
        likedBy:req.user?._id
    })

    if(!newLikeTweet){
        throw new ApiError(500,"Tweet Liked failed")
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{isLiked:true},"Tweet Liked Success"))

})

const getLikedVideos = asyncHandler(async(req, res) => {
    const userId = req.user?._id; 
    const { page = 1, limit = 10 } = req.query;
    
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User Id not Valid");
    }

    const aggregateQuery = Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const likedVideos = await Like.aggregatePaginate(aggregateQuery, options);
    
    if (!likedVideos || likedVideos.docs.length === 0) {
        return res
            .status(200)
            .json(new ApiResponce(200, [], "Liked Video Not Found"));
    }

    return res
        .status(200)
        .json(new ApiResponce(200, likedVideos, "All Liked Videos Fetched Successfully"));
});




export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
}

