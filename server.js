//setup MongoDB database connectin
//import mongoose

const mongoose = require("mongoose")
const { MONGODB_URI } = require('./utils/config')


mongoose
    .connect(MONGODB_URI)
    .then(()=>{
        console.log('Connected to the Database')
    })
    .catch((error)=>{
        console.error('Error connecting to the Database', error.message)
    })