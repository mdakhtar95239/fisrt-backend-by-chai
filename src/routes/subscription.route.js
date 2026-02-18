import { Router } from "express"; 
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {
        getSubscribedChannels, 
        getUserChannelSubscriber,
        toggleSubscription
        } from "../controllers/subscription.controller.js";

const router = Router()

router.use(verifyJWT)  

router.route("/c/:channelId").post(toggleSubscription)
router.route("/c/:subscriberId").get(getSubscribedChannels)
router.route("/u/:channelId").get(getUserChannelSubscriber)

export default router

