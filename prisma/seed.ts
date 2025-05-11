import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create hobbies
  const hobbies = [
    // Arts & Creativity
    { name: 'Art' },
    { name: 'Painting' },
    { name: 'Drawing' },
    { name: 'Sculpture' },
    { name: 'Digital Art' },
    { name: 'Illustration' },
    { name: 'Graphic Design' },
    { name: 'Animation' },
    { name: 'Calligraphy' },
    { name: 'Photography' },
    { name: 'Filmmaking' },
    { name: 'Pottery' },
    { name: 'Jewelry Making' },
    { name: 'Knitting' },
    { name: 'Crocheting' },
    { name: 'Quilting' },
    { name: 'Sewing' },
    { name: 'Embroidery' },
    { name: 'Candle Making' },
    { name: 'DIY Crafts' },
    
    // Music
    { name: 'Music' },
    { name: 'Playing Guitar' },
    { name: 'Playing Piano' },
    { name: 'Playing Drums' },
    { name: 'Playing Violin' },
    { name: 'Singing' },
    { name: 'Songwriting' },
    { name: 'Music Production' },
    { name: 'DJing' },
    { name: 'Classical Music' },
    { name: 'Jazz' },
    { name: 'Rock Music' },
    { name: 'Pop Music' },
    { name: 'Hip Hop' },
    { name: 'Electronic Music' },
    { name: 'Country Music' },
    { name: 'R&B' },
    { name: 'Opera' },
    { name: 'Choir' },
    { name: 'Musical Theater' },
    
    // Literature & Writing
    { name: 'Books' },
    { name: 'Reading' },
    { name: 'Creative Writing' },
    { name: 'Poetry' },
    { name: 'Fiction Writing' },
    { name: 'Non-fiction Writing' },
    { name: 'Screenwriting' },
    { name: 'Playwriting' },
    { name: 'Blogging' },
    { name: 'Journalism' },
    { name: 'Book Clubs' },
    { name: 'Literary Analysis' },
    { name: 'Storytelling' },
    
    // Performing Arts
    { name: 'Acting' },
    { name: 'Theater' },
    { name: 'Dance' },
    { name: 'Ballet' },
    { name: 'Contemporary Dance' },
    { name: 'Ballroom Dancing' },
    { name: 'Hip Hop Dancing' },
    { name: 'Salsa Dancing' },
    { name: 'Stand-up Comedy' },
    { name: 'Improv' },
    { name: 'Magic' },
    { name: 'Circus Arts' },
    
    // Food & Beverages
    { name: 'Cooking' },
    { name: 'Baking' },
    { name: 'Mixology' },
    { name: 'Bartending' },
    { name: 'Coffee' },
    { name: 'Tea' },
    { name: 'Wine Tasting' },
    { name: 'Craft Beer' },
    { name: 'Whiskey Tasting' },
    { name: 'Fermentation' },
    { name: 'Sourdough Baking' },
    { name: 'Cheese Making' },
    { name: 'Food Photography' },
    { name: 'Vegetarian Cooking' },
    { name: 'Vegan Cooking' },
    { name: 'Gluten-Free Baking' },
    { name: 'Barbecue' },
    { name: 'Sushi Making' },
    { name: 'Italian Cooking' },
    { name: 'French Cuisine' },
    { name: 'Asian Cooking' },
    { name: 'Mexican Cooking' },
    { name: 'Middle Eastern Cuisine' },
    { name: 'Indian Cooking' },
    
    // Sports & Fitness
    { name: 'Yoga' },
    { name: 'Pilates' },
    { name: 'Running' },
    { name: 'Hiking' },
    { name: 'Climbing' },
    { name: 'Swimming' },
    { name: 'Cycling' },
    { name: 'Mountain Biking' },
    { name: 'Weight Training' },
    { name: 'CrossFit' },
    { name: 'Soccer' },
    { name: 'Basketball' },
    { name: 'Tennis' },
    { name: 'Volleyball' },
    { name: 'Badminton' },
    { name: 'Golf' },
    { name: 'Baseball' },
    { name: 'Snowboarding' },
    { name: 'Skiing' },
    { name: 'Surfing' },
    { name: 'Skating' },
    { name: 'Skateboarding' },
    { name: 'Martial Arts' },
    { name: 'Boxing' },
    { name: 'Wrestling' },
    { name: 'Fencing' },
    { name: 'Archery' },
    
    // Travel & Culture
    { name: 'Travel' },
    { name: 'Backpacking' },
    { name: 'Road Trips' },
    { name: 'Camping' },
    { name: 'Cultural Exploration' },
    { name: 'Historical Sites' },
    { name: 'Museums' },
    { name: 'Galleries' },
    { name: 'Language Learning' },
    { name: 'Anthropology' },
    { name: 'Archaeology' },
    
    // Nature & Outdoors
    { name: 'Gardening' },
    { name: 'Plant Care' },
    { name: 'Birdwatching' },
    { name: 'Fishing' },
    { name: 'Hunting' },
    { name: 'Foraging' },
    { name: 'Wildlife Photography' },
    { name: 'Stargazing' },
    { name: 'Astronomy' },
    { name: 'Beekeeping' },
    { name: 'Ecology' },
    { name: 'Conservation' },
    
    // Technology & Gaming
    { name: 'Programming' },
    { name: 'Web Development' },
    { name: 'Game Development' },
    { name: 'Video Games' },
    { name: 'Board Games' },
    { name: 'Card Games' },
    { name: 'Tabletop RPGs' },
    { name: 'Chess' },
    { name: 'Puzzles' },
    { name: 'VR Gaming' },
    { name: 'Robotics' },
    { name: 'Electronics' },
    { name: 'Drones' },
    { name: '3D Printing' },
    
    // Media & Entertainment
    { name: 'Films' },
    { name: 'Documentaries' },
    { name: 'TV Shows' },
    { name: 'Anime' },
    { name: 'Comics' },
    { name: 'Manga' },
    { name: 'Podcasts' },
    { name: 'Radio' },
    
    // Wellness & Spirituality
    { name: 'Meditation' },
    { name: 'Mindfulness' },
    { name: 'Spiritual Practices' },
    { name: 'Tarot Reading' },
    { name: 'Astrology' },
    { name: 'Essential Oils' },
    { name: 'Aromatherapy' },
    { name: 'Herbalism' },
    
    // Science & Learning
    { name: 'Science' },
    { name: 'Physics' },
    { name: 'Chemistry' },
    { name: 'Biology' },
    { name: 'Psychology' },
    { name: 'Neuroscience' },
    { name: 'History' },
    { name: 'Philosophy' },
    { name: 'Linguistics' },
    { name: 'Mathematics' },
    
    // Collecting & Appreciation
    { name: 'Antique Collecting' },
    { name: 'Coin Collecting' },
    { name: 'Stamp Collecting' },
    { name: 'Vinyl Records' },
    { name: 'Vintage Fashion' },
    { name: 'Art Collecting' },
    { name: 'Car Enthusiasm' },
    { name: 'Motorcycle Enthusiasm' },
    { name: 'Sneaker Collecting' },
    
    // Social Activities
    { name: 'Volunteering' },
    { name: 'Community Service' },
    { name: 'Political Activism' },
    { name: 'Environmental Activism' },
    { name: 'Public Speaking' },
    { name: 'Debate' },
    { name: 'Event Planning' },
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
    // Original users
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
    
    // New users with diverse interests
    {
      name: 'Emma Taylor',
      email: 'emma@example.com',
      password: 'password',
      image: '/profile5.png',
      hobbies: ['Yoga', 'Meditation', 'Vegetarian Cooking', 'Hiking', 'Plant Care'],
    },
    {
      name: 'Noah Garcia',
      email: 'noah@example.com',
      password: 'password',
      image: '/profile6.png',
      hobbies: ['Programming', 'Video Games', 'Board Games', 'Anime', 'Science Fiction Writing'],
    },
    {
      name: 'Zoe Johnson',
      email: 'zoe@example.com',
      password: 'password',
      image: '/profile7.png',
      hobbies: ['Photography', 'Travel', 'Hiking', 'Camping', 'Wildlife Photography'],
    },
    {
      name: 'Ethan Lee',
      email: 'ethan@example.com',
      password: 'password',
      image: '/profile8.png',
      hobbies: ['Basketball', 'Fitness', 'Cooking', 'Podcasts', 'Hip Hop'],
    },
    {
      name: 'Ava Rodriguez',
      email: 'ava@example.com',
      password: 'password',
      image: '/profile9.png',
      hobbies: ['Dance', 'Music Production', 'Fashion Design', 'Singing', 'Theater'],
    },
    {
      name: 'Lucas Kim',
      email: 'lucas@example.com',
      password: 'password',
      image: '/profile10.png',
      hobbies: ['Rock Climbing', 'Photography', 'Travel', 'Coffee', 'Mountain Biking'],
    },
    {
      name: 'Isabella Patel',
      email: 'isabella@example.com',
      password: 'password',
      image: '/profile11.png',
      hobbies: ['Art', 'Illustration', 'Comics', 'Anime', 'Cosplay'],
    },
    {
      name: 'Mason Thompson',
      email: 'mason@example.com',
      password: 'password',
      image: '/profile12.png',
      hobbies: ['Music', 'Guitar', 'Songwriting', 'Recording', 'Craft Beer'],
    },
    {
      name: 'Charlotte Williams',
      email: 'charlotte@example.com',
      password: 'password',
      image: '/profile13.png',
      hobbies: ['Baking', 'Food Photography', 'Blogging', 'Gardening', 'Tea'],
    },
    {
      name: 'Liam Nguyen',
      email: 'liam@example.com',
      password: 'password',
      image: '/profile14.png',
      hobbies: ['Soccer', 'Chess', 'Physics', 'Space Exploration', 'Documentaries'],
    },
    {
      name: 'Harper Davis',
      email: 'harper@example.com',
      password: 'password',
      image: '/profile15.png',
      hobbies: ['Yoga', 'Meditation', 'Psychology', 'Philosophy', 'Writing'],
    },
    {
      name: 'Benjamin Zhang',
      email: 'benjamin@example.com',
      password: 'password',
      image: '/profile16.png',
      hobbies: ['Photography', 'Filmmaking', 'Storytelling', 'Travel', 'Cultural Exploration'],
    },
    {
      name: 'Amelia Singh',
      email: 'amelia@example.com',
      password: 'password',
      image: '/profile17.png',
      hobbies: ['Painting', 'Poetry', 'Books', 'Museums', 'Classical Music'],
    },
    {
      name: 'Elijah Robinson',
      email: 'elijah@example.com',
      password: 'password',
      image: '/profile18.png',
      hobbies: ['Basketball', 'Podcasts', 'Hip Hop', 'Sneaker Collecting', 'Street Photography'],
    },
    {
      name: 'Mia Johnson',
      email: 'mia@example.com',
      password: 'password',
      image: '/profile19.png',
      hobbies: ['Environmental Activism', 'Conservation', 'Hiking', 'Birdwatching', 'Volunteering'],
    },
    {
      name: 'Aiden Wilson',
      email: 'aiden@example.com',
      password: 'password',
      image: '/profile20.png',
      hobbies: ['Cooking', 'Wine Tasting', 'Travel', 'Jazz', 'Films'],
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
  const emma = await prisma.user.findUnique({ where: { email: 'emma@example.com' } });
  const noah = await prisma.user.findUnique({ where: { email: 'noah@example.com' } });
  
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

  // Add more conversations and love notes
  if (emma && noah) {
    await prisma.message.create({
      data: {
        senderId: emma.id,
        recipientId: noah.id,
        content: "Hey Noah! I saw you're into programming too. What languages do you use?",
        createdAt: new Date(Date.now() - 2600000),
      },
    });

    await prisma.message.create({
      data: {
        senderId: noah.id,
        recipientId: emma.id,
        content: "Hi Emma! Mostly JavaScript and Python. I've been working on a meditation app actually - seems like we share that interest!",
        createdAt: new Date(Date.now() - 2400000),
      },
    });

    await prisma.message.create({
      data: {
        senderId: emma.id,
        recipientId: noah.id,
        content: "That's so cool! I'd love to hear more about it. Maybe we could combine yoga and tech somehow.",
        createdAt: new Date(Date.now() - 2200000),
      },
    });
    
    // Create a love note
    await prisma.loveNote.create({
      data: {
        senderId: noah.id,
        recipientId: emma.id,
        question: "What's something you've always wanted to learn?",
        senderAnswer: "I've always wanted to learn how to make my own video game from scratch",
      },
    });
  }

  // Sofia and Emma conversation
  if (sofia && emma) {
    await prisma.message.create({
      data: {
        senderId: sofia.id,
        recipientId: emma.id,
        content: "Hi Emma! I noticed we both love art. What kind of art do you create?",
        createdAt: new Date(Date.now() - 4600000),
      },
    });

    await prisma.message.create({
      data: {
        senderId: emma.id,
        recipientId: sofia.id,
        content: "Hey Sofia! I mostly do nature-inspired drawings. Your art pieces are amazing! Would love to chat about techniques sometime.",
        createdAt: new Date(Date.now() - 4400000),
      },
    });
  }

  console.log('Database has been seeded with expanded user data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });