# API Documentation

## Overview

RepoDoc provides a RESTful API for programmatic access to all features. All API endpoints require authentication unless otherwise specified.

## Base URL

```
Production: https://repodoc.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

All API requests must include an authentication token in the header:

```http
Authorization: Bearer YOUR_API_KEY
```

Get your API key from the [Dashboard Settings](https://repodoc.vercel.app/settings).

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

| Tier | Requests/Minute |
|------|----------------|
| Free | 10 |
| Pro  | 100 |
| Enterprise | 1000 |

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## Endpoints

### Query API

#### POST /api/query

Query your codebase with natural language.

**Request Body:**
```json
{
  "projectId": "string",
  "question": "string",
  "conversationHistory": [
    {
      "role": "user" | "assistant",
      "content": "string"
    }
  ]
}
```

**Response:**
```json
{
  "answer": "string",
  "sources": [
    {
      "fileName": "string",
      "similarity": 0.95,
      "summary": "string"
    }
  ]
}
```

**Example:**
```bash
curl -X POST https://repodoc.vercel.app/api/query \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_123",
    "question": "How does authentication work?"
  }'
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (missing parameters)
- `401`: Unauthorized (invalid API key)
- `429`: Rate limit exceeded
- `500`: Server error

---

### Health Check

#### GET /api/health

Check API status and health.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 123456,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl https://repodoc.vercel.app/api/health
```

---

### Webhooks

#### POST /api/webhooks/clerk

Webhook endpoint for Clerk authentication events.

**This endpoint is for internal use only.**

---

## Error Handling

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {}
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing API key |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INVALID_REQUEST` | Missing or invalid parameters |
| `PROJECT_NOT_FOUND` | Project doesn't exist |
| `SERVER_ERROR` | Internal server error |

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await fetch('/api/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const result = await response.json();
  return result;
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

### 2. Rate Limit Handling

Implement exponential backoff:

```javascript
async function queryWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        await new Promise(resolve => 
          setTimeout(resolve, (parseInt(retryAfter) || 1) * 1000)
        );
        continue;
      }

      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

### 3. Caching

Cache responses when appropriate to reduce API calls:

```javascript
const cache = new Map();

async function queryWithCache(projectId, question) {
  const cacheKey = `${projectId}:${question}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const result = await query(projectId, question);
  cache.set(cacheKey, result);
  
  // Expire cache after 5 minutes
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  return result;
}
```

---

## SDK (Coming Soon)

We're working on official SDKs for popular languages:

- JavaScript/TypeScript
- Python
- Go
- Ruby

---

## Support

For API support:
- 📧 Email: api@repodoc.dev
- 💬 Discord: [Join our community](https://discord.gg/repodoc)
- 📖 Docs: [Full Documentation](https://docs.repodoc.dev)

---

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Query endpoint
- Health check endpoint
- Rate limiting implementation

