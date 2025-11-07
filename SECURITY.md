# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of RepoDoc seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do NOT:

- Open a public GitHub issue
- Post about it on social media
- Discuss it in public forums or chat

### Please DO:

1. **Email us directly** at security@repodoc.dev
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Allow us time** to respond and fix the issue before public disclosure

### What to Expect:

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Status Updates**: Every 7 days
- **Resolution**: Varies by severity

### Severity Levels:

| Level | Response Time | Example |
|-------|--------------|---------|
| Critical | 24 hours | Authentication bypass |
| High | 72 hours | SQL injection |
| Medium | 7 days | XSS vulnerability |
| Low | 30 days | Information disclosure |

## Security Measures

### Application Security

✅ **Authentication & Authorization**
- Secure OAuth implementation (Clerk)
- JWT token validation
- Role-based access control
- Session management

✅ **Data Protection**
- Encrypted data at rest
- Encrypted data in transit (TLS/SSL)
- Secure password hashing (bcrypt)
- Input sanitization

✅ **API Security**
- Rate limiting on all endpoints
- Request validation (Zod)
- CORS configuration
- API key authentication

✅ **Infrastructure Security**
- Regular dependency updates
- Automated vulnerability scanning
- Security headers
- DDoS protection

### Code Security Practices

```typescript
// ✅ Good - Input validation
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const validated = schema.parse(input);

// ❌ Bad - No validation
const { email, password } = req.body;
```

```typescript
// ✅ Good - SQL injection prevention
const user = await prisma.user.findUnique({
  where: { email },
});

// ❌ Bad - SQL injection risk
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

```typescript
// ✅ Good - XSS prevention
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);

// ❌ Bad - XSS risk
element.innerHTML = userInput;
```

## Security Checklist for Contributors

When submitting code:

- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (use ORM)
- [ ] XSS prevention (sanitize output)
- [ ] CSRF tokens for state-changing operations
- [ ] Authentication checks on protected routes
- [ ] Rate limiting on API endpoints
- [ ] Secure error messages (no sensitive info)
- [ ] Dependencies up to date
- [ ] No hardcoded secrets or keys
- [ ] Proper authorization checks

## Dependency Security

We use automated tools to keep dependencies secure:

- **Dependabot**: Automated dependency updates
- **npm audit**: Regular vulnerability scanning
- **Snyk**: Continuous security monitoring

Run security check locally:
```bash
npm audit
npm audit fix
```

## Environment Variables

Never commit sensitive information:

❌ **DO NOT**:
```typescript
const apiKey = "sk-1234567890abcdef";
```

✅ **DO**:
```typescript
const apiKey = process.env.API_KEY;
```

Use `.env.example` for documentation:
```env
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/db
API_KEY=your_api_key_here
```

## Security Headers

We implement security headers:

```typescript
// next.config.ts
{
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ],
    },
  ],
}
```

## Incident Response

In case of a security incident:

1. **Contain**: Isolate affected systems
2. **Investigate**: Determine scope and impact
3. **Remediate**: Fix the vulnerability
4. **Communicate**: Notify affected users
5. **Learn**: Update processes to prevent recurrence

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

<!-- Will be updated when we receive reports -->
- To be announced

## Contact

Security Team: security@repodoc.dev
PGP Key: [Available on request]

---

Last updated: 2024-01-01

