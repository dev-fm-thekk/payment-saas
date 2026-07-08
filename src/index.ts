import express from 'express';
import path from 'path';
import OrderRouter from './routes/razorpay/order-route';
import PaymentRouter from './routes/razorpay/payment-route';
import PlanRouter from './routes/razorpay/plan-route';
import RefundRouter from './routes/razorpay/refund';

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.send('hi welcome to payment gateway'));
app.use('/razorpay/order', OrderRouter);
app.use('/razorpay/payment', PaymentRouter);
app.use('/razorpay/plan', PlanRouter);
app.use('/razorpay/refund', RefundRouter);

app.listen(3000)