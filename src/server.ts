import app from './app';
import dotenv from 'dotenv';

dotenv.config();
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server successfully running on port ${port}`);
})
.on('error', (err) => {
  if (err.name === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error('Server startup error:', err);
  }
});
