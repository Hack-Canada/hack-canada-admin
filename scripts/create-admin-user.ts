import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/db/queries/audit-log";

async function createAdminUser(name: string, email: string, password: string) {
  if (!name || !email || !password) {
    console.error("Error: Name, email, and password are required");
    console.log(
      "Usage: bun scripts/create-admin-user.ts <name> <email> <password>",
    );
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      console.error("Error: User with this email already exists");
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    const [newUser] = await db
      .insert(users)
      .values({
        name: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "admin",
        applicationStatus: "not_applied",
        emailVerified: new Date(), // Mark as verified since it's an admin
      })
      .returning();

    // Create audit log for the user creation
    await createAuditLog({
      userId: newUser.id,
      action: "create",
      entityType: "user",
      entityId: newUser.id,
      metadata: {
        description: `Initial admin user created: ${name}`,
        createdBy: "system",
        timestamp: new Date().toISOString(),
        role: "admin",
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`Name: ${newUser.name}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`ID: ${newUser.id}`);
    console.log("\n🎉 You can now log in to the admin dashboard!");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

// Get arguments from command line
const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error(
    "Usage: bun scripts/create-admin-user.ts <name> <email> <password>",
  );
  console.error(
    'Example: bun scripts/create-admin-user.ts "John Doe" john@example.com mypassword123',
  );
  process.exit(1);
}

createAdminUser(name, email, password);



