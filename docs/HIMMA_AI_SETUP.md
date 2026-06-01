# Himma AI Setup

## Netlify

The chat widget calls this same-origin Netlify Function:

`/.netlify/functions/himma-ai`

No AI key is stored in frontend files. Add provider variables only in Netlify project settings.

## Mock mode

If no provider variables are configured, the function uses local fallback answers from:

- `knowledge/himma-info.txt`
- `knowledge/national-culture-book.txt`
- `knowledge/jordan-national-info.txt`
- `knowledge/faq.txt`

## OpenAI-compatible provider

Set these Netlify environment variables:

- `AI_PROVIDER=openai`
- `OPENAI_API_KEY=...`
- `OPENAI_BASE_URL=https://api.openai.com/v1`
- `OPENAI_MODEL=gpt-4o-mini`

For another OpenAI-compatible endpoint, keep `AI_PROVIDER=openai` and change `OPENAI_BASE_URL`.

## HuggingFace provider

Set:

- `AI_PROVIDER=huggingface`
- `HUGGINGFACE_API_KEY=...`
- `HUGGINGFACE_MODEL=your-model-name`

## Ollama provider

Ollama works only where the function can reach your Ollama server.

- `AI_PROVIDER=ollama`
- `OLLAMA_BASE_URL=http://your-ollama-host:11434`
- `OLLAMA_MODEL=llama3.1`

## Local function test

From the project root:

```bash
node -e "const {handler}=require('./netlify/functions/himma-ai.js'); handler({httpMethod:'POST', body: JSON.stringify({message:'ما هي مبادرة همة؟', dialect:'jordanian', language:'ar'})}).then(r=>console.log(r.statusCode, r.body))"
```

## Deployment notes

`netlify.toml` publishes the project root and includes the `knowledge/**` files with Netlify Functions.

Do not put `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY`, service role keys, or private credentials in frontend code.
