import mongoose,{isValidObjectId} from 'mongoose'
import {Comment} from '../models/comment.model.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponce} from '../utils/ApiResponce.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import { Video } from '../models/video.model.js'


const getVideoComments = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    // get all comments for a video
    const {page=1,limit=10} = req.query;
    // validation check for valid videoId
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId")
    }

    const aggregateQuery = Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
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
                            avatar:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{$first:"$owner"}
            }
        }
    ])

    if(!aggregateQuery){
        throw new ApiError(400," Error aggregateQuery ")
    }

    const options={
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    }

    const comments = await Comment.aggregatePaginate(aggregateQuery,options)
    if(!comments || comments.docs.length===0){
        return res
        .status(200)
        .json(new ApiResponce(200,[],"no comment found for this video"))
    }


    return res
    .status(200)
    .json(new ApiResponce(200,comments,"Comment fetched Successfully"))
})

const addComment = asyncHandler(async(req,res)=>{
    // add comment to a video
    const {videoId} = req.params
    const{content} = req.body

    if(!content){
        throw new ApiError(400,"content of comment is required")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video Id")
    }

    // find video for Existing or not
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const comments = await Comment.create({
        content,
        video:videoId,
        owner:req.user?._id
    })

    if(!comments){
        throw new ApiError(500,"something went wrong while adding comment")
    }

    return res
    .status(201)
    .json(new ApiResponce(201,comments,"Add Comment successfully"))
})

const updateComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const {content} = req.body
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid video Id")
    }

    if(!content){
        throw new ApiError(400,"content of comment is Required")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400,"Video not Found")
    }

    // Only Owner Update The Comment
    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403,"Olny Owner Update the Comment")
    }

    const commentUpdated = await Comment.findByIdAndUpdate(commentId,{
    $set:{
        content
        },
    },
    {new:true}
 )
    if(!commentUpdated){
        throw new ApiError(500,"Comment update failed")
    }

    return res
    .status(200)
    .json(new ApiResponce(200,commentUpdated,"Comment Update Successfully"))

})

export {
    getVideoComments,
    addComment,
    updateComment,
}