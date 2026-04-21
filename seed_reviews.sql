-- =====================================================================
-- Seed fake users + random reviews for all approved content.
--
-- Apply via Supabase SQL Editor AFTER seed_content.sql. Idempotent:
--   * fake users are upserted by email (suffix @seed.local)
--   * reviews use (content_id, user_id) uniqueness as skip condition
--
-- Ten fake users get 3–5 random reviews per content item, with ratings
-- weighted towards 4–5 stars (so the app feels alive and friendly).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- 1. FAKE AUTH USERS ----------
-- Minimal insert into auth.users; the handle_new_user trigger auto-creates
-- matching public.profiles rows, pulling name + avatar from raw_user_meta_data.
do $users$
declare
    rec record;
    v_password text := 'seed_password_' || substr(md5(random()::text), 1, 8);
begin
    for rec in
        select * from (values
            ('fake01@seed.local', 'Артём Кузнецов', 'artem'),
            ('fake02@seed.local', 'Мария Орлова', 'maria'),
            ('fake03@seed.local', 'Игорь Петров', 'igor'),
            ('fake04@seed.local', 'Светлана Иванова', 'svetlana'),
            ('fake05@seed.local', 'Дмитрий Соколов', 'dmitri'),
            ('fake06@seed.local', 'Анна Новикова', 'anna'),
            ('fake07@seed.local', 'Алексей Козлов', 'alexey'),
            ('fake08@seed.local', 'Екатерина Смирнова', 'ekaterina'),
            ('fake09@seed.local', 'Павел Лебедев', 'pavel'),
            ('fake10@seed.local', 'Ольга Волкова', 'olga')
        ) as u(email, full_name, seed)
    loop
        if not exists (select 1 from auth.users where email = rec.email) then
            insert into auth.users (
                id, instance_id, email, encrypted_password, email_confirmed_at,
                aud, role, raw_user_meta_data, created_at, updated_at
            )
            values (
                gen_random_uuid(),
                '00000000-0000-0000-0000-000000000000',
                rec.email,
                crypt(v_password, gen_salt('bf')),
                now(),
                'authenticated',
                'authenticated',
                jsonb_build_object(
                    'full_name', rec.full_name,
                    'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || rec.seed
                ),
                now(),
                now()
            );
        end if;
    end loop;
end
$users$;

-- Make sure profile name/avatar reflect our intended seed values
-- (some Supabase installs have a trigger that writes NULL if meta absent).
update public.profiles p
set
    name = m.full_name,
    avatar_url = m.avatar_url
