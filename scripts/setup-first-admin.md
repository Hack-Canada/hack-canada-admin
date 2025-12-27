# Setting Up the First Admin User

## Method 1: Using the TypeScript Script (Recommended)

1. **Navigate to the admin directory:**

   ```bash
   cd hack-canada-admin
   ```

2. **Run the admin creation script:**

   ```bash
   # Using bun (recommended)
   bun scripts/create-admin-user.ts "Your Name" "your-email@example.com" "your-secure-password"

   # Or using npm/pnpm
   npx tsx scripts/create-admin-user.ts "Your Name" "your-email@example.com" "your-secure-password"
   ```

3. **Example:**
   ```bash
   bun scripts/create-admin-user.ts "John Doe" "john@hackcanada.org" "SecurePassword123!"
   ```

## Method 2: Using Database SQL

1. **Generate a bcrypt hash for your password:**

   ```javascript
   // In Node.js console or online bcrypt generator
   const bcrypt = require("bcryptjs");
   const hash = bcrypt.hashSync("your-password", 10);
   console.log(hash);
   ```

2. **Run the SQL in your database:**
   - Open your database client (pgAdmin, DBeaver, etc.)
   - Update the values in `scripts/create-admin-user.sql`
   - Execute the SQL

## Method 3: Temporary Development Bypass

**⚠️ Only for development - Remove before production!**

1. **Temporarily modify the login route** to create an admin if none exists:

   ```typescript
   // In app/api/login/route.ts - add this at the beginning of POST function

   // Check if any admin users exist
   const adminCount = await db
     .select({ count: count() })
     .from(users)
     .where(eq(users.role, "admin"));

   // If no admins exist, create one with the login credentials
   if (adminCount[0].count === 0) {
     const hashedPassword = await bcrypt.hash(password, 10);
     await db.insert(users).values({
       name: "First Admin",
       email: email.toLowerCase(),
       password: hashedPassword,
       role: "admin",
       applicationStatus: "not_applied",
       emailVerified: new Date(),
     });
     console.log("First admin user created automatically");
   }
   ```

2. **Login with your credentials** - it will auto-create the admin user
3. **Remove this code** after creating the first admin

## Verification

After creating the admin user, verify by:

1. **Starting the development server:**

   ```bash
   cd hack-canada-admin
   pnpm dev
   ```

2. **Navigate to:** `http://localhost:3000/login`

3. **Login with your admin credentials**

4. **Check that you can access admin features** like user management, application reviews, etc.

## Troubleshooting

- **Database connection issues:** Verify your `DATABASE_URL` in `.env.local`
- **Permission errors:** Ensure your database user has INSERT permissions
- **Script not found:** Make sure you're in the `hack-canada-admin` directory
- **TypeScript errors:** Install dependencies with `pnpm install`

## Security Notes

- Use a strong password for the admin account
- Never commit credentials to version control
- Remove any temporary bypass code before production deployment
- Consider setting up 2FA or additional security measures for production



