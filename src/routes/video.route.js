import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getVideoById, 
    publishVideo, 
    togglePublishStatus, 
    updatevideo, 
    videodelete ,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/").post(
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    publishVideo
)

router
.route("/:videoId")
.get(getVideoById)
.delete(videodelete)
.patch(upload.single("thumbnail"),updatevideo)
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default  router
