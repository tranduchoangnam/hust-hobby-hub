// Hobby categories and category detection utility for reuse

export const HOBBY_CATEGORIES = [
  "🌈 Tất cả danh mục",
  "🎨 Nghệ thuật & Sáng tạo",
  "🎵 Âm nhạc",
  "📚 Văn học & Viết lách",
  "🎭 Nghệ thuật biểu diễn",
  "🍜 Ẩm thực & Đồ uống",
  "🏃‍♂️ Thể thao & Rèn luyện",
  "✈️ Du lịch & Văn hóa",
  "🌳 Thiên nhiên & Hoạt động ngoài trời",
  "💻 Công nghệ & Trò chơi",
  "🎬 Phim ảnh & Giải trí",
  "🧘 Sức khỏe & Tâm linh",
  "🔬 Khoa học & Học tập",
  "🪙 Sưu tầm & Đam mê",
  "🤝 Hoạt động xã hội",
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
    return "🎨 Nghệ thuật & Sáng tạo";
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
    return "🎵 Âm nhạc";
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
    return "📚 Văn học & Viết lách";
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
    return "🎭 Nghệ thuật biểu diễn";
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
    return "🍜 Ẩm thực & Đồ uống";
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
    return "🏃‍♂️ Thể thao & Rèn luyện";
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
    return "✈️ Du lịch & Văn hóa";
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
    return "🌳 Thiên nhiên & Hoạt động ngoài trời";
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
    return "💻 Công nghệ & Trò chơi";
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
    return "🎬 Phim ảnh & Giải trí";
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
    return "🧘 Sức khỏe & Tâm linh";
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
    return "🔬 Khoa học & Học tập";
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
    return "🪙 Sưu tầm & Đam mê";
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
    return "🤝 Hoạt động xã hội";
  }

  return "🌈 Tất cả danh mục";
};
