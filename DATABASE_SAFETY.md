# Database Safety Guide

## Protected Commands

This project includes safety measures to prevent accidental database resets and data loss.

### ⚠️ Database Reset Protection

The `prisma migrate reset` command is **protected** and cannot be run directly. This prevents accidental data loss in development databases.

### Safe Database Reset

If you need to reset your database, use the safe wrapper script:

```bash
npm run db:reset
```

This script will:
1. ✅ Check that you're not in production environment
2. ✅ Verify the database URL doesn't contain production keywords
3. ✅ Require **double confirmation** (type "RESET" then "YES")
4. ✅ Show database information before proceeding

### Direct Command Blocked

Running `npx prisma migrate reset` directly is **not recommended** and may be blocked in future versions. Always use:

```bash
npm run db:reset
```

### Alternative: Manual Reset

If you absolutely need to reset without the safety checks (not recommended), you can:

1. Set `NODE_ENV=development` explicitly
2. Verify your `DATABASE_URL` is correct
3. Run: `npx prisma migrate reset --force`

**⚠️ Warning**: This bypasses all safety checks. Use with extreme caution!

### Environment Checks

The safety script checks:
- `NODE_ENV` must not be "production"
- `DATABASE_URL` must not contain: "prod", "production", "live", or "staging"

### Best Practices

1. **Always backup** your database before resetting
2. **Use migrations** instead of resets when possible: `npm run db:migrate`
3. **Test in development** before applying to production
4. **Review changes** before running destructive commands

### Database Commands Reference

| Command | Description | Safety |
|---------|-------------|--------|
| `npm run db:generate` | Generate Prisma Client | ✅ Safe |
| `npm run db:push` | Push schema changes | ✅ Safe |
| `npm run db:migrate` | Create/apply migrations | ✅ Safe |
| `npm run db:reset` | Reset database (with safety checks) | ⚠️ Protected |
| `npm run db:studio` | Open Prisma Studio | ✅ Safe |
| `npm run db:seed` | Seed database | ✅ Safe |
