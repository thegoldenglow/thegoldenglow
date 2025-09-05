# Security Guidelines for Golden Glow

## Environment Variables

This project uses environment variables to manage sensitive configuration. **Never commit actual credentials to the repository.**

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Telegram Bot Configuration
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# WalletConnect (Get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Security Best Practices

1. **Never hardcode credentials** in source code
2. **Use environment variables** for all sensitive configuration
3. **Add .env to .gitignore** to prevent accidental commits
4. **Rotate credentials regularly** especially if they may have been exposed
5. **Use different credentials** for development, staging, and production environments
6. **Limit credential permissions** to only what's necessary

### Credential Management

- **Telegram Bot Token**: Obtain from @BotFather on Telegram
- **Supabase Keys**: Get from your Supabase project dashboard
- **WalletConnect Project ID**: Register at https://cloud.walletconnect.com

### What to Do If Credentials Are Exposed

1. **Immediately revoke** the exposed credentials
2. **Generate new credentials** from the respective services
3. **Update environment variables** with new credentials
4. **Review git history** and remove any commits containing credentials
5. **Notify team members** about the security incident

### Development vs Production

- Use separate credentials for development and production
- Never use production credentials in development environments
- Consider using credential management services for production deployments

## Database Security

- All database functions should validate input parameters
- Use parameterized queries to prevent SQL injection
- Implement proper access controls and row-level security
- Regularly audit database permissions and functions

## Additional Security Measures

- Keep dependencies updated
- Use HTTPS for all external communications
- Implement proper error handling without exposing sensitive information
- Regular security audits and penetration testing