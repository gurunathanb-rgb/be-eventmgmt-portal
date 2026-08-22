require('dotenv').config()

//console.log("MONGODB_URI:", process.env.MONGODB_URI)

const MONGODB_URI = process.env.MONGODB_URI
const ENV = process.env.ENV
const HOST = process.env.HOST
const PORT = process.env.PORT
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS
const EMAIL_HOST = process.env.EMAIL_HOST
const EMAIL_PORT = process.env.EMAIL_PORT
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const JWT_SECRET = process.env.JWT_SECRET

module.exports= {
    MONGODB_URI,
    ENV,
    HOST,
    PORT,
    EMAIL_HOST,
    EMAIL_PASS,
    EMAIL_PORT,
    EMAIL_USER,
    JWT_SECRET,
    STRIPE_SECRET_KEY

}