from (
    values
        ('fake01@seed.local', 'Артём Кузнецов', 'https://api.dicebear.com/7.x/avataaars/svg?seed=artem'),
        ('fake02@seed.local', 'Мария Орлова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'),
        ('fake03@seed.local', 'Игорь Петров', 'https://api.dicebear.com/7.x/avataaars/svg?seed=igor'),
        ('fake04@seed.local', 'Светлана Иванова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=svetlana'),
        ('fake05@seed.local', 'Дмитрий Соколов', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dmitri'),
        ('fake06@seed.local', 'Анна Новикова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna'),
        ('fake07@seed.local', 'Алексей Козлов', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexey'),
        ('fake08@seed.local', 'Екатерина Смирнова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ekaterina'),
        ('fake09@seed.local', 'Павел Лебедев', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pavel'),
        ('fake10@seed.local', 'Ольга Волкова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=olga')
) as m(email, full_name, avatar_url)
where p.email = m.email;

-- ---------- 2. RANDOM REVIEWS ----------
do $reviews$
declare
    r_content   record;
    v_user_list uuid[];
    v_user_id   uuid;
    v_rating    int;
    v_text      text;
    v_rand      double precision;
    v_count     int;
    v_reviews_per_content int := 4;

    -- Canned review texts, per rating level.
    texts_5 text[] := array[
        'Невероятная вещь. Держит от первой до последней страницы — именно тот случай, когда жаль, что закончилось. Буду перечитывать.',
        'Это восторг. Редко бывает, чтобы образы и атмосфера работали так синхронно. Топ без вопросов.',
        'Честная десятка. Тонко, умно, пронзительно. Рекомендую всем без исключения.',
        'Лучшее, что попадалось за последние годы. Сильный характер главного героя, выверенная композиция — ни одной лишней сцены.',
        'Абсолютный шедевр. Никаких скидок на эпоху, никаких оговорок — просто отличная работа мастера.'
    ];
    texts_4 text[] := array[
        'Очень хорошо. Есть пара моментов, где чувствуется провисание, но в целом затягивает и не отпускает.',
        'Сильная штука. Не идеал, но цепляет — после финала ещё долго думаешь о персонажах.',
        'Понравилось. Автор хорошо держит ритм, диалоги живые, финал честный. С удовольствием дочитал.',
        'Твёрдые четыре звезды. Местами хочется придраться к темпу, но общее впечатление светлое.',
        'Достойная работа. Не идеально отточено, но эмоционально попадает в цель.'
    ];
    texts_3 text[] := array[
        'Середина. Есть и сильные моменты, и откровенно проходные. Один раз посмотреть можно, но перечитывать вряд ли буду.',
        'Нормально. Ожидал большего, но время потратил без сожаления. Кому-то зайдёт больше, чем мне.',
        'На один раз. Сюжет предсказуемый, но оформление приятное. Крепкий середняк.',
        'Половина книги отличная, половина — скучная. Странный баланс, не знаю кому рекомендовать.',
        'Ни рыба ни мясо. Хорошая задумка, не очень убедительное исполнение.'
    ];
    texts_2 text[] := array[
        'Не зашло. Герои картонные, конфликт надуманный. Дочитал через силу.',
        'Слабо. Идея есть, исполнение хромает на обе ноги. Жаль потраченного времени.',
        'Разочарование. Ожидал от автора большего — вышло вторично и поверхностно.',
        'Мимо. Слишком затянуто, слишком пафосно, эмоциональной отдачи ноль.',
        'Очень средне. Хорошо только начало, дальше буксует.'
    ];
    texts_1 text[] := array[
        'Пустая трата времени. Не могу найти ничего, что бы хвалить — ни сюжета, ни языка.',
        'Откровенно плохо. Бросил на середине, возвращаться не собираюсь.',
        'Худшее, что читал за год. Искусственные эмоции и штампы — всё, что здесь есть.',
        'Мучение от начала до конца. Обещали глубину, получили болото.',
        'Категорически не советую. Ни одной живой мысли, ни одного живого персонажа.'
    ];
begin
    -- Collect fake user ids (by email suffix).
    select array_agg(id) into v_user_list
    from public.profiles
    where email like '%@seed.local';

    if v_user_list is null or array_length(v_user_list, 1) < 2 then
        raise notice 'Нет фейковых пользователей — сначала выполните верхний блок DO $users$.';
        return;
    end if;

    -- For each approved content: vary reviews count 3..5, pick random users
    -- and random weighted ratings.
    for r_content in (
        select id from public.content where status = 'approved'
    ) loop
        v_count := 3 + floor(random() * 3)::int;  -- 3..5

        for i in 1..v_count loop
            -- Random user without replacement not critical here; collisions
            -- are skipped by the (content_id, user_id) uniqueness check below.
            v_user_id := v_user_list[1 + floor(random() * array_length(v_user_list, 1))::int];

            -- Weighted rating: 35% → 5, 30% → 4, 20% → 3, 10% → 2, 5% → 1.
            v_rand := random();
            if v_rand < 0.35 then
                v_rating := 5;
                v_text := texts_5[1 + floor(random() * array_length(texts_5, 1))::int];
            elsif v_rand < 0.65 then
                v_rating := 4;
                v_text := texts_4[1 + floor(random() * array_length(texts_4, 1))::int];
            elsif v_rand < 0.85 then
                v_rating := 3;
                v_text := texts_3[1 + floor(random() * array_length(texts_3, 1))::int];
            elsif v_rand < 0.95 then
                v_rating := 2;
                v_text := texts_2[1 + floor(random() * array_length(texts_2, 1))::int];
            else
                v_rating := 1;
                v_text := texts_1[1 + floor(random() * array_length(texts_1, 1))::int];
            end if;

            -- Skip if this user already reviewed this content (uniqueness).
            insert into public.reviews (content_id, user_id, text, rating, created_at)
            select r_content.id,
                   v_user_id,
                   v_text,
                   v_rating,
                   now() - (floor(random() * 40) || ' days')::interval
            where not exists (
                select 1 from public.reviews
                where content_id = r_content.id and user_id = v_user_id
            );
        end loop;
    end loop;
end
$reviews$;

-- Sync reviewer stats for fake users so their profiles show review counts.
update public.profiles p
set stats = jsonb_set(
    coalesce(p.stats, '{}'::jsonb),
    '{reviews}',
    to_jsonb((select count(*) from public.reviews r where r.user_id = p.id))
)
where p.email like '%@seed.local';

-- Quick check:
-- select c.title, count(r.id) as reviews, round(avg(r.rating)::numeric, 2) as avg_rating
--   from public.content c
--   left join public.reviews r on r.content_id = c.id
--   where c.status = 'approved'
--   group by c.id, c.title
--   order by reviews desc;
