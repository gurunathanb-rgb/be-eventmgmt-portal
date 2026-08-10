//setup MongoDB database connectin
//import mongoose

const mongoose = require("mongoose")
const { MONGODB_URI, PORT, HOST } = require('./utils/config')
const app = require("./app")


mongoose
    .connect(MONGODB_URI)
    .then(()=>{
        console.log('Connected to the Database')
        //Start the server
        app
            .listen(PORT, HOST, () =>{
                console.log(`The server is running on http://${HOST}:${PORT}`)
                })
            .on('error', (error) => {
                console.error('Error starting  the server', error.message)
            
            })
    })
    .catch((error)=>{
        console.error('Error connecting to the Database', error.message)
    })