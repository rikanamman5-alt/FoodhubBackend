import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client.js';

const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPERADMIN_EMAIL || 'admin@foodhub.com';
    const password = process.env.SUPERADMIN_PASSWORD || 'Admin@123456';
    const firstName = process.env.SUPERADMIN_FIRSTNAME || 'Super';
    const lastName = process.env.SUPERADMIN_LASTNAME || 'Admin';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('Super admin already exists');
      process.exit(0);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'SUPERADMIN',
        accountStatus: 'APPROVED',
        isActive: true,
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.subscriptionSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', defaultTrialDays: 7 },
    });
    await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', appName: 'Foodhub' },
    });
    await prisma.paymentSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', isActive: true },
    });

    console.log('Super admin seeded successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seedSuperAdmin();
