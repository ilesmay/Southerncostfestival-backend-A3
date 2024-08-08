require('dotenv').config()
const jwt = require('jsonwebtoken')
let crypto = require('crypto');
const { v4: uuidv4 } = require('uuid')
const path = require('path')

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
}

module.exports = new Utils()