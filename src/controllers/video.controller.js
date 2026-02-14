import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deletefromCloudinay, uploadOnCloudinay } from "../utils/cloudinary.js";


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

    // first basic validation 
    if([title,description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"Title And Description are Required")
    }

    // Check if files are uploaded (Multey req.files me deta hai)
    const videofilelocalpath= req.files?.videoFile[0]?.path
    const thumbnailfilelocalpath = req.files?.thumbnail[0]?.path

    if(!videofilelocalpath){
        throw new ApiError(400,"video file is required")
    }

    if(!thumbnailfilelocalpath){
        throw new ApiError(400,"thubnail file is Required")
    }

    // upload on cloudinay

    const videoupload = await uploadOnCloudinay(videofilelocalpath)
    const thumbnailupload = await uploadOnCloudinay(thumbnailfilelocalpath)
    
    // console.log("videoupload :",videoupload)
    // console.log("thumbnailupload ",thumbnailupload)

    // check Upload or not
    if(!videoupload){
        throw new ApiError(500,"Video uploading Failed")
    }

    if(!thumbnailupload){
        throw new ApiError(500,"thumbnail uploading Failed")
    }

    // create entry in database 

    const video  = await Video.create({
        videoFile:videoupload.url,
        thumbnail:thumbnailupload.url,
        title,
        description,
        duration:videoupload?.duration,
        owner:req.user?._id,
        isPublished:true
    })
    console.log(video)

    if(!video){
        throw new ApiError(500,"Something went Wrong While Publishing the Video")
    }

    return res
    .status(200)
    .json(new ApiResponce(200,"Video Published Successffully"))
});

const  getVideoById = asyncHandler(async(req,res)=>{
  //  give videoId 
  const {videoId} = req.params;
  //  check videoId validation
  if(!isValidObjectId(videoId)){
    throw new ApiError(400,"Invalid video Id ")
  }
    // find video in database
    const video = await Video.findById(videoId)
    if(!video){
      throw new ApiError(404,"Video not found")
    }

  return res
    .status(200)
    .json(new ApiResponce(200,"Video Id Fetched Successfully"))

})

const updatevideo = asyncHandler(async(req,res)=>{
  const {videoId} = req.params;
  const {title,description} = req.body;
  // validation check 
  if(!isValidObjectId(videoId)){
    throw new ApiError(400,"Video Id is not valid")
  }

  // check validation title and description
  if(!title || !description){
    throw new ApiError(404,"Title or Description is missing")
  }


  const thumbnaillocalpath = req.file?.path
  if(!thumbnaillocalpath){
    throw new ApiError(404,"Thumbnail is Missing")
  }
  // console.log("thumbnaillocalpath : ",thumbnaillocalpath)

     
  // fetch video
   const video = await Video.findById(videoId)
    if(!video){
      throw new ApiError(404,"Video not found")
    }
    
    // check validation Only owner Update 
    if(video.owner.toString() !== req.user?._id.toString()){
      throw new ApiError(404,"Only Owner Edit The Thumbnail and some ")
    }

      // uploadCloudinary
    const thumbnailUpload = await uploadOnCloudinay(thumbnaillocalpath)
    if(!thumbnailUpload.url){
      throw new ApiError(500,"Thumbnal Updating failed")
    }

   const videoupdate = await Video.findByIdAndUpdate(videoId,{
    $set:{
        title,
        description,
        thumbnail:thumbnailUpload.url
         },
     }, 
   {new:true}
)
console.log(videoupdate)

return res
.status(200)
.json(new ApiResponce(200,videoupdate,"Video Updated Successfully"))

})

const videodelete = asyncHandler(async(req,res)=>{
  const {videoId} = req.params;
  // check validation 
  if(!isValidObjectId(videoId)){
    throw new ApiError(400,"video Id is not Found")
  }

  // find VideoId
    const video = await Video.findById(videoId) 
    if(!video){
      throw new ApiError(400,"Video not found")
    }
  // check validation for owner
  // if(video.owner.toString() !== req.user?._id.toString()){
  //   throw new ApiError(404,"Only Owner delete the Video")
  // }

  //Public_id nikalna
  const videopublicId = video.videoFile.split("/").pop().split(".")[0];
  const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];

  if(!videopublicId || !thumbnailPublicId){
    throw new ApiError(500,"videoFile or thumbnail is not find in cloudinary")
  }

   const videoFiledeleted  =await deletefromCloudinay(videopublicId,"video")
   const thumbnailImageddleted= await deletefromCloudinay(thumbnailPublicId,"image")
 if(!videoFiledeleted || !thumbnailImageddleted){
  throw new ApiError(500,"videoFile or ThumbnailImage is not delete from cloudiary")
 }

  // delete video from database
  const deletedVideo = await Video.findByIdAndDelete(videoId)
  if(!deletedVideo){
    throw new ApiError(500,"Delete failed")
  }
  return res
  .status(200)
  .json(new ApiResponce(200,{}," Video Delete successfully"))

})

const togglePublishStatus = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
      throw new ApiError(400,"Video Id is not valid")
    }

    // check validation
    const video= await Video.findById(videoId)
    if(!video){
      throw new ApiError(400,"Video not found")
    }

    if(video.owner.toString() !== req.user?._id.toString()){
      throw new ApiError(403,"Only owner Toggled")
    }

    // toggle 
    video.isPublished = !video.isPublished

  const toggleSave= await video.save({validateBeforeSave:false})
  if(!toggleSave){
    throw new ApiError(500,"Toggle Not save")
  }
  console.log(toggleSave)
  return res
  .status(200)
  .json(new ApiResponce(200,"Toggle is Successfull"))


})

export { 
    getAllVideo, 
    publishVideo,
    getVideoById,
    updatevideo,
    videodelete,
    togglePublishStatus,

 };
