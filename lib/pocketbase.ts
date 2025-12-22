import PocketBase from 'pocketbase';

// Use environment variable for URL, default to local
// On client side, use the Next.js proxy
const pbUrl = typeof window !== 'undefined' 
  ? '/api/pocketbase' 
  : (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

const pb = new PocketBase(pbUrl);

export default pb;
