require('dotenv').config()

//console.log("MONGODB_URI:", process.env.MONGODB_URI)

const MONGODB_URI = process.env.MONGODB_URI

module.exports= {
    MONGODB_URI,
}
