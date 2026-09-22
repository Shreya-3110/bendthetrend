import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof window !== 'undefined' && window.__BTT_SUPABASE_URL) || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof window !== 'undefined' && window.__BTT_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id'));
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Built-in curated seed brands
export const SEED_BRANDS = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    name: 'MG Jewellers',
    slug: 'mg-jewellers',
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    name: 'The Sofa Company',
    slug: 'the-sofa-company',
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    name: 'Arihant Dental Care',
    slug: 'arihant-dental-care',
    sort_order: 3,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    name: 'Pulse Fitness',
    slug: 'pulse-fitness',
    sort_order: 4,
    created_at: '2026-01-01T00:00:00Z'
  }
];

// Built-in curated seed projects fallback when offline or unconfigured
export const SEED_PROJECTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    brand_id: 'b1111111-1111-1111-1111-111111111111',
    title: 'Royal Heritage Collection',
    client: 'MG Jewellers',
    slug: 'mg-jewellers-royal-heritage',
    category: 'branding',
    category_label: 'Jewelry & Luxury',
    description: 'Complete digital campaign, luxury brand positioning & high-converting social strategy.',
    detailed_description: 'Luxury gold & diamond jewelry showcase campaign engineered to elevate brand positioning and drive high-intent showroom visits.',
    thumbnail_url: '/assets/mg_jewellers.jpg',
    media_type: 'video',
    media_url: '/assets/MG1.mp4',
    performance_badge: '+320% ROI',
    featured: true,
    published: true,
    sort_order: 1
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    brand_id: 'b2222222-2222-2222-2222-222222222222',
    title: 'Living Room Comfort',
    client: 'The Sofa Company',
    slug: 'the-sofa-company-comfort',
    category: 'social',
    category_label: 'Home & Living',
    description: 'Premium e-commerce web design, performance ads & social media growth driving multi-fold orders.',
    detailed_description: 'Dynamic home makeover and premium sofa showcase reel driving 4.5x ROAS across Meta and digital ad channels.',
    thumbnail_url: '/assets/indian_sofa_company.jpg',
    media_type: 'video',
    media_url: '/assets/TheSOFA.MP4',
    performance_badge: '4.5x ROAS',
    featured: true,
    published: true,
    sort_order: 2
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    brand_id: 'b1111111-1111-1111-1111-111111111111',
    title: 'Diamond Sparkle & Craft',
    client: 'MG Jewellers',
    slug: 'mg-jewellers-diamond-sparkle',
    category: 'video',
    category_label: 'Reels & Video',
    description: 'Viral Instagram Reel campaign featuring dynamic cuts, sparkle grading, and high customer engagement.',
    detailed_description: 'Intricate jewelry craftsmanship showcasing certified diamonds and fine gold artistry.',
    thumbnail_url: '/assets/mg_jewellers.jpg',
    media_type: 'video',
    media_url: '/assets/MG2.mp4',
    performance_badge: '1.4M Views',
    featured: false,
    published: true,
    sort_order: 3
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    brand_id: 'b2222222-2222-2222-2222-222222222222',
    title: 'Craft & Fabric Spotlight',
    client: 'The Sofa Company',
    slug: 'the-sofa-company-craft-spotlight',
    category: 'ads',
    category_label: 'Performance Ads',
    description: 'Meta paid ad campaign driving multi-fold return on ad spend with customer lifestyle hooks.',
    detailed_description: 'Meta and TikTok paid ad campaign driving 4.8x return on ad spend with custom visual hooks.',
    thumbnail_url: '/assets/indian_sofa_company.jpg',
    media_type: 'video',
    media_url: '/assets/TheSOFA2.MP4',
    performance_badge: '4.8x ROAS',
    featured: false,
    published: true,
    sort_order: 4
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    brand_id: 'b1111111-1111-1111-1111-111111111111',
    title: 'Luxury Bridal Showcase',
    client: 'MG Jewellers',
    slug: 'mg-jewellers-bridal-showcase',
    category: 'video',
    category_label: 'Reels & Video',
    description: 'Cinematic short-form video edit highlighting bridal luxury, craft, and motion storytelling.',
    detailed_description: 'Aesthetic jewelry showcase reel with macro shots and color grading.',
    thumbnail_url: '/assets/mg_jewellers.jpg',
    media_type: 'video',
    media_url: '/assets/MG3.mp4',
    performance_badge: '850k Reach',
    featured: false,
    published: true,
    sort_order: 5
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    brand_id: 'b4444444-4444-4444-4444-444444444444',
    title: 'Pulse Fitness Rebrand',
    client: 'Pulse Fitness',
    slug: 'pulse-fitness-rebrand',
    category: 'branding',
    category_label: 'Branding + Web',
    description: 'Bold neo-brutalist gym website build and brand identity system resulting in a 3x surge in memberships.',
    detailed_description: 'Comprehensive brand overhaul and web development delivering outstanding conversion rates and community growth.',
    thumbnail_url: '/assets/img_25.png',
    media_type: 'image',
    media_url: '/assets/img_25.png',
    performance_badge: '3x Signups',
    featured: false,
    published: true,
    sort_order: 6
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    brand_id: 'b3333333-3333-3333-3333-333333333333',
    title: 'Brand & Social Campaigns',
    client: 'Arihant Dental Care',
    slug: 'arihant-dental-care-campaigns',
    category: 'social',
    category_label: 'Healthcare & Social',
    description: 'Complete healthcare social media strategy, 3D educational creatives & pediatric clinic ad campaigns driving +380% patient bookings.',
    detailed_description: 'Multi-slide creative showcase demonstrating pediatric dentistry care, clinic tour, and client education.',
    thumbnail_url: '/assets/Arihant Dental care/photo_2026-08-21_19-29-23.jpg',
    media_type: 'gallery',
    media_url: '/assets/Arihant Dental care/photo_2026-08-21_19-29-23.jpg',
    performance_badge: '+380% Bookings',
    featured: false,
    published: true,
    sort_order: 7,
    gallery: [
      { url: '/assets/Arihant Dental care/photo_2026-08-21_19-29-23.jpg' },
      { url: '/assets/Arihant Dental care/photo_2026-08-21_19-29-24.jpg' },
      { url: '/assets/Arihant Dental care/photo_2026-08-21_19-29-25.jpg' }
    ]
  }
];
