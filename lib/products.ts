export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  benefits: string[];
  flavors: string[];
  servings: number;
  nutritionFacts: {
    protein: string;
    carbs: string;
    fats: string;
    calories: string;
  };
  ingredients: string[];
  usage: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Whey Protein Isolate',
    category: 'Whey Protein',
    price: 2499,
    rating: 4.8,
    reviews: 342,
    description: 'Premium whey protein isolate with 25g protein per serving. Fast absorption for optimal muscle recovery.',
    image: '/products/whey-protein.jpg',
    benefits: ['Fast Muscle Recovery', 'High Protein Content', 'Low Carbs', 'Lab Tested'],
    flavors: ['Chocolate', 'Vanilla', 'Strawberry', 'Unflavored'],
    servings: 30,
    nutritionFacts: {
      protein: '25g',
      carbs: '2g',
      fats: '1g',
      calories: '110',
    },
    ingredients: ['Whey Protein Isolate', 'Natural Flavors', 'Stevia', 'Lecithin'],
    usage: 'Mix 1 scoop with 200ml water or milk. Consume post-workout or anytime.',
  },
  {
    id: '2',
    name: 'Mass Gainer Pro',
    category: 'Mass Gainer',
    price: 3299,
    rating: 4.7,
    reviews: 218,
    description: 'High-calorie mass gainer with 50g protein and complex carbs for serious muscle builders.',
    image: '/products/mass-gainer.jpg',
    benefits: ['50g Protein Per Serve', 'Complex Carbs', 'Calorie Dense', 'Premium Ingredients'],
    flavors: ['Chocolate', 'Vanilla', 'Strawberry'],
    servings: 15,
    nutritionFacts: {
      protein: '50g',
      carbs: '85g',
      fats: '12g',
      calories: '650',
    },
    ingredients: ['Whey Protein', 'Oats', 'Maltodextrin', 'MCT Oil', 'Vitamins'],
    usage: 'Mix 2-3 scoops with 400ml milk. Consume 1-2 times daily for muscle gains.',
  },
  {
    id: '3',
    name: 'Creatine Monohydrate',
    category: 'Creatine',
    price: 999,
    rating: 4.9,
    reviews: 521,
    description: 'Pure micronized creatine monohydrate. Boosts strength, power, and muscle growth.',
    image: '/products/creatine.jpg',
    benefits: ['Increased Strength', 'Muscle Growth', 'Better Performance', 'Proven Formula'],
    flavors: ['Unflavored'],
    servings: 60,
    nutritionFacts: {
      protein: '0g',
      carbs: '0g',
      fats: '0g',
      calories: '0',
    },
    ingredients: ['Creatine Monohydrate', 'Micronized'],
    usage: 'Loading Phase: 20g daily (5g x 4 times) for 5-7 days. Maintenance: 3-5g daily.',
  },
  {
    id: '4',
    name: 'Pre Workout Blast',
    category: 'Pre Workout',
    price: 1899,
    rating: 4.6,
    reviews: 289,
    description: 'Powerful pre-workout formula with caffeine, beta-alanine, and citrulline for intense training.',
    image: '/products/preworkout.jpg',
    benefits: ['Intense Energy', 'Better Pumps', 'Enhanced Focus', 'Endurance Booster'],
    flavors: ['Blue Raspberry', 'Watermelon', 'Mango'],
    servings: 25,
    nutritionFacts: {
      protein: '0g',
      carbs: '1g',
      fats: '0g',
      calories: '5',
    },
    ingredients: ['Caffeine', 'Beta-Alanine', 'Citrulline Malate', 'Taurine', 'Vitamins'],
    usage: 'Mix 1 scoop with 200ml water. Consume 30 minutes before workout.',
  },
  {
    id: '5',
    name: 'BCAA Complex',
    category: 'BCAA',
    price: 1499,
    rating: 4.7,
    reviews: 156,
    description: 'Branched-chain amino acids in optimal 2:1:1 ratio. Prevents muscle breakdown during training.',
    image: '/products/bcaa.jpg',
    benefits: ['Muscle Preservation', 'Fast Recovery', 'Reduced Fatigue', 'Optimal Ratio'],
    flavors: ['Tropical Punch', 'Lemon Lime', 'Orange'],
    servings: 40,
    nutritionFacts: {
      protein: '0g',
      carbs: '1g',
      fats: '0g',
      calories: '4',
    },
    ingredients: ['L-Leucine', 'L-Isoleucine', 'L-Valine', 'Natural Flavors'],
    usage: 'Mix 1 scoop with 250ml water. Can be consumed pre, during, or post-workout.',
  },
  {
    id: '6',
    name: 'Complete Multivitamin',
    category: 'Multivitamin',
    price: 899,
    rating: 4.8,
    reviews: 412,
    description: 'Complete micronutrient support with essential vitamins and minerals for athletes.',
    image: '/products/multivitamin.jpg',
    benefits: ['Immune Support', 'Energy Production', 'Overall Health', 'Muscle Recovery'],
    flavors: ['Mixed Berry'],
    servings: 60,
    nutritionFacts: {
      protein: '0g',
      carbs: '0g',
      fats: '0g',
      calories: '5',
    },
    ingredients: ['Vitamin C', 'Vitamin D3', 'Zinc', 'Magnesium', 'Iron', 'B-Complex'],
    usage: 'Take 2 tablets daily with meals. Best taken in morning and evening.',
  },
  {
    id: '7',
    name: 'Fat Burner Extreme',
    category: 'Fat Burner',
    price: 1699,
    rating: 4.5,
    reviews: 187,
    description: 'Thermogenic fat burner with proven ingredients for metabolism boost.',
    image: '/products/fatburner.jpg',
    benefits: ['Metabolism Boost', 'Fat Loss', 'Energy Increase', 'Appetite Control'],
    flavors: ['Lime', 'Berry Blast'],
    servings: 30,
    nutritionFacts: {
      protein: '0g',
      carbs: '0g',
      fats: '0g',
      calories: '0',
    },
    ingredients: ['Green Tea Extract', 'Caffeine', 'L-Carnitine', 'Cayenne Pepper'],
    usage: 'Mix 1 scoop with 200ml water. Take once daily, preferably in morning.',
  },
  {
    id: '8',
    name: 'Omega-3 Fish Oil',
    category: 'Supplements',
    price: 1199,
    rating: 4.6,
    reviews: 234,
    description: 'Premium omega-3 fish oil with EPA and DHA for joint and heart health.',
    image: '/products/omega3.jpg',
    benefits: ['Joint Health', 'Heart Support', 'Brain Function', 'Anti-Inflammatory'],
    flavors: ['Lemon'],
    servings: 60,
    nutritionFacts: {
      protein: '0g',
      carbs: '0g',
      fats: '2g',
      calories: '18',
    },
    ingredients: ['Fish Oil', 'EPA', 'DHA', 'Vitamin E'],
    usage: 'Take 2 capsules daily with meals.',
  },
];

export const categories = [
  'All Products',
  'Whey Protein',
  'Mass Gainer',
  'Creatine',
  'Pre Workout',
  'BCAA',
  'Multivitamin',
  'Fat Burner',
  'Supplements',
];
