import dotenv from 'dotenv';

const envPath = "/home/abhiram-a-r/Documents/projects/payment-sdk/.env";
dotenv.config({ path: envPath, debug: true});

const vars =  {
    DATABASE_URL: process.env.DATABASE_URL,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET
}

export default vars;