# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```env
GOOGLE_AI_API_KEY=your_gemini_api_key_here
HUGGING_FACE_TOKEN=your_huggingface_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting API Keys

### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to `.env.local` as `GOOGLE_AI_API_KEY`

### Hugging Face Token
1. Visit [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Sign in or create an account
3. Click "New token"
4. Select "Read" access
5. Copy the token and add it to `.env.local` as `HUGGING_FACE_TOKEN`

**Note**: The application will work with mock data if API keys are not provided, but real AI features require valid keys.

