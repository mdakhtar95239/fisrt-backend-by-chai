import mongoose,{isValidObjectId} from 'mongoose'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponce} from '../utils/ApiResponce.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import { Subcription } from '../models/subscription.model.js'
import {User} from '../models/user.model.js' 

const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} = req.params;
    const userId = req.user?._id

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Channel Id not valid")
    }

    const alreadySubscription = await Subcription.findOne({
        channel:channelId,
        subscriber:userId
    })

    if(alreadySubscription){
        await  Subcription.findByIdAndDelete(alreadySubscription._id)

       return res
       .status(200)
       .json(new ApiResponce(200,{subscribed:false},"channel unsubscribed success"))
    }

    const  Subscribed = await Subcription.create({
         channel:channelId,
        subscriber:userId
    })

    if(!Subscribed){
        throw new ApiError(500,"Subcribed failed")
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{subscribed:true},"Subscribed success"))

})

const getUserChannelSubscriber = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    const {page=1,limit=10} = req.query
    
      if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Channel Id not valid")
    }

    const subscriberQuery = Subcription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriberDetail",
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
                subscriberDetail:{$first:"$subscriberDetail"}
            }
        },{
            $project:{
                subscriberDetail:1,
                createdAt:1
            }
        }
    ])

    const options={
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    }

    const subscriber = await Subcription.aggregatePaginate(subscriberQuery,options)

    if(!subscriber){
        throw new ApiError(500,"subscriber failed ")
    }

    return res
    .status(200)
    .json(new ApiResponce(200,subscriber,"Subscriber Fetched Successfully"))

})

const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const {subscriberId} = req.params
        console.log("RECV_ID:", subscriberId);
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"subscriber Id not valid")
    }
    
    const subscribedChannel = await Subcription.aggregate([
          {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannel",
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
        },{
            $addFields:{
                subscribedChannel:{$first:"$subscribedChannel"}
            }
        },
        {
            $project:{
                subscribedChannel:1,
                createdAt:1
            }
        }
    ])
    
    if(!subscribedChannel){
        throw new ApiError(500,"subscribedChannel failed")
    }
  
    return res
    .status(200)
    .json(new ApiResponce(200,subscribedChannel,"Subscribed Channel fetched"))


})

export {
    toggleSubscription,
    getUserChannelSubscriber,
    getSubscribedChannels

}