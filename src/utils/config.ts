import dotenv from 'dotenv';

const envPath = "/home/abhiram-a-r/Documents/projects/payment-sdk/.env";
dotenv.config({ path: envPath, debug: true});

const vars =  {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
}

export default vars;