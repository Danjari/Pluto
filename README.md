# 1. Start Postgres in Docker 

"""docker run --name vibe-db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=vibe_hackathon `
  -p 5432:5432 -d postgres:15

# Verify it’s up
docker ps
# (Should show vibe-db with 0.0.0.0:5432->5432/tcp)
"""

Later:

Stop: docker stop vibe-db

Start again: docker start vibe-db

Logs: docker logs -f vibe-db


# 2. Environment variables (app)

Create apps/web/.env with:

## Postgres (Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vibe_hackathon

## YouTube Data API v3 (comma-separated if you have multiple)
YOUTUBE_API_KEYS=AIza...yourKey1,AIza...optionalKey2

## Optional (if/when you wire NextAuth)
NEXTAUTH_SECRET=dev-secret-please-change
NEXTAUTH_URL=http://localhost:3000


If you don’t have a YouTube key yet, the preview endpoint will error; you can still use demo mode if you kept those files. But for real data, add a valid key.

# 3. Dependencies
"""cd apps/web
npm i"""



# 4) (If Tailwind didn’t compile previously) Classic Tailwind setup
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

 Ensure content globs
 """apps/web/tailwind.config.js =>
 module.exports = {
   content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
   theme: { extend: {} },
   plugins: [],
 };
 """

# Ensure PostCSS
"""
 apps/web/postcss.config.js =>
 module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
 """

Ensure Tailwind directives exist
"""
 apps/web/app/globals.css =>
 @tailwind base;
 @tailwind components;
 @tailwind utilities;
 """


If you’re short on time for a demo and Tailwind still won’t compile, add temporarily in app/layout.tsx:

"""
import Script from "next/script";
// inside <head>:
<Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />

"""

# 5) Prisma → create tables in your Docker DB

"""
#still in apps/web
npx prisma format
npx prisma migrate dev -n init
npx prisma generate

# optional visual DB browser
npx prisma studio
"""


# 6) Run the Next.js app (dev)

"""
npm run dev
"""


# QuickStart

"""
# Clone
git clone https://github.com/<you>/Vibe_Hackathon.git
cd Vibe_Hackathon

# Postgres in Docker
docker run --name vibe-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vibe_hackathon -p 5432:5432 -d postgres:15

# App env
cd apps/web
ni .env -ItemType File
notepad .env   # paste DATABASE_URL + YOUTUBE_API_KEYS (+ NEXTAUTH_* if needed)

# Deps
npm i

# (If needed) Tailwind classic
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Prisma
npx prisma migrate dev -n init
npx prisma generate

# Run
npm run dev
"""
