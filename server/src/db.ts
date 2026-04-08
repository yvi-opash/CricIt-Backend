import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export const mongoDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URL || '')
         dbName: "cricitDB"
        console.log(`MongoDB Connected!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`)
    } catch (error) {
        console.log('Error connecting to MongoDB:', error)
    }

}