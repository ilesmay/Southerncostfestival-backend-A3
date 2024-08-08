require('dotenv').config();
const aws = require('aws-sdk')
let crypto = require('crypto')
const { promisify } = require('util')
const randomBytes = promisify(crypto.randomBytes)

// AWS S3 BUCKET
const region = "ap-southest-2"
const bucketName = "southern-coast"
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: 'v4'
})

class S3 {
    // getURL
    async generateUploadURL() {
        const rawBytes = crypto.randomBytes(16)
        const imageName = rawBytes.toString('hex')
    
        const params = ({
        Bucket: bucketName,
        Key: imageName,
        Expires: 60
        })
    
        const uploadURL = await s3.getSignedUrlPromise('putObject', params)
        console.log(uploadURL)
        return uploadURL
    }
}

module.exports = new S3()