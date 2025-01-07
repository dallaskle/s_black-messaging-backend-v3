import { createServer } from './server';
import dotenv from 'dotenv';

dotenv.config();

const app = createServer();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});