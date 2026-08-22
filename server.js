//setup MongoDB database connectin
//import mongoose

const mongoose = require("mongoose")
const { MONGODB_URI, PORT, HOST } = require('./utils/config')
const app = require("./app")


mongoose
    .connect(MONGODB_URI)
    .then(()=>{
        console.log('📦 Core Database Layer Connected to MongoDB Storage Hub Successfully.')
        //Start the server
        app
            .listen(PORT, HOST, () =>{
                console.log(`T🚀 System Processing Node Active on Environment URL Port Address: http://${HOST}:${PORT}`)
                })
            .on('error', (error) => {
                console.error('Error starting  the server', error.message)
            
            })
    })
    .catch((error)=>{
        console.error('❌ Critical Error: Database engine connection failed initialization:', error.message)
        process.exit(1);
    })