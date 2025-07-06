// const mongoose = require("mongoose");
// require('dotenv').config();
// const mongoURI = process.env.MONGO_URI;

// console.log('process.env.MONGO_URI==>',process.env.MONGO_URI);
//  const ConnectedDB = async()=>{

// try{
// await mongoose.connect(mongoURI)
// console.log("db connected successfully");

// }catch(err){
// console.log(err);
//  process.exit(1); //agr koi error ajy to ye line yahi server ko rok degi
// }


// }
//  module.exports = ConnectedDB

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database Connection Failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;
