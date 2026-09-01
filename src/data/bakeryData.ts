import { Product, Collection, FaqItem, HowToOrderStep } from '../types';

import heroShowcaseImg from '../assets/images/hero_bakery_showcase_1786552842637.jpg';
import artisanBreadsImg from '../assets/images/melon_bread_collection_1786868278310.jpg';
import cakesPastriesImg from '../assets/images/cheese_tarts_collection_1786868263711.jpg';
import bestsellersImg from '../assets/images/japanese_cheesecake_collection_1786868290572.jpg';
import specialtiesSnacksImg from '../assets/images/bestsellers_collection_1786552886020.jpg';
export const HERO_ASSETS = {
  heroShowcase: heroShowcaseImg,
  artisanBreads: artisanBreadsImg,
  cakesPastries: cakesPastriesImg,
  bestsellers: bestsellersImg,
  specialtiesSnacks: specialtiesSnacksImg,
};

export const BRAND_LOGO = {
  src: 'https://lh3.googleusercontent.com/d/1iWB5MBI26tbJosxFIqkAX6Xuvuvqgqdc',
  fallbackSrc: 'https://drive.google.com/uc?export=view&id=1iWB5MBI26tbJosxFIqkAX6Xuvuvqgqdc',
  alt: "Shey's Bakery Logo",
};

export const ADMIN_BRAND_LOGO = {
  src: 'https://lh3.googleusercontent.com/d/15LptUAytDlbSMYquXcZe0j4FPWxSIJed',
  fallbackSrc: 'https://drive.google.com/thumbnail?id=15LptUAytDlbSMYquXcZe0j4FPWxSIJed&sz=w1000',
  ucSrc: 'https://drive.google.com/uc?export=view&id=15LptUAytDlbSMYquXcZe0j4FPWxSIJed',
  alt: "Shey's Bakery Admin Logo",
};

export const PRODUCTS: Product[] = [];

export const COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    title: 'Pies & Tarts',
    subtitle: 'Decadent hand-crafted celebration pies, cakes, and tarts.',
    image: 'https://lh3.googleusercontent.com/d/1ztFnTaJOG0_6Lk9JeS9P_Rkk2I6qBr_N',
    categoryFilter: 'Pies & Tarts',
  },
  {
    id: 'col-2',
    title: 'Breads',
    subtitle: 'Slow-fermented sourdoughs, focaccia, and crusty baguettes.',
    image: 'https://lh3.googleusercontent.com/d/1_mFbT9hi65eOnEgqbfrkqcVBtlaQWG3p',
    categoryFilter: 'Breads',
  },
  {
    id: 'col-3',
    title: 'Pastries',
    subtitle: 'Flaky croissants, sweet brioches, and golden oven treats.',
    image: 'https://lh3.googleusercontent.com/d/1nPz1x_k20T2an4tGUtjnnVnGIMA_QYse',
    categoryFilter: 'Pastries',
  },
  {
    id: 'col-4',
    title: 'Specialties & Snacks',
    subtitle: 'Savory bites, buttery garlic knots, cookies, and tea treats.',
    image: 'https://lh3.googleusercontent.com/d/1D5bjrliO98Nx8eH212Ghrxf-M6usf1X4',
    categoryFilter: 'Specialties & Snacks',
  },
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How many days before I get my order?',
    answer: 'We have a 1 day lead time with 1pm cut-off (excluding Sundays and Holidays). Alternatively, you may select your preferred delivery date in the cart page before checking out.',
  },
  {
    id: 'faq-2',
    question: 'How can I pay for my order?',
    answer: 'We accept payments via GCash, Maya, Bank Transfer (BDO, BPI, UnionBank), and Credit/Debit Cards (Visa, Mastercard). For store pickups, cash payment is also accepted.',
  },
  {
    id: 'faq-3',
    question: "What's the shelf life of your items?",
    answer: 'Our artisanal breads and sourdough loaves stay fresh at room temperature for 3 days or up to 2 weeks sliced in the freezer. Pastries and croissants are best enjoyed on the day of delivery, while cheesecakes and chilled cakes should be kept refrigerated and consumed within 3 to 5 days.',
  },
  {
    id: 'faq-4',
    question: 'Can I be the one to arrange for pick up?',
    answer: 'Yes, absolutely! You can choose store pickup during checkout and arrange third-party couriers like Grab Express or Lalamove to pick up your freshly packed treats from our bakery hub.',
  },
  {
    id: 'faq-5',
    question: 'Do you deliver on Sundays and Holidays?',
    answer: 'We accept pre-orders in advance for weekend events and holiday celebrations! Please select your target date during checkout so our bakers can prepare your batch accordingly.',
  },
];

export const HOW_TO_ORDER_STEPS: HowToOrderStep[] = [
  {
    step: 1,
    title: 'Select Your Baked Treats',
    description: 'Browse our fresh daily menu of sourdough, French pastries, and handcrafted cakes. Click "Add to Cart".',
    iconName: 'ShoppingBag',
  },
  {
    step: 2,
    title: 'Choose Delivery or Pickup',
    description: 'Select your preferred date & time slot. Specify whether you want store pickup or doorstep delivery.',
    iconName: 'Truck',
  },
  {
    step: 3,
    title: 'Secure Payment',
    description: 'Pay conveniently using GCash, Maya, Credit Card, or Bank Transfer. Instant order confirmation sent via SMS/Email.',
    iconName: 'CreditCard',
  },
  {
    step: 4,
    title: 'Freshly Baked & Handed to You',
    description: 'Our master bakers prepare your order fresh from the oven, packed warmly in eco-friendly artisan boxes.',
    iconName: 'Smile',
  },
];
