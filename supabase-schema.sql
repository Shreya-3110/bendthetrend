-- ==============================================================================
-- BEND THE TREND — PORTFOLIO CMS DATABASE SCHEMA & POLICIES
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Portfolio Projects Table
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    client TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT,
    description TEXT NOT NULL,
    detailed_description TEXT,
    thumbnail_url TEXT,
    media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('video', 'gallery', 'image')),
    media_url TEXT,
    performance_badge TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    published BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_portfolio_published_order ON public.portfolio_projects(published, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON public.portfolio_projects(category);

-- 4. Create Portfolio Media Table (for Multi-Image Galleries and attachments)
CREATE TABLE IF NOT EXISTS public.portfolio_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.portfolio_projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_project_order ON public.portfolio_media(project_id, sort_order ASC);

-- 5. Auto-update `updated_at` Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.portfolio_projects;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.portfolio_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Storage Bucket for Portfolio Media
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
    ON public.categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Portfolio Projects RLS Policies
DROP POLICY IF EXISTS "Public can view published projects" ON public.portfolio_projects;
CREATE POLICY "Public can view published projects"
    ON public.portfolio_projects FOR SELECT
    USING (published = true);

DROP POLICY IF EXISTS "Admins can view all projects" ON public.portfolio_projects;
CREATE POLICY "Admins can view all projects"
    ON public.portfolio_projects FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can insert projects" ON public.portfolio_projects;
CREATE POLICY "Admins can insert projects"
    ON public.portfolio_projects FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update projects" ON public.portfolio_projects;
CREATE POLICY "Admins can update projects"
    ON public.portfolio_projects FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete projects" ON public.portfolio_projects;
CREATE POLICY "Admins can delete projects"
    ON public.portfolio_projects FOR DELETE
    TO authenticated
    USING (true);

-- Portfolio Media RLS Policies
DROP POLICY IF EXISTS "Public can view published project media" ON public.portfolio_media;
CREATE POLICY "Public can view published project media"
    ON public.portfolio_media FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.portfolio_projects
            WHERE public.portfolio_projects.id = public.portfolio_media.project_id
            AND public.portfolio_projects.published = true
        )
    );

DROP POLICY IF EXISTS "Admins can manage project media" ON public.portfolio_media;
CREATE POLICY "Admins can manage project media"
    ON public.portfolio_media FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Storage Objects RLS Policies
DROP POLICY IF EXISTS "Public can read portfolio media files" ON storage.objects;
CREATE POLICY "Public can read portfolio media files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio-media');

DROP POLICY IF EXISTS "Admins can upload portfolio media files" ON storage.objects;
CREATE POLICY "Admins can upload portfolio media files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'portfolio-media');

DROP POLICY IF EXISTS "Admins can update portfolio media files" ON storage.objects;
CREATE POLICY "Admins can update portfolio media files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'portfolio-media');

DROP POLICY IF EXISTS "Admins can delete portfolio media files" ON storage.objects;
CREATE POLICY "Admins can delete portfolio media files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'portfolio-media');

