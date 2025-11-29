// Animal names with adjectives for suggestions
const ADJECTIVES = [
  'Calm', 'Peaceful', 'Gentle', 'Quiet', 'Serene', 'Tranquil', 'Still', 
  'Soft', 'Mystic', 'Hidden', 'Silent', 'Brave', 'Wise', 'Swift', 'Noble',
  'Bright', 'Clever', 'Fierce', 'Loyal', 'Proud', 'Wild', 'Free', 'Happy',
  'Joyful', 'Playful', 'Curious', 'Kind', 'Patient', 'Strong', 'Gentle'
];

const ANIMALS = [
  'Lion', 'Tiger', 'Bear', 'Wolf', 'Fox', 'Eagle', 'Hawk', 'Owl', 'Raven',
  'Dolphin', 'Whale', 'Shark', 'Turtle', 'Frog', 'Butterfly', 'Dragonfly',
  'Elephant', 'Giraffe', 'Zebra', 'Kangaroo', 'Koala', 'Panda', 'Penguin',
  'Octopus', 'Jellyfish', 'Seahorse', 'Starfish', 'Otter', 'Beaver', 'Badger',
  'Deer', 'Rabbit', 'Squirrel', 'Hedgehog', 'Raccoon', 'Skunk', 'Possum',
  'Parrot', 'Peacock', 'Swan', 'Goose', 'Duck', 'Robin', 'Sparrow', 'Finch',
  'Salmon', 'Trout', 'Bass', 'Carp', 'Catfish', 'Stingray', 'Lobster', 'Crab'
];

// Cache to ensure uniqueness during runtime
const usedNames = new Set<string>();

export const generateAnonymousAnimalName = (): string => {
  let attempts = 0;
  const maxAttempts = ADJECTIVES.length * ANIMALS.length;
  
  while (attempts < maxAttempts) {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const name = `${adjective} ${animal}`;
    
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    
    attempts++;
  }
  
  // Fallback if all names are used (unlikely)
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective} ${animal} ${Math.floor(Math.random() * 1000)}`;
};

export const isAnimalName = (name: string): boolean => {
  const words = name.split(' ');
  if (words.length < 2) return false;
  
  const adjective = words[0];
  const animal = words.slice(1).join(' ');
  
  return ADJECTIVES.includes(adjective) && ANIMALS.includes(animal);
};

// New function to validate animal names
export const validateAnimalName = (name: string): boolean => {
  // Allow custom names but ensure they follow the adjective + animal pattern
  const words = name.split(' ');
  if (words.length < 2) return false;
  
  // Check if it's a valid animal name from our list
  const adjective = words[0];
  const animal = words.slice(1).join(' ');
  
  // Allow any adjective but validate the animal part
  return ANIMALS.includes(animal);
};

// Get suggestions for animal names
export const getAnimalNameSuggestions = (count: number = 5): string[] => {
  const suggestions: string[] = [];
  const usedIndices = new Set<number>();
  
  while (suggestions.length < count && suggestions.length < ADJECTIVES.length * ANIMALS.length) {
    const adjIndex = Math.floor(Math.random() * ADJECTIVES.length);
    const animalIndex = Math.floor(Math.random() * ANIMALS.length);
    const key = adjIndex * ANIMALS.length + animalIndex;
    
    if (!usedIndices.has(key)) {
      usedIndices.add(key);
      suggestions.push(`${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]}`);
    }
  }
  
  return suggestions;
};

// Get all available animals for dropdown
export const getAvailableAnimals = (): string[] => {
  return [...ANIMALS];
};

// Get all available adjectives for dropdown
export const getAvailableAdjectives = (): string[] => {
  return [...ADJECTIVES];
};