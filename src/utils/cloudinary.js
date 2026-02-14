import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})

// delete from cloudinary
const deletefromCloudinay = async(publicId,resourceType="video")=>{
    try {
        if(!publicId) return null

        // Cloudinary ka destroyer method use karein
        const response = await cloudinary.uploader.destroy(publicId,{
            resource_type:resourceType
        })

        return response
        
    } catch (error) {
        console.log("Error while Deleting Video from cloudinary")
        return null
    }
}

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

export  {uploadOnCloudinay,deletefromCloudinay}