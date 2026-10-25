# syntax=docker/dockerfile:1
ARG APP=web

FROM node:22.22.0-alpine3.23 AS base
WORKDIR /app
RUN corepack enable

FROM base AS prune
ARG APP
COPY . .
RUN pnpm dlx turbo@2.11.7 prune "$APP" --docker

FROM base AS build
ARG APP
ENV NEXT_TELEMETRY_DISABLED=1 MULTI_TENANT=1
COPY --from=prune /app/out/json/ ./
COPY --from=prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store
COPY --from=prune /app/out/full/ ./
# The isolated build context contains no secrets; pass MULTI_TENANT through Turbo's env filter.
RUN pnpm turbo run build --filter="$APP" --env-mode=loose \
    && mkdir -p "apps/$APP/public"

# The standalone server only needs the node binary; leaving npm/yarn/corepack behind keeps web under 250 MB.
FROM alpine:3.23 AS runner
ARG APP
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN apk add --no-cache libstdc++ \
    && addgroup -S -g 1001 nodejs \
    && adduser -S -D -H -u 1001 -G nodejs nextjs
COPY --from=base /usr/local/bin/node /usr/local/bin/node
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP}/.next/standalone/ ./
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP}/.next/static/ ./apps/${APP}/.next/static/
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP}/public/ ./apps/${APP}/public/
WORKDIR /app/apps/${APP}
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -T 3 -O /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["node", "server.js"]
