import express from 'express';
import path from 'path';

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.send('hi welcome to payment gateway'));

app.listen(3000)