import { createServer } from './server';
import dotenv from 'dotenv';

dotenv.config();

const app = createServer();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});