import dotenv from 'dotenv';

dotenv.config();

const vars =  {
    DATABASE_URL: process.env.DATABASE_URL,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD
}

export default vars;