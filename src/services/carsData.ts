export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  engine: string;
  transmission: string;
  caution: number;
  description: string;
  imageUrl: string;
  images?: string[];
}

export const cars: Car[] = [
  {
    id: "g-class-005",
    brand: "Mercedes-Benz",
    model: "G-Class Brabus",
    year: 2024,
    category: "Luxury المتميزة",
    pricePerDay: 4000,
    engine: "V8 4.0L BiTurbo",
    transmission: "أوتوماتيكي (9 سرعات)",
    caution: 50000,
    description: "فخامة وقوة لا مثيل لها. سيارة مرسيدس جي كلاس إصدار برابوس. تتميز بتصميم مهيب وتجهيزات رياضية خارقة، لتجربة قيادة لا تُنسى.",
    imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: "touareg-006",
    brand: "Volkswagen",
    model: "Touareg",
    year: 2024,
    category: "عائلية SUV",
    pricePerDay: 1500,
    engine: "V6 3.0L ديزل",
    transmission: "أوتوماتيكي (8 سرعات)",
    caution: 20000,
    description: "أناقة، رحابة، وأمان. سيارة عائلية فخمة توفر أقصى درجات الراحة والتكنولوجيا الحديثة، مثالية للرحلات الطويلة والمهمات اليومية.",
    imageUrl: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: "rangerover-velar-001",
    brand: "Range Rover",
    model: "Velar",
    year: 2024,
    category: "Luxury المتميزة",
    pricePerDay: 1200,
    engine: "V6 ديزل",
    transmission: "أوتوماتيكي (8 سرعات)",
    caution: 15000,
    description: "الخيار الأمثل للرفاهية والقوة المطلقة في القيادة. توفير مريح، تصميم رياضي، ومساحة داخلية واسعة. مثالية للتجول في أرجاء طنجة واستكشاف الشمال بمستوى لا يضاهى من الراحة.",
    imageUrl: "https://images.unsplash.com/photo-1621135802920-133df287f2a7?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: "clio-002",
    brand: "Renault",
    model: "Clio 5",
    year: 2023,
    category: "الاقتصادية",
    pricePerDay: 250,
    engine: "1.5 dCi ديزل",
    transmission: "يدوي",
    caution: 5000,
    description: "سيارة اقتصادية وعملية جداً، مثالية للقيادة داخل المدينة. استهلاك وقود منخفض جداً وسهولة في الركن.",
    imageUrl: "https://images.unsplash.com/photo-1542362567-b05261b60048?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: "dacia-logan-003",
    brand: "Dacia",
    model: "Logan",
    year: 2023,
    category: "الاقتصادية",
    pricePerDay: 200,
    engine: "1.5 dCi ديزل",
    transmission: "يدوي",
    caution: 4000,
    description: "السيارة الأكثر شعبية في المغرب. واسعة، تتحمل الطرقات المختلفة، واقتصادية جداً.",
    imageUrl: "https://images.unsplash.com/photo-1559416523-140dd3862b3a?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: "hyundai-tucson-004",
    brand: "Hyundai",
    model: "Tucson",
    year: 2024,
    category: "عائلية SUV",
    pricePerDay: 600,
    engine: "1.6 T-GDI هايبريد",
    transmission: "أوتوماتيكي",
    caution: 10000,
    description: "مريحة جداً للعائلات، مساحة تخزين عملاقة وتقنيات حديثة تضمن لك رحلة آمنة وممتعة.",
    imageUrl: "https://images.unsplash.com/photo-1633493721385-e117180ee611?auto=format&fit=crop&q=80&w=1200"
  }
];
