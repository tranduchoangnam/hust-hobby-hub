// Hobby categories and category detection utility for reuse

export const HOBBY_CATEGORIES = [
  "All Categories",
  "Arts & Creativity",
  "Music",
  "Literature & Writing",
  "Performing Arts",
  "Food & Beverages",
  "Sports & Fitness",
  "Travel & Culture",
  "Nature & Outdoors",
  "Technology & Gaming",
  "Media & Entertainment",
  "Wellness & Spirituality",
  "Science & Learning",
  "Collecting & Appreciation",
  "Social Activities",
];

export const getCategoryForHobby = (hobbyName: string): string => {
  const lowerName = hobbyName.toLowerCase();

  // Arts & Creativity
  if (
    [
      "art",
      "paint",
      "draw",
      "sculpt",
      "digital",
      "illustrat",
      "design",
      "animation",
      "calligraphy",
      "pottery",
      "jewelry",
      "knit",
      "crochet",
      "quilt",
      "sew",
      "embroidery",
      "candle",
      "diy",
      "craft",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Arts & Creativity";
  }

  // Music
  if (
    [
      "music",
      "guitar",
      "piano",
      "drum",
      "violin",
      "sing",
      "song",
      "dj",
      "classical",
      "jazz",
      "rock",
      "pop",
      "hip hop",
      "electronic",
      "country",
      "r&b",
      "opera",
      "choir",
      "musical",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Music";
  }

  // Literature & Writing
  if (
    [
      "book",
      "read",
      "writ",
      "poetry",
      "fiction",
      "non-fiction",
      "screen",
      "play",
      "blog",
      "journal",
      "literary",
      "story",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Literature & Writing";
  }

  // Performing Arts
  if (
    [
      "act",
      "theater",
      "dance",
      "ballet",
      "contemporary",
      "ballroom",
      "salsa",
      "comedy",
      "improv",
      "magic",
      "circus",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Performing Arts";
  }

  // Food & Beverages
  if (
    [
      "cook",
      "bak",
      "mix",
      "bartend",
      "coffee",
      "tea",
      "wine",
      "beer",
      "whiskey",
      "ferment",
      "sourdough",
      "cheese",
      "food",
      "vegetarian",
      "vegan",
      "gluten",
      "barbecue",
      "sushi",
      "italian",
      "french",
      "asian",
      "mexican",
      "middle eastern",
      "indian",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Food & Beverages";
  }

  // Sports & Fitness
  if (
    [
      "yoga",
      "pilates",
      "run",
      "hik",
      "climb",
      "swim",
      "cycl",
      "bik",
      "weight",
      "crossfit",
      "soccer",
      "basketball",
      "tennis",
      "volleyball",
      "badminton",
      "golf",
      "baseball",
      "snow",
      "ski",
      "surf",
      "skat",
      "martial",
      "box",
      "wrestl",
      "fenc",
      "archer",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Sports & Fitness";
  }

  // Travel & Culture
  if (
    [
      "travel",
      "backpack",
      "road trip",
      "camp",
      "cultural",
      "histor",
      "museum",
      "galler",
      "language",
      "anthropology",
      "archaeology",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Travel & Culture";
  }

  // Nature & Outdoors
  if (
    [
      "garden",
      "plant",
      "bird",
      "fish",
      "hunt",
      "forag",
      "wildlife",
      "stargaz",
      "astronom",
      "bee",
      "ecology",
      "conservation",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Nature & Outdoors";
  }

  // Technology & Gaming
  if (
    [
      "program",
      "develop",
      "game",
      "chess",
      "puzzle",
      "vr",
      "robot",
      "electronic",
      "drone",
      "print",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Technology & Gaming";
  }

  // Media & Entertainment
  if (
    [
      "film",
      "documentary",
      "tv",
      "anime",
      "comic",
      "manga",
      "podcast",
      "radio",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Media & Entertainment";
  }

  // Wellness & Spirituality
  if (
    [
      "meditat",
      "mindful",
      "spiritual",
      "tarot",
      "astrology",
      "essential oil",
      "aromatherapy",
      "herbal",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Wellness & Spirituality";
  }

  // Science & Learning
  if (
    [
      "science",
      "physics",
      "chemistry",
      "biology",
      "psychology",
      "neuroscience",
      "history",
      "philosophy",
      "linguistic",
      "math",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Science & Learning";
  }

  // Collecting & Appreciation
  if (
    [
      "collect",
      "antique",
      "coin",
      "stamp",
      "vinyl",
      "vintage",
      "enthusiasm",
      "sneaker",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Collecting & Appreciation";
  }

  // Social Activities
  if (
    [
      "volunteer",
      "community",
      "activism",
      "speak",
      "debate",
      "event plan",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Social Activities";
  }

  return "All Categories";
};
