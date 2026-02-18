import mongoose,{ isValidObjectId } from "mongoose";
import {Tweet} from '../models/tweet.model.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponce} from '../utils/ApiResponce.js'
import {asyncHandler} from '../utils/asyncHandler.js'

const createTweet = asyncHandler(async(req,res)=>{
    const userId = req.user?._id
    const {content} = req.body

    if(! isValidObjectId(userId) ){
        throw new ApiError(400,"User Id not Valid")
    }


    if(!content || content.trim()=== ""){
        throw new ApiError(400,"Content Of Tweet is required")
    }

    // create Tweet
    const tweetCreate = await Tweet.create({
        content,
        owner:userId
    })

    if(!tweetCreate){
        throw new ApiError(400,"Tweet create failed")
    }
    console.log(tweetCreate)

    return res
    .status(200)
    .json(new ApiResponce(200,tweetCreate,"Tweet Creared Successfully"))


})

const getUserTweet = asyncHandler(async(req,res)=>{
    const userId = req.user?._id;
    const {page=1,limit=10} = req.query;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Twee")
    }

    const tweetQuery = Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
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
        },
        {
            $addFields:{
                owner:{$first:"$owner"}
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ])

    const options ={
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    }

    const tweet = await Tweet.aggregatePaginate(tweetQuery,options)
    if(!tweet || tweet.docs.length===0){
        throw new ApiError(500,[],"User has no tweets")
    }

    return res
    .status(200)
    .json(new ApiResponce(200,tweet,"Tweet fetched successfully"))

})

const updateTweet = asyncHandler(async(req,res)=>{
    const userId = req.user?._id 
    const {tweetId} = req.params;
    const {content} = req.body

    if(!isValidObjectId(userId)){
        throw new ApiError(403,"user Id not Valid")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(403,"Tweet Id not Valid")
    }

    if(!content || content.trim()===""){
        throw new ApiError(400,"Content Of Tweet Required")
    }

    const tweetFind = await Tweet.findById(tweetId) 
    if(!tweetFind){
        throw new ApiError(400,"Tweet not found")
    }

    if(tweetFind.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403,"Tweet Update only Owner ")
    }

    const tweetUpdated = await Tweet.findByIdAndUpdate(tweetId,{
       $set:{
        content,
       }
    },
    {new:true}
  )

  if(!tweetUpdated){
    throw new ApiError(400,"Tweet Update Failed")
  }

  return res
  .status(200)
  .json(new ApiResponce(200,tweetUpdated,"Tweet Update Successfully"))


})

const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Tweet Id Invalid")
    }

    const tweetFind = await Tweet.findById(tweetId) 
    if(!tweetFind){
        throw new ApiError(400,"Tweet not Found")
    }
    // check owner or not
    if(tweetFind.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403,"Tweet delete only owner")
    }

    const deletedTweet  = await Tweet.findByIdAndDelete(tweetId)
    if(!deletedTweet){
        throw new ApiError(500,"Tweet Delete Failed")
    }

    return res
    .status(200)
    .json(new ApiResponce(200,[],"Tweet deleted Successfully"))

})

export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet,

}