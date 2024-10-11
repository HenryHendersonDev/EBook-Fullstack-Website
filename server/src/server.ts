import app from '@/app';
import initializeApp from '@/config/prestartConfig';

const startServer = async () => {
  try {
    await initializeApp();
    const PORT = Number(process.env['PORT']) || 8080;
    app.listen(PORT, () => {
      console.log('');
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
};

startServer();
