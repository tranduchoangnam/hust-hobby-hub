import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create hobbies
  const hobbies = [
    { name: 'Art' },
    { name: 'Music' },
    { name: 'Photography' },
    { name: 'Travel' },
    { name: 'Books' },
    { name: 'Poetry' },
    { name: 'Coffee' },
    { name: 'Tea' },
    { name: 'Writing' },
    { name: 'Films' },
  ];

  for (const hobby of hobbies) {
    await prisma.hobby.upsert({
      where: { name: hobby.name },
      update: {},
      create: { name: hobby.name },
    });
  }

  // Create demo users
  const users = [
    {
      name: 'Sofia Martinez',
      email: 'sofia@example.com',
      password: 'password',
      image: '/profile1.png',
      hobbies: ['Art', 'Poetry', 'Music'],
    },
    {
      name: 'James Wilson',
      email: 'james@example.com',
      password: 'password',
      image: '/profile2.png',
      hobbies: ['Photography', 'Travel', 'Coffee'],
    },
    {
      name: 'Lily Chen',
      email: 'lily@example.com',
      password: 'password',
      image: '/profile3.png',
      hobbies: ['Books', 'Tea', 'Writing'],
    },
    {
      name: 'Oliver Brown',
      email: 'oliver@example.com',
      password: 'password',
      image: '/profile4.png',
      hobbies: ['Music', 'Art', 'Films'],
    },
  ];

  for (const user of users) {
    const hashedPassword = await hash(user.password, 10);
    
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        image: user.image,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        image: user.image,
      },
    });

    // Link user with hobbies
    for (const hobbyName of user.hobbies) {
      const hobby = await prisma.hobby.findUnique({
        where: { name: hobbyName },
      });

      if (hobby) {
        await prisma.userHobby.upsert({
          where: {
            userId_hobbyId: {
              userId: createdUser.id,
              hobbyId: hobby.id,
            },
          },
          update: {},
          create: {
            userId: createdUser.id,
            hobbyId: hobby.id,
          },
        });
      }
    }
  }

  // Add some demo messages
  const sofia = await prisma.user.findUnique({ where: { email: 'sofia@example.com' } });
  const james = await prisma.user.findUnique({ where: { email: 'james@example.com' } });
  
  if (sofia && james) {
    // Create a conversation between Sofia and James
    await prisma.message.create({
      data: {
        senderId: sofia.id,
        recipientId: james.id,
        content: "Hi James! I love your photography work.",
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
    });

    await prisma.message.create({
      data: {
        senderId: james.id,
        recipientId: sofia.id,
        content: "Thanks Sofia! I'm a big fan of your art too!",
        createdAt: new Date(Date.now() - 3600000),
      },
    });

    // Create a love note
    await prisma.loveNote.create({
      data: {
        senderId: sofia.id,
        recipientId: james.id,
        question: "What small moment made you feel happy today?",
        senderAnswer: "Seeing a beautiful sunset while taking photos",
      },
    });
  }

  console.log('Database has been seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });