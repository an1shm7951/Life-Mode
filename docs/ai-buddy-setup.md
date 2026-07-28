# AI Buddy Setup

AI Buddy has four layers:

1. OpenAI, if `OPENAI_API_KEY` is available.
2. Ollama, if `OLLAMA_MODEL` is available on the developer machine.
3. Gemini, if `GEMINI_API_KEY` is available.
4. A simple local fallback reply if no real AI provider is configured.

The current roadmap is:

1. Use Gemini free tier while building with non-sensitive test data.
2. Add Ollama for local/private development.
3. Keep both available so the app can choose the best option for the situation.
4. Move to paid/private AI providers before real users put sensitive data into AI Buddy.
5. Upgrade security as the company earns money: stronger provider contracts, shorter retention, encryption, export/delete controls, and eventually enterprise-grade privacy options.

## OpenAI

Add these lines to `.env.local` when you are ready for the paid OpenAI API:

```env
OPENAI_API_KEY=your_secret_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Keep `OPENAI_API_KEY` server-only. Never rename it to `NEXT_PUBLIC_OPENAI_API_KEY`, because public environment variables are exposed to the browser.

## Ollama

Install Ollama locally and pull a model, then add:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

Ollama is good for development because the model runs on your laptop. It is not a hosted solution for public users unless the production server also runs an Ollama model.

## Gemini Free Tier

For development with your own non-sensitive test data, add:

```env
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.0-flash-lite
```

Do not use the unpaid Gemini API for real users' sensitive or personal data. The unpaid tier can be useful while building, but the real app should move to a paid/private setup before public users put private information into AI Buddy.

After changing `.env.local`, stop and restart the dev server so Next.js can read the new key.