-- ==============================================================================
-- SEED INITIAL CATEGORIES
-- ==============================================================================
INSERT INTO public.categories (id, name, sort_order) VALUES
('video', 'Reels & Video', 1),
('branding', 'Branding & Web', 2),
('social', 'Social Campaigns', 3),
('ads', 'Performance Ads', 4),
('healthcare', 'Healthcare & Dental', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ==============================================================================
-- SEED EXISTING PORTFOLIO PROJECTS
-- ==============================================================================
INSERT INTO public.portfolio_projects 
(id, title, client, slug, category, category_label, description, detailed_description, thumbnail_url, media_type, media_url, performance_badge, featured, published, sort_order)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Royal Heritage Collection',
    'MG Jewellers',
    'mg-jewellers-royal-heritage',
    'branding',
    'Jewelry & Luxury',
    'Complete digital campaign, luxury brand positioning & high-converting social strategy.',
    'Luxury gold & diamond jewelry showcase campaign engineered to elevate brand positioning and drive high-intent showroom visits.',
    'assets/mg_jewellers.jpg',
    'video',
    'assets/MG1.mp4',
    '+320% ROI',
    true,
    true,
    1
),
(
    '22222222-2222-2222-2222-222222222222',
    'Living Room Comfort',
    'The Indian Sofa Company',
    'the-indian-sofa-company-comfort',
    'social',
    'Home & Living',
    'Premium e-commerce web design, performance ads & social media growth driving multi-fold orders.',
    'Dynamic home makeover and premium sofa showcase reel driving 4.5x ROAS across Meta and digital ad channels.',
    'assets/indian_sofa_company.jpg',
    'video',
    'assets/TheSOFA.MP4',
    '4.5x ROAS',
    true,
    true,
    2
),
(
    '33333333-3333-3333-3333-333333333333',
    'Diamond Sparkle & Craft',
    'MG Jewellers',
    'mg-jewellers-diamond-sparkle',
    'video',
    'Reels & Video',
    'Viral Instagram Reel campaign featuring dynamic cuts, sparkle grading, and high customer engagement.',
    'Intricate jewelry craftsmanship showcasing certified diamonds and fine gold artistry.',
    '',
    'video',
    'assets/MG2.mp4',
    '1.4M Views',
    false,
    true,
    3
),
(
    '44444444-4444-4444-4444-444444444444',
    'Craft & Fabric Spotlight',
    'The Sofa Company',
    'the-sofa-company-craft-spotlight',
    'ads',
    'Performance Ads',
    'Meta paid ad campaign driving multi-fold return on ad spend with customer lifestyle hooks.',
    'Meta and TikTok paid ad campaign driving 4.8x return on ad spend with custom visual hooks.',
    '',
    'video',
    'assets/TheSOFA2.MP4',
    '4.8x ROAS',
    false,
    true,
    4
),
(
    '55555555-5555-5555-5555-555555555555',
    'Luxury Bridal Showcase',
    'MG Jewellers',
    'mg-jewellers-bridal-showcase',
    'video',
    'Reels & Video',
    'Cinematic short-form video edit highlighting bridal luxury, craft, and motion storytelling.',
    'Aesthetic jewelry showcase reel with macro shots and color grading.',
    '',
    'video',
    'assets/MG3.mp4',
    '850k Reach',
    false,
    true,
    5
),
(
    '66666666-6666-6666-6666-666666666666',
    'Pulse Fitness Rebrand',
    'Pulse Fitness',
    'pulse-fitness-rebrand',
    'branding',
    'Branding + Web',
    'Bold neo-brutalist gym website build and brand identity system resulting in a 3x surge in memberships.',
    'Comprehensive brand overhaul and web development delivering outstanding conversion rates and community growth.',
    'assets/img_25.png',
    'image',
    'assets/img_25.png',
    '3x Signups',
    false,
    true,
    6
),
(
    '77777777-7777-7777-7777-777777777777',
    'Brand & Social Campaigns',
    'Arihant Dental Care',
    'arihant-dental-care-campaigns',
    'social',
    'Healthcare & Social',
    'Complete healthcare social media strategy, 3D educational creatives & pediatric clinic ad campaigns driving +380% patient bookings.',
    'Multi-slide creative showcase demonstrating pediatric dentistry care, clinic tour, and client education.',
    'assets/Arihant Dental care/photo_2026-08-21_19-29-23.jpg',
    'gallery',
    'assets/Arihant Dental care/photo_2026-08-21_19-29-23.jpg',
    '+380% Bookings',
    false,
    true,
    7
)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    client = EXCLUDED.client,
    category = EXCLUDED.category,
    category_label = EXCLUDED.category_label,
    description = EXCLUDED.description,
    detailed_description = EXCLUDED.detailed_description,
    thumbnail_url = EXCLUDED.thumbnail_url,
    media_type = EXCLUDED.media_type,
    media_url = EXCLUDED.media_url,
    performance_badge = EXCLUDED.performance_badge,
    featured = EXCLUDED.featured,
    published = EXCLUDED.published,
    sort_order = EXCLUDED.sort_order;

-- Seed Gallery Media for Arihant Dental Care
INSERT INTO public.portfolio_media (project_id, type, url, sort_order) VALUES
('77777777-7777-7777-7777-777777777777', 'image', 'assets/Arihant Dental care/photo_2026-08-21_19-29-23.jpg', 1),
('77777777-7777-7777-7777-777777777777', 'image', 'assets/Arihant Dental care/photo_2026-08-21_19-29-24.jpg', 2),
('77777777-7777-7777-7777-777777777777', 'image', 'assets/Arihant Dental care/photo_2026-08-21_19-29-25.jpg', 3)
ON CONFLICT DO NOTHING;
