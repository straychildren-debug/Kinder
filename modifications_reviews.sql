-- 1. Create review_ratings table (оценки 1-5 для самих рецензий)
CREATE TABLE public.review_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review ratings are viewable by everyone" ON public.review_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own review rating" ON public.review_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their review rating" ON public.review_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their review rating" ON public.review_ratings FOR DELETE USING (auth.uid() = user_id);


-- 2. Create review_comments table (для комментариев к рецензиям)
CREATE TABLE public.review_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review comments are viewable by everyone" ON public.review_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own review comment" ON public.review_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their review comment" ON public.review_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their review comment" ON public.review_comments FOR DELETE USING (auth.uid() = user_id);


-- 3. Drop the existing rating constraint from reviews if it exists, to ensure it allows 1-5
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);

-- 4. Trigger for recalculating content metrics based on 1-5 rating
-- When a review is added/updated/deleted, recalculate the average rating and review count
CREATE OR REPLACE FUNCTION update_content_metrics()
RETURNS trigger AS $$
DECLARE
    v_content_id UUID;
    v_avg_rating NUMERIC;
    v_review_count BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_content_id := OLD.content_id;
    ELSE
        v_content_id := NEW.content_id;
    END IF;

    -- Calculate exact average and round to 1 decimal, e.g., 4.5
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0), COUNT(id)
    INTO v_avg_rating, v_review_count
    FROM public.reviews
    WHERE content_id = v_content_id;

    -- Update content metadata
    UPDATE public.content
    SET metadata = jsonb_set(
        jsonb_set(COALESCE(metadata, '{}'::jsonb), '{rating}', to_jsonb(v_avg_rating)),
        '{reviewCount}', to_jsonb(v_review_count)
    )
    WHERE id = v_content_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;

CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OF rating OR DELETE ON public.reviews
FOR EACH ROW EXECUTE PROCEDURE update_content_metrics();


-- 5. Trigger for recalculating average rating for a review
CREATE OR REPLACE FUNCTION update_review_rating()
RETURNS trigger AS $$
DECLARE
    v_review_id UUID;
    v_avg_rating NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_review_id := OLD.review_id;
    ELSE
        v_review_id := NEW.review_id;
    END IF;

    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0)
    INTO v_avg_rating
    FROM public.review_ratings
    WHERE review_id = v_review_id;

    -- We'll use the 'likes' column to store the calculated average rating of the review, 
    -- as we don't have a separate avg_rating field on the reviews table yet, 
    -- OR we can add a new column 'avg_rating' to reviews.
    -- Let's just calculate it dynamically in the UI instead of a trigger to avoid adding columns if not absolutely necessary.
    -- Wait, the ui needs to show it. Dynamically calculating is fine if we return it in a view.
    -- But since we are here, let's add `avg_rating` column to `reviews`.
    -- Actually, I will omit this trigger and just fetch it in the JS code by joining.
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
