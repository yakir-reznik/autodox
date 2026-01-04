# How to run the local mysql server?

```bash
brew services start mysql
```

## How to connect to the mysql database via the terminal

```bash
mysql -u root -p
```

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### Database Setup

Generate and run migrations:

```bash
# Generate migrations from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Or run both at once
pnpm db:generate-and-migrate
```

### Create Admin User

After running migrations, create an admin user to login to the system:

```bash
# Create admin with default credentials (admin@example.com / admin123)
npx tsx scripts/create-admin.ts

# Or create with custom email and password
npx tsx scripts/create-admin.ts your@email.com YourPassword123

# Or specify all details (email, password, name)
npx tsx scripts/create-admin.ts your@email.com YourPassword123 "Your Name"
```

**Note:** If a user with the specified email already exists, the script will update their password instead of creating a new user.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Authentication System

Autodox includes a built-in authentication system using `nuxt-auth-utils` with email and password login.

### How It Works

- **Admin Users:** Must login to access form editor, form list, and admin pages
- **Public Access:** Anyone can fill out forms without logging in (via `/fill/[id]`)
- **Login:** Visit `/login` to enter credentials
- **Logout:** Click the logout button in the forms header

### Login Endpoints

- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout the current user
- `GET /api/auth/session` - Get current user session

### Protected Routes

The following routes require admin authentication:
- `/forms` - Forms list
- `/forms/new` - Create new form
- `/edit/[id]` - Edit form

### Public Routes

The following routes are accessible to everyone:
- `/` - Landing page
- `/login` - Login page
- `/fill/[id]` - Form filling interface
