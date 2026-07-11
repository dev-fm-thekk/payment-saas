import express from 'express';
import path from 'path';
import authRouter from './routes/Auth/route';
import userRouter from './routes/User/route';

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.get('/', (req, res) => res.send('hi welcome to payment gateway'));

app.listen(3000)