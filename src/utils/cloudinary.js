import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinay = async(locaFilePath)=>{
    try {
        if(!locaFilePath) return null
       const respone = await cloudinary.uploader.upload(locaFilePath,{
            resource_type:"auto"
        })

        fs.unlinkSync(locaFilePath)
        return respone
        
    } catch (error) {
        fs.unlinkSync(locaFilePath)
         return null
    }
}

export  {uploadOnCloudinay}