-- 1. Create Profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    stats JSONB DEFAULT '{"publications": 0, "reviews": 0, "avgRating": 0, "followers": 0, "awards": 0}'::jsonb,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect profiles table with RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile."
ON public.profiles FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin')
);

-- 2. Create trigger to automatically insert a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Create Content table
CREATE TABLE public.content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('movie', 'book')),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- Used for varying fields: author, pages, publisher, director, actors, year, genre, duration, rating, etc.
);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Everyone can view approved content
CREATE POLICY "Approved content is viewable by everyone"
ON public.content FOR SELECT USING (status = 'approved');

-- Users can view pending/rejected content if they created it
CREATE POLICY "Users can view their own pending or rejected content"
ON public.content FOR SELECT USING (auth.uid() = created_by);

-- Moderators and admins can view all content
CREATE POLICY "Moderators can view all content"
ON public.content FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('moderator', 'admin')
);

-- Authenticated users can insert content
CREATE POLICY "Users can create content"
ON public.content FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Moderators and admins can update content (e.g., to approve/reject)
CREATE POLICY "Moderators can update content"
ON public.content FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('moderator', 'admin')
);


-- 4. Create Reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT USING (true);

-- Users can insert their own review
CREATE POLICY "Users can create a review"
ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own review
CREATE POLICY "Users can update their review"
ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their review"
ON public.reviews FOR DELETE USING (auth.uid() = user_id);



