const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Require an explicit account email.
  const email = process.argv[2];
  if (!email) throw new Error("Usage: node scripts/set-super-admin.js <email>");

  console.log(`Setting super admin status for: ${email}`);

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      console.log("Creating super admin user...");

      // You can create the user here if needed, or just notify
      console.log("Please create the user first, then run this script again.");
      return;
    }

    // Update user to be super admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isSuperAdmin: true },
    });

    console.log(`✓ Successfully set ${email} as super admin!`);
    console.log(`User ID: ${updatedUser.id}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
