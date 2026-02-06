# Memory LanceDB Plugin

This plugin provides long-term memory using LanceDB with embeddings from OpenAI or Ollama.

## Configuration Example

### OpenAI
```json
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "apiKey": "sk-your-openai-key"
  },
  "dbPath": "~/.openclaw/lancedb",
  "autoCapture": true,
  "autoRecall": true
}
```

### Ollama (Local)
```json
{
  "embedding": {
    "provider": "ollama",
    "model": "all-minilm:33m-l12-v2-fp16",
    "baseUrl": "http://127.0.0.1:11434/v1",
    "apiKey": "ollama"
  },
  "dbPath": "~/.openclaw/lancedb",
  "autoCapture": true,
  "autoRecall": true
}
```

Make sure Ollama is running locally with the model pulled.

## Troubleshooting

- If you encounter missing module errors, ensure @lancedb/lancedb is installed correctly for your platform.
- For ARM64 Mac, you may need to install @lancedb/lancedb-darwin-arm64 explicitly if issues persist.

