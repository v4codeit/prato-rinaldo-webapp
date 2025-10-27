# Dockerfile per Prato Rinaldo - Next.js 16 + Supabase
FROM node:20-alpine AS base

# Installa dipendenze necessarie
RUN apk add --no-cache libc6-compat

# Imposta working directory
WORKDIR /app

# Installa pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps

# Copia file package
COPY package.json pnpm-lock.yaml ./

# Installa dipendenze
RUN pnpm install --frozen-lockfile

# ============================================
# Builder stage
# ============================================
FROM base AS builder

# Copia dipendenze
COPY --from=deps /app/node_modules ./node_modules

# Copia codice sorgente
COPY . .

# Build arguments per variabili ambiente build-time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Imposta variabili ambiente per build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Build applicazione
RUN pnpm build

# ============================================
# Runner stage
# ============================================
FROM base AS runner

# Imposta NODE_ENV
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crea utente non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia file necessari per runtime
COPY --from=builder /app/public ./public

# Imposta permessi per prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copia output standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switcha a utente non-root
USER nextjs

# Esponi porta
EXPOSE 3000

# Imposta variabili ambiente runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Avvia applicazione
CMD ["node", "server.js"]
