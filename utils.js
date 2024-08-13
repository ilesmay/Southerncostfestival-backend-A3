require('dotenv').config()
const aws = require('aws-sdk');
const jwt = require('jsonwebtoken')
let crypto = require('crypto')
const path = require('path')


const s3 = new aws.S3({
    region: "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    signatureVersion: 'v4'
})

class Utils {

    hashPassword(password){
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex');
        return [salt, hash].join('$');
    }

    verifyHash(password, original){
        const originalHash = original.split('$')[1];
        const salt = original.split('$')[0];
        const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex');
        return hash === originalHash;
    }

    generateAccessToken(user){
        return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d'})
    }

    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        console.log('Received token:', token);  // Log the received token
        if (token == null) {
            console.log('Token is null');
            return res.status(401).json({ message: "Unauthorised" });
        }
    
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                console.log('Token verification error:', err);
                return res.status(401).json({ message: "Unauthorised" });
            }
            req.user = user;
            next();
        });
    }
    

    uploadFile(file, uploadPath, callback){        
        if (!file || !file.name) {
            console.error("Invalid file object:", file)
            return callback(null)
        }

        const uniqueFilename = `${Date.now()}_${file.name}`
        const filePath = path.join(uploadPath, uniqueFilename)

        file.mv(filePath, (err) => {
            if(err){
                console.error('File upload error:', err)
                return callback(null)
            }
            callback(uniqueFilename)
        })
    }

    async uploadFileToS3(file, callback) {
        const rawBytes = await crypto.randomBytes(16);
        const imageName = rawBytes.toString('hex');

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageName,
            Body: file.data,
            ContentType: 'image/jpeg', 
        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.error('File upload error:', err);
                return callback(null);
            }
            callback(data.Location); // Return the URL of the uploaded file
        });
    }
}

module.exports = new Utils()