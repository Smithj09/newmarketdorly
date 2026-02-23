import dotenv from 'dotenv';

try {
  console.log('Testing dotenv configuration...');
  
  // Test loading from .env.local
  const result = dotenv.config({ path: '.env.local' });
  console.log('Dotenv result:', result);
  console.log('Environment variables:', {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    JWT_SECRET: process.env.JWT_SECRET
  });
  
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Error testing dotenv:', error);
}