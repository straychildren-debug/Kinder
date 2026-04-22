-- =====================================================================
-- Seed content — 20 books + 40 movies (titles/authors in Russian)
--
-- Applies via Supabase SQL Editor. Idempotent: skips rows whose title
-- already exists. Uses the first available admin/superadmin/moderator
-- as created_by.
--
-- Covers:
--   - Books       → OpenLibrary (covers.openlibrary.org) + Wikimedia Commons
--   - Film posters → upload.wikimedia.org (English / Russian Wikipedia)
-- =====================================================================

do $seed$
declare
    v_admin uuid;
begin
    -- Pick a content owner: prefer superadmin → admin → moderator → any profile.
    select id into v_admin
    from public.profiles
    where role in ('superadmin', 'admin', 'moderator')
    order by
        case role
            when 'superadmin' then 1
            when 'admin' then 2
            when 'moderator' then 3
            else 4
        end,
        joined_at asc nulls last
    limit 1;

    if v_admin is null then
        select id into v_admin from public.profiles order by joined_at asc nulls last limit 1;
    end if;

    if v_admin is null then
        raise exception 'Нельзя засеять контент: в таблице profiles нет ни одного пользователя.';
    end if;

    -- ---------- BOOKS (20) ----------
    insert into public.content (type, title, description, image_url, status, created_by, metadata)
    select t.type, t.title, t.description, t.image_url, t.status, v_admin, t.metadata
    from (values
        (
            'book'::text,
            'Мастер и Маргарита',
            'Роман Михаила Булгакова, над которым автор работал последние двенадцать лет жизни. Три сюжетные линии — сатирическая московская, библейская ершалаимская и мистическая свита Воланда — сходятся в размышлении о трусости, любви и свободе.',
            'https://covers.openlibrary.org/b/id/15013644-L.jpg',
            'approved',
            jsonb_build_object('author', 'Михаил Булгаков', 'year', 1967, 'pages', 480, 'genre', 'Современная русская классика')
        ),
        (
            'book'::text,
            'Преступление и наказание',
            'Петербургский студент Родион Раскольников совершает убийство старухи-процентщицы, чтобы проверить теорию о «праве сильного». Достоевский превращает детективную канву в глубочайшее исследование совести и вины.',
            'https://covers.openlibrary.org/b/id/13116014-L.jpg',
            'approved',
            jsonb_build_object('author', 'Фёдор Достоевский', 'year', 1866, 'pages', 672, 'genre', 'Русская классика')
        ),
        (
            'book'::text,
            'Война и мир',
            'Эпопея Льва Толстого о русском обществе в эпоху Наполеоновских войн. Судьбы Болконских, Ростовых, Безухова переплетаются с историей Отечественной войны 1812 года.',
            'https://covers.openlibrary.org/b/id/12621906-L.jpg',
            'approved',
            jsonb_build_object('author', 'Лев Толстой', 'year', 1869, 'pages', 1300, 'genre', 'Исторический роман')
        ),
        (
            'book'::text,
            '1984',
            'Антиутопия Джорджа Оруэлла о государстве тотальной слежки, где Партия контролирует прошлое, настоящее и даже мысли граждан. Уинстон Смит пытается сохранить личность в мире новояза и двоемыслия.',
            'https://covers.openlibrary.org/b/id/9267242-L.jpg',
            'approved',
            jsonb_build_object('author', 'Джордж Оруэлл', 'year', 1949, 'pages', 328, 'genre', 'Антиутопия')
        ),
        (
            'book'::text,
            'Сто лет одиночества',
            'Хроника семи поколений семьи Буэндиа в вымышленном городке Макондо. Главный образец магического реализма: реальное и мифическое сплетаются в портрет Латинской Америки XX века.',
            'https://covers.openlibrary.org/b/id/15093420-L.jpg',
            'approved',
            jsonb_build_object('author', 'Габриэль Гарсиа Маркес', 'year', 1967, 'pages', 448, 'genre', 'Магический реализм')
        ),
        (
            'book'::text,
            'Великий Гэтсби',
            'История загадочного миллионера Джея Гэтсби, его любви к Дэзи Бьюкенен и краха американской мечты в ревущих двадцатых. Классика американской литературы XX века.',
            'https://covers.openlibrary.org/b/id/10590366-L.jpg',
            'approved',
            jsonb_build_object('author', 'Фрэнсис Скотт Фицджеральд', 'year', 1925, 'pages', 224, 'genre', 'Американская классика')
        ),
        (
            'book'::text,
            'Убить пересмешника',
            'Алабама тридцатых годов глазами девочки Глазастика. Её отец, адвокат Аттикус Финч, берётся защищать чернокожего, обвинённого в преступлении, которого не совершал.',
            'https://covers.openlibrary.org/b/id/14351077-L.jpg',
            'approved',
            jsonb_build_object('author', 'Харпер Ли', 'year', 1960, 'pages', 384, 'genre', 'Социальная драма')
        ),
        (
            'book'::text,
            'Норвежский лес',
            'Роман Харуки Мураками о студенте Тору Ватанабэ, двух женщинах в его жизни и травмах юности в Токио конца шестидесятых. Меланхоличная проза взросления под звуки The Beatles.',
            'https://covers.openlibrary.org/b/id/2237620-L.jpg',
            'approved',
            jsonb_build_object('author', 'Харуки Мураками', 'year', 1987, 'pages', 360, 'genre', 'Современная проза')
        ),
        (
            'book'::text,
            'Мы',
            'Первая в истории антиутопия. Евгений Замятин показывает тоталитарное Единое Государство XXX века, где люди — «нумера», а свобода объявлена несчастьем.',
            'https://upload.wikimedia.org/wikipedia/commons/6/67/Weyevgenyzamyatin.png',
            'approved',
            jsonb_build_object('author', 'Евгений Замятин', 'year', 1920, 'pages', 240, 'genre', 'Антиутопия')
        ),
        (
            'book'::text,
            'Гарри Поттер и философский камень',
            'Сирота Гарри в день одиннадцатилетия узнаёт, что он волшебник, и отправляется в школу Хогвартс. Первая книга всемирной саги Джоан Роулинг.',
            'https://covers.openlibrary.org/b/id/15155833-L.jpg',
            'approved',
            jsonb_build_object('author', 'Джоан Роулинг', 'year', 1997, 'pages', 352, 'genre', 'Фэнтези')
        ),
        (
            'book'::text,
            'Анна Каренина',
            'Трагедия светской женщины, которая ради любви бросила вызов общественной морали Петербурга. Параллельная линия — семейная идиллия Кити и Лёвина — уравновешивает разрушение.',
            'https://covers.openlibrary.org/b/id/2560652-L.jpg',
            'approved',
            jsonb_build_object('author', 'Лев Толстой', 'year', 1877, 'pages', 864, 'genre', 'Русская классика')
        ),
        (
            'book'::text,
            'Евгений Онегин',
            'Роман в стихах, энциклопедия русской жизни. Онегин, Татьяна, Ленский и Ольга проходят путь от юности к расплате за упущенные чувства.',
            'https://covers.openlibrary.org/b/id/11365660-L.jpg',
            'approved',
            jsonb_build_object('author', 'Александр Пушкин', 'year', 1833, 'pages', 256, 'genre', 'Роман в стихах')
        ),
        (
            'book'::text,
            'Идиот',
            'Князь Мышкин возвращается в Россию, чтобы столкнуться с блистательным и жестоким светом Петербурга. Достоевский выводит в нём идеал «положительно прекрасного человека».',
            'https://covers.openlibrary.org/b/id/10249475-L.jpg',
            'approved',
            jsonb_build_object('author', 'Фёдор Достоевский', 'year', 1869, 'pages', 640, 'genre', 'Русская классика')
        ),
        (
            'book'::text,
            'Тихий Дон',
            'Эпос Михаила Шолохова о донском казачестве в годы Первой мировой, революции и гражданской войны. История Григория Мелехова — человека, разорванного эпохой.',
            'https://covers.openlibrary.org/b/id/298085-L.jpg',
            'approved',
            jsonb_build_object('author', 'Михаил Шолохов', 'year', 1940, 'pages', 1536, 'genre', 'Эпический роман')
        ),
        (
            'book'::text,
            'Старик и море',
            'Старый кубинский рыбак Сантьяго выходит в море и восемьдесят четыре дня не ловит ничего. А потом наступает схватка его жизни. Нобелевская повесть Хемингуэя.',
            'https://covers.openlibrary.org/b/id/463307-L.jpg',
            'approved',
            jsonb_build_object('author', 'Эрнест Хемингуэй', 'year', 1952, 'pages', 128, 'genre', 'Повесть')
        ),
        (
            'book'::text,
            'Над пропастью во ржи',
            'Голдену Колфилду шестнадцать, его выгнали из третьей школы, и он бродит по Нью-Йорку, рассказывая нам о лицемерии взрослых. Голос поколения от Джерома Сэлинджера.',
            'https://covers.openlibrary.org/b/id/9273490-L.jpg',
            'approved',
            jsonb_build_object('author', 'Джером Сэлинджер', 'year', 1951, 'pages', 272, 'genre', 'Современная проза')
        ),
        (
            'book'::text,
            'Маленький принц',
            'Лётчик терпит аварию в Сахаре и встречает мальчика с далёкой планеты. Философская сказка Антуана де Сент-Экзюпери для детей и взрослых.',
            'https://covers.openlibrary.org/b/id/10746692-L.jpg',
            'approved',
            jsonb_build_object('author', 'Антуан де Сент-Экзюпери', 'year', 1943, 'pages', 96, 'genre', 'Философская сказка')
        ),
        (
            'book'::text,
            'Цветы для Элджернона',
            'Чарли Гордон — уборщик с умственной отсталостью — соглашается на экспериментальную операцию. Его дневник превращается в одну из самых пронзительных книг XX века.',
            'https://covers.openlibrary.org/b/id/12947700-L.jpg',
            'approved',
            jsonb_build_object('author', 'Дэниел Киз', 'year', 1966, 'pages', 320, 'genre', 'Научная фантастика')
        ),
        (
            'book'::text,
            'Убийство в Восточном экспрессе',
            'Поезд застрял в снегу, один из пассажиров убит. Эркюль Пуаро выясняет, что мотив есть у каждого. Классический детектив Агаты Кристи.',
            'https://covers.openlibrary.org/b/id/11100465-L.jpg',
            'approved',
            jsonb_build_object('author', 'Агата Кристи', 'year', 1934, 'pages', 288, 'genre', 'Детектив')
        ),
        (
            'book'::text,
            'Задача трёх тел',
            'Китайские учёные в разгар Культурной революции устанавливают контакт с инопланетной цивилизацией — и человечество оказывается на пороге вторжения. Первый роман трилогии Лю Цысиня.',
            'https://covers.openlibrary.org/b/id/10526598-L.jpg',
            'approved',
            jsonb_build_object('author', 'Лю Цысинь', 'year', 2008, 'pages', 432, 'genre', 'Твёрдая научная фантастика')
        )
    ) as t(type, title, description, image_url, status, metadata)
    where not exists (select 1 from public.content c where c.title = t.title and c.type = t.type);

    -- ---------- MOVIES (40) ----------
    insert into public.content (type, title, description, image_url, status, created_by, metadata)
    select t.type, t.title, t.description, t.image_url, t.status, v_admin, t.metadata
    from (values
        (
            'movie'::text,
            'Крёстный отец',
            'Сага Фрэнсиса Форда Копполы о семье сицилийских иммигрантов Корлеоне в послевоенной Америке. Отец — дон Вито, младший сын Майкл — наследник, который не хотел становиться мафиози.',
            'https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg',
            'approved',
            jsonb_build_object('director', 'Фрэнсис Форд Коппола', 'year', 1972, 'duration', 175, 'genre', 'Криминальная драма', 'actors', 'Марлон Брандо, Аль Пачино, Джеймс Каан')
        ),
        (
            'movie'::text,
            'Начало',
            'Дом Кобб — вор, умеющий красть идеи прямо из снов. Последнее задание: вместо кражи мысль нужно внедрить. Интеллектуальный блокбастер Кристофера Нолана.',
            'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Кристофер Нолан', 'year', 2010, 'duration', 148, 'genre', 'Научная фантастика', 'actors', 'Леонардо ДиКаприо, Джозеф Гордон-Левитт, Эллен Пейдж')
        ),
        (
            'movie'::text,
            'Побег из Шоушенка',
            'Банкир Энди Дюфрейн попадает в тюрьму Шоушенк за убийство жены, которого не совершал. История дружбы, надежды и терпения длиной почти в два десятилетия.',
            'https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg',
            'approved',
            jsonb_build_object('director', 'Фрэнк Дарабонт', 'year', 1994, 'duration', 142, 'genre', 'Драма', 'actors', 'Тим Роббинс, Морган Фриман')
        ),
        (
            'movie'::text,
            'Интерстеллар',
            'Земля умирает. Бывший пилот Купер уходит сквозь червоточину искать человечеству новый дом, оставляя дочь на грани смерти от пыли. Эпос Кристофера Нолана о времени и любви.',
            'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Кристофер Нолан', 'year', 2014, 'duration', 169, 'genre', 'Научная фантастика', 'actors', 'Мэттью Макконахи, Энн Хэтэуэй, Джессика Честейн')
        ),
        (
            'movie'::text,
            'Однажды в Голливуде',
            'Квентин Тарантино переписывает хронику Лос-Анджелеса 1969 года. Звезда сериалов Рик Долтон и его дублёр Клифф Бут живут рядом с Шэрон Тейт накануне ночи, изменившей эпоху.',
            'https://upload.wikimedia.org/wikipedia/en/a/a6/Once_Upon_a_Time_in_Hollywood_poster.png',
            'approved',
            jsonb_build_object('director', 'Квентин Тарантино', 'year', 2019, 'duration', 161, 'genre', 'Комедия-драма', 'actors', 'Леонардо ДиКаприо, Брэд Питт, Марго Робби')
        ),
        (
            'movie'::text,
            'Зелёная миля',
            'Охранник блока смертников Пол Эджкомб встречает заключённого с необъяснимым даром. Экранизация Стивена Кинга от Фрэнка Дарабонта.',
            'https://upload.wikimedia.org/wikipedia/en/e/e2/The_Green_Mile_%28movie_poster%29.jpg',
            'approved',
            jsonb_build_object('director', 'Фрэнк Дарабонт', 'year', 1999, 'duration', 189, 'genre', 'Драма, фэнтези', 'actors', 'Том Хэнкс, Майкл Кларк Дункан')
        ),
        (
            'movie'::text,
            'Матрица',
            'Программист Нео узнаёт, что окружающий мир — иллюзия, сгенерированная машинами. Революционный научно-фантастический боевик сестёр Вачовски.',
            'https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png',
            'approved',
            jsonb_build_object('director', 'Лана и Лилли Вачовски', 'year', 1999, 'duration', 136, 'genre', 'Фантастика, боевик', 'actors', 'Киану Ривз, Лоуренс Фишбёрн, Кэрри-Энн Мосс')
        ),
        (
            'movie'::text,
            'Брат 2',
            'Данила Багров отправляется в Чикаго мстить за гибель друга и заодно находит справедливость по-своему. Культовый фильм Алексея Балабанова и зеркало девяностых.',
            'https://upload.wikimedia.org/wikipedia/ru/2/25/Brat2_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Алексей Балабанов', 'year', 2000, 'duration', 127, 'genre', 'Криминальный боевик', 'actors', 'Сергей Бодров-мл., Виктор Сухоруков')
        ),
        (
            'movie'::text,
            'Левиафан',
            'Автомеханик Николай защищает дом от мэра провинциального города, который хочет снести его землю. Андрей Звягинцев рисует современную русскую трагедию.',
            'https://upload.wikimedia.org/wikipedia/en/3/39/Leviathan_2014_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Андрей Звягинцев', 'year', 2014, 'duration', 140, 'genre', 'Драма', 'actors', 'Алексей Серебряков, Елена Лядова, Роман Мадянов')
        ),
        (
            'movie'::text,
            'Иди и смотри',
            'Белоруссия, 1943 год. Подросток Флёра попадает в партизанский отряд и проходит через ад карательных операций. Фильм Элема Климова — один из сильнейших о войне.',
            'https://upload.wikimedia.org/wikipedia/en/0/08/Come_and_See_%28poster%29.jpg',
            'approved',
            jsonb_build_object('director', 'Элем Климов', 'year', 1985, 'duration', 142, 'genre', 'Военная драма', 'actors', 'Алексей Кравченко, Ольга Миронова')
        ),
        (
            'movie'::text,
            'Форрест Гамп',
            'Парень с низким IQ проходит через полвека американской истории: Вьетнам, пинг-понг, креветочный бизнес. И всегда помнит про Дженни. Роберт Земекис о случайности и доброте.',
            'https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Роберт Земекис', 'year', 1994, 'duration', 142, 'genre', 'Драма', 'actors', 'Том Хэнкс, Робин Райт, Гари Синиз')
        ),
        (
            'movie'::text,
            'Криминальное чтиво',
            'Четыре переплетённые истории из жизни лос-анджелесского криминала: бандиты-философы, боксёр, жена босса и два случайных грабителя. Тарантино, перевернувший девяностые.',
            'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Квентин Тарантино', 'year', 1994, 'duration', 154, 'genre', 'Криминальная комедия', 'actors', 'Джон Траволта, Сэмюэл Л. Джексон, Ума Турман')
        ),
        (
            'movie'::text,
            'Список Шиндлера',
            'Немецкий промышленник Оскар Шиндлер использует свой завод, чтобы спасти более тысячи евреев от Холокоста. Чёрно-белый шедевр Стивена Спилберга.',
            'https://upload.wikimedia.org/wikipedia/en/3/38/Schindler%27s_List_movie.jpg',
            'approved',
            jsonb_build_object('director', 'Стивен Спилберг', 'year', 1993, 'duration', 195, 'genre', 'Историческая драма', 'actors', 'Лиам Нисон, Бен Кингсли, Рэйф Файнс')
        ),
        (
            'movie'::text,
            'Властелин колец: Братство Кольца',
            'Хоббит Фродо получает древнее Кольцо Всевластья и отправляется с восемью соратниками уничтожить его в жерле Ородруина. Первая часть эпопеи Питера Джексона.',
            'https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg',
            'approved',
            jsonb_build_object('director', 'Питер Джексон', 'year', 2001, 'duration', 178, 'genre', 'Фэнтези', 'actors', 'Элайджа Вуд, Иэн Маккеллен, Вигго Мортенсен')
        ),
        (
            'movie'::text,
            'Бойцовский клуб',
            'Страдающий бессонницей клерк встречает обаятельного торговца мылом Тайлера Дёрдена, и вместе они основывают подпольные бойцовские клубы. Дэвид Финчер о кризисе мужественности.',
            'https://upload.wikimedia.org/wikipedia/en/f/fc/Fight_Club_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Дэвид Финчер', 'year', 1999, 'duration', 139, 'genre', 'Драма, триллер', 'actors', 'Брэд Питт, Эдвард Нортон, Хелена Бонем Картер')
        ),
        (
            'movie'::text,
            'Сталкер',
            'В Зоне — охраняемой территории с необъяснимыми аномалиями — есть Комната, исполняющая заветные желания. Писатель и Профессор нанимают Сталкера, чтобы туда попасть. Фильм Андрея Тарковского.',
            'https://upload.wikimedia.org/wikipedia/en/d/d4/Stalker_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Андрей Тарковский', 'year', 1979, 'duration', 162, 'genre', 'Философская фантастика', 'actors', 'Александр Кайдановский, Анатолий Солоницын, Николай Гринько')
        ),
        (
            'movie'::text,
            'Москва слезам не верит',
            'Три провинциалки приезжают покорять Москву шестидесятых. Двадцать лет спустя у каждой своя судьба. Оскароносная мелодрама Владимира Меньшова.',
            'https://upload.wikimedia.org/wikipedia/en/a/a3/Moscow_for_US.jpg',
            'approved',
            jsonb_build_object('director', 'Владимир Меньшов', 'year', 1979, 'duration', 148, 'genre', 'Мелодрама', 'actors', 'Вера Алентова, Алексей Баталов, Ирина Муравьёва')
        ),
        (
            'movie'::text,
            'Дюна',
            'На пустынной планете Арракис добывают главное вещество Вселенной — Пряность. Юный наследник дома Атрейдес Пол должен стать пророком. Экранизация Фрэнка Герберта от Дени Вильнёва.',
            'https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_%282021_film%29.jpg',
            'approved',
            jsonb_build_object('director', 'Дени Вильнёв', 'year', 2021, 'duration', 156, 'genre', 'Научная фантастика', 'actors', 'Тимоти Шаламе, Ребекка Фергюсон, Оскар Айзек')
        ),
        (
            'movie'::text,
            'Паразиты',
            'Бедная сеульская семья Ким постепенно внедряется в дом богачей Пак — и вскрывает классовую пропасть в корейском обществе. «Золотая пальмовая ветвь» и «Оскар» Пон Джун-хо.',
            'https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png',
            'approved',
            jsonb_build_object('director', 'Пон Джун-хо', 'year', 2019, 'duration', 132, 'genre', 'Социальный триллер', 'actors', 'Сон Кан-хо, Ли Сон-гюн, Чо Ё-джон')
        ),
        (
            'movie'::text,
            'Джентльмены',
            'Американец Микки Пирсон построил в Британии марихуановую империю и решает продать бизнес. Мгновенно разгорается война интересов. Возвращение Гая Ричи к стилю «Большого куша».',
            'https://upload.wikimedia.org/wikipedia/en/0/06/The_Gentlemen_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Гай Ричи', 'year', 2019, 'duration', 113, 'genre', 'Криминальная комедия', 'actors', 'Мэттью Макконахи, Чарли Ханнэм, Хью Грант, Колин Фаррелл')
        ),
        (
            'movie'::text,
            'Крёстный отец 2',
            'Коппола сплетает две линии: молодой Вито Корлеоне строит империю в Нью-Йорке начала века, а уже взрослый Майкл расправляется с внутренними врагами. Один из редких сиквелов, превосходящих оригинал.',
            'https://upload.wikimedia.org/wikipedia/en/0/03/Godfather_part_ii.jpg',
            'approved',
            jsonb_build_object('director', 'Фрэнсис Форд Коппола', 'year', 1974, 'duration', 202, 'genre', 'Криминальная драма', 'actors', 'Аль Пачино, Роберт Де Ниро, Роберт Дюваль')
        ),
        (
            'movie'::text,
            'Терминатор 2: Судный день',
            'Из будущего к Джону Коннору отправляют двух роботов: старого знакомого Т-800 и жидкометаллического Т-1000. Джеймс Кэмерон переизобретает жанр экшена.',
            'https://upload.wikimedia.org/wikipedia/en/5/5e/Terminator_2-Judgment_Day.png',
            'approved',
            jsonb_build_object('director', 'Джеймс Кэмерон', 'year', 1991, 'duration', 137, 'genre', 'Фантастика, боевик', 'actors', 'Арнольд Шварценеггер, Линда Хэмилтон, Эдвард Ферлонг')
        ),
        (
            'movie'::text,
            'Назад в будущее',
            'Подросток Марти Макфлай случайно попадает в 1955 год на машине времени доктора Брауна. Теперь нужно свести родителей и вернуться домой. Образец приключенческого кино восьмидесятых.',
            'https://upload.wikimedia.org/wikipedia/en/d/d2/Back_to_the_Future.jpg',
            'approved',
            jsonb_build_object('director', 'Роберт Земекис', 'year', 1985, 'duration', 116, 'genre', 'Фантастика, комедия', 'actors', 'Майкл Дж. Фокс, Кристофер Ллойд, Криспин Гловер')
        ),
        (
            'movie'::text,
            'Славные парни',
            'Генри Хилл с детства мечтает стать мафиози — и становится. Мартин Скорсезе без прикрас показывает, как устроена организованная преступность в Нью-Йорке.',
            'https://upload.wikimedia.org/wikipedia/en/7/7b/Goodfellas.jpg',
            'approved',
            jsonb_build_object('director', 'Мартин Скорсезе', 'year', 1990, 'duration', 146, 'genre', 'Криминальная драма', 'actors', 'Роберт Де Ниро, Рэй Лиотта, Джо Пеши')
        ),
        (
            'movie'::text,
            'Молчание ягнят',
            'Агент ФБР Кларисса Старлинг просит помощи у заточённого каннибала Ганнибала Лектера, чтобы поймать серийного маньяка. Единственный хоррор, получивший «Оскар» за лучший фильм.',
            'https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Джонатан Демме', 'year', 1991, 'duration', 118, 'genre', 'Триллер', 'actors', 'Джоди Фостер, Энтони Хопкинс, Скотт Гленн')
        ),
        (
            'movie'::text,
            'Жизнь прекрасна',
            'Еврей Гвидо попадает с сыном в концлагерь и превращает лагерные будни в игру, чтобы защитить ребёнка от ужаса. Нежная трагикомедия Роберто Бениньи.',
            'https://upload.wikimedia.org/wikipedia/en/7/7c/Vitaebella.jpg',
            'approved',
            jsonb_build_object('director', 'Роберто Бениньи', 'year', 1997, 'duration', 116, 'genre', 'Трагикомедия', 'actors', 'Роберто Бениньи, Николетта Браски, Джорджо Кантарини')
        ),
        (
            'movie'::text,
            'Поймай меня, если сможешь',
            'Шестнадцатилетний Фрэнк Эбегнейл изобретает себя заново: лётчик, врач, юрист. За ним годами охотится агент ФБР Карл Хэнрэтти. Реальная история в лёгкой режиссуре Спилберга.',
            'https://upload.wikimedia.org/wikipedia/en/4/4d/Catch_Me_If_You_Can_2002_movie.jpg',
            'approved',
            jsonb_build_object('director', 'Стивен Спилберг', 'year', 2002, 'duration', 141, 'genre', 'Биография, криминал', 'actors', 'Леонардо ДиКаприо, Том Хэнкс, Кристофер Уокен')
        ),
        (
            'movie'::text,
            'Гладиатор',
            'Римский полководец Максимус предан императором Коммодом и продан в рабство. Теперь он гладиатор, цель которого — месть. Эпос Ридли Скотта и оскароносная роль Рассела Кроу.',
            'https://upload.wikimedia.org/wikipedia/en/f/fb/Gladiator_%282000_film_poster%29.png',
            'approved',
            jsonb_build_object('director', 'Ридли Скотт', 'year', 2000, 'duration', 155, 'genre', 'Исторический экшен', 'actors', 'Рассел Кроу, Хоакин Феникс, Конни Нильсен')
        ),
        (
            'movie'::text,
            'Тёмный рыцарь',
            'Бэтмен, прокурор Дент и комиссар Гордон близки к победе над мафией Готэма — пока на сцену не выходит Джокер. Лучший комикс-фильм десятилетия от Кристофера Нолана.',
            'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg',
            'approved',
            jsonb_build_object('director', 'Кристофер Нолан', 'year', 2008, 'duration', 152, 'genre', 'Боевик, драма', 'actors', 'Кристиан Бейл, Хит Леджер, Аарон Экхарт')
        ),
        (
            'movie'::text,
            'Престиж',
            'Два лондонских фокусника — Энджьер и Борден — становятся соперниками, готовыми на всё ради идеального трюка. Нолан о цене одержимости.',
            'https://upload.wikimedia.org/wikipedia/en/d/d2/Prestige_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Кристофер Нолан', 'year', 2006, 'duration', 130, 'genre', 'Драма, триллер', 'actors', 'Хью Джекман, Кристиан Бейл, Майкл Кейн, Скарлетт Йоханссон')
        ),
        (
            'movie'::text,
            'Иван Васильевич меняет профессию',
            'Инженер Шурик изобретает машину времени и отправляет управдома Буншу вместе с вором Милославским в XVI век. А в современную Москву попадает сам Иван Грозный. Классика Леонида Гайдая.',
            'https://upload.wikimedia.org/wikipedia/en/c/c6/Ivan_Vasilievich_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Леонид Гайдай', 'year', 1973, 'duration', 93, 'genre', 'Комедия', 'actors', 'Юрий Яковлев, Леонид Куравлёв, Александр Демьяненко')
        ),
        (
            'movie'::text,
            'Бриллиантовая рука',
            'Семён Семёныч Горбунков по стечению обстоятельств становится курьером контрабандистов. За ним охотятся и жулики, и милиция. Самая цитируемая советская комедия.',
            'https://upload.wikimedia.org/wikipedia/en/9/90/Brilruka.jpg',
            'approved',
            jsonb_build_object('director', 'Леонид Гайдай', 'year', 1969, 'duration', 100, 'genre', 'Комедия', 'actors', 'Юрий Никулин, Андрей Миронов, Анатолий Папанов')
        ),
        (
            'movie'::text,
            'Операция «Ы» и другие приключения Шурика',
            'Три новеллы о студенте Шурике: про хулигана Федю, про сон перед экзаменом и про ночное ограбление склада. Гайдаевский эталон.',
            'https://upload.wikimedia.org/wikipedia/en/6/6f/Operatsiya.jpg',
            'approved',
            jsonb_build_object('director', 'Леонид Гайдай', 'year', 1965, 'duration', 95, 'genre', 'Комедия', 'actors', 'Александр Демьяненко, Алексей Смирнов, Наталья Селезнёва')
        ),
        (
            'movie'::text,
            'Служебный роман',
            'Статистик Новосельцев влюбляется в свою начальницу — «мымру» Людмилу Прокофьевну. Комедия Эльдара Рязанова, которую в СССР пересматривали каждым Новым годом.',
            'https://upload.wikimedia.org/wikipedia/en/a/a7/Office_Romance.jpg',
            'approved',
            jsonb_build_object('director', 'Эльдар Рязанов', 'year', 1977, 'duration', 159, 'genre', 'Комедия, мелодрама', 'actors', 'Андрей Мягков, Алиса Фрейндлих, Олег Басилашвили')
        ),
        (
            'movie'::text,
            'Ирония судьбы, или С лёгким паром!',
            'Женя Лукашин случайно оказывается в Ленинграде, в квартире, точно повторяющей его московскую. Так встречаются Надя и Женя. Главный новогодний фильм страны.',
            'https://upload.wikimedia.org/wikipedia/en/4/4b/Irony_of_Fate_poster.jpg',
            'approved',
            jsonb_build_object('director', 'Эльдар Рязанов', 'year', 1975, 'duration', 184, 'genre', 'Комедия, мелодрама', 'actors', 'Андрей Мягков, Барбара Брыльска, Юрий Яковлев')
        ),
        (
            'movie'::text,
            'Собачье сердце',
            'Профессор Преображенский превращает бродячего пса Шарика в человека по фамилии Шариков. Экранизация повести Булгакова от Владимира Бортко.',
            'https://upload.wikimedia.org/wikipedia/en/5/57/Heart_of_a_Dog_%281988_film%29_BRD_cover.jpg',
            'approved',
            jsonb_build_object('director', 'Владимир Бортко', 'year', 1988, 'duration', 136, 'genre', 'Трагикомедия', 'actors', 'Евгений Евстигнеев, Владимир Толоконников, Борис Плотников')
        ),
        (
            'movie'::text,
            'Кин-дза-дза!',
            'Инженер и студент случайно переносятся на планету Плюк в галактике Кин-дза-дза. Всё, что нужно для счастья местных, — спички и слово «ку». Философская антиутопия Георгия Данелии.',
            'https://upload.wikimedia.org/wikipedia/en/0/00/Kin-dza-dza-VHS.jpg',
            'approved',
            jsonb_build_object('director', 'Георгий Данелия', 'year', 1986, 'duration', 135, 'genre', 'Фантастика, трагикомедия', 'actors', 'Станислав Любшин, Евгений Леонов, Юрий Яковлев, Леван Габриадзе')
        ),
        (
            'movie'::text,
            'Возвращение',
            'К двум братьям внезапно возвращается отец после двенадцатилетнего отсутствия и увозит их в поход. Дебют Андрея Звягинцева, «Золотой лев» Венеции.',
            'https://upload.wikimedia.org/wikipedia/en/8/8c/Vozvrashcheniye_movie.jpg',
            'approved',
            jsonb_build_object('director', 'Андрей Звягинцев', 'year', 2003, 'duration', 111, 'genre', 'Драма', 'actors', 'Владимир Гарин, Иван Добронравов, Константин Лавроненко')
        ),
        (
            'movie'::text,
            'Нелюбовь',
            'Разводящаяся московская пара ищет пропавшего двенадцатилетнего сына — и всю дорогу сводит счёты друг с другом. Социальная драма Андрея Звягинцева.',
            'https://upload.wikimedia.org/wikipedia/en/8/8a/Loveless_%28film%29.png',
            'approved',
            jsonb_build_object('director', 'Андрей Звягинцев', 'year', 2017, 'duration', 127, 'genre', 'Драма', 'actors', 'Марьяна Спивак, Алексей Розин, Матвей Новиков')
        ),
        (
            'movie'::text,
            'Джанго освобождённый',
            'Бывший раб Джанго объединяется с немецким охотником за головами Шульцем, чтобы спасти жену с плантации жестокого рабовладельца. Тарантино переписывает американский Юг.',
            'https://upload.wikimedia.org/wikipedia/en/8/8b/Django_Unchained_Poster.jpg',
            'approved',
            jsonb_build_object('director', 'Квентин Тарантино', 'year', 2012, 'duration', 165, 'genre', 'Вестерн, драма', 'actors', 'Джейми Фокс, Кристоф Вальц, Леонардо ДиКаприо, Сэмюэл Л. Джексон')
        )
    ) as t(type, title, description, image_url, status, metadata)
    where not exists (select 1 from public.content c where c.title = t.title and c.type = t.type);

end
$seed$;

-- If you already ran an earlier version with picsum.photos placeholders,
-- refresh those covers in-place (no-op if already correct):
update public.content set image_url = 'https://covers.openlibrary.org/b/id/15013644-L.jpg'                     where title = 'Мастер и Маргарита'                         and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/13116014-L.jpg'                     where title = 'Преступление и наказание'                   and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/12621906-L.jpg'                     where title = 'Война и мир'                                 and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/9267242-L.jpg'                      where title = '1984'                                        and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/15093420-L.jpg'                     where title = 'Сто лет одиночества'                         and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/10590366-L.jpg'                     where title = 'Великий Гэтсби'                              and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/14351077-L.jpg'                     where title = 'Убить пересмешника'                          and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/2237620-L.jpg'                      where title = 'Норвежский лес'                              and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/commons/6/67/Weyevgenyzamyatin.png' where title = 'Мы'                                        and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/15155833-L.jpg'                     where title = 'Гарри Поттер и философский камень'           and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/2560652-L.jpg'                      where title = 'Анна Каренина'                               and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/11365660-L.jpg'                     where title = 'Евгений Онегин'                              and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/10249475-L.jpg'                     where title = 'Идиот'                                       and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/298085-L.jpg'                       where title = 'Тихий Дон'                                   and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/463307-L.jpg'                       where title = 'Старик и море'                               and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/9273490-L.jpg'                      where title = 'Над пропастью во ржи'                        and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/10746692-L.jpg'                     where title = 'Маленький принц'                             and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/12947700-L.jpg'                     where title = 'Цветы для Элджернона'                        and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/11100465-L.jpg'                     where title = 'Убийство в Восточном экспрессе'              and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://covers.openlibrary.org/b/id/10526598-L.jpg'                     where title = 'Задача трёх тел'                             and image_url like 'https://picsum.photos/%';

update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg'                             where title = 'Крёстный отец'                 and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg'     where title = 'Начало'                        and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg'             where title = 'Побег из Шоушенка'             and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg'                   where title = 'Интерстеллар'                  and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/a/a6/Once_Upon_a_Time_in_Hollywood_poster.png'       where title = 'Однажды в Голливуде'           and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/e/e2/The_Green_Mile_%28movie_poster%29.jpg'          where title = 'Зелёная миля'                  and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png'                                 where title = 'Матрица'                       and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/ru/2/25/Brat2_poster.jpg'                               where title = 'Брат 2'                        and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/3/39/Leviathan_2014_poster.jpg'                      where title = 'Левиафан'                      and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/0/08/Come_and_See_%28poster%29.jpg'                  where title = 'Иди и смотри'                  and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg'                        where title = 'Форрест Гамп'                  and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg'             where title = 'Криминальное чтиво'            and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/3/38/Schindler%27s_List_movie.jpg'                   where title = 'Список Шиндлера'               and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg'                 where title = 'Властелин колец: Братство Кольца' and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/f/fc/Fight_Club_poster.jpg'                          where title = 'Бойцовский клуб'               and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/d/d4/Stalker_poster.jpg'                             where title = 'Сталкер'                       and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/a/a3/Moscow_for_US.jpg'                              where title = 'Москва слезам не верит'       and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_%282021_film%29.jpg'                       where title = 'Дюна'                          and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png'                   where title = 'Паразиты'                      and image_url like 'https://picsum.photos/%';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/0/06/The_Gentlemen_poster.jpg'                       where title = 'Джентльмены'                   and image_url like 'https://picsum.photos/%';


-- =====================================================================
-- EXTRA SEED — ещё 40 книг и 20 фильмов
--
-- Обложки книг: OpenLibrary по ISBN (редирект на -L JPG).
-- Постеры фильмов: upload.wikimedia.org (англ./рус. Википедия).
-- Блок идемпотентный: пропускает уже существующие (title, type).
-- =====================================================================
do $seed_extra$
declare
    v_admin uuid;
begin
    select id into v_admin
    from public.profiles
    where role in ('superadmin', 'admin', 'moderator')
    order by
        case role
            when 'superadmin' then 1
            when 'admin' then 2
            when 'moderator' then 3
            else 4
        end,
        joined_at asc nulls last
    limit 1;

    if v_admin is null then
        select id into v_admin from public.profiles order by joined_at asc nulls last limit 1;
    end if;

    if v_admin is null then
        raise exception 'Нельзя засеять дополнительный контент: в таблице profiles нет ни одного пользователя.';
    end if;

    -- ---------- EXTRA BOOKS (40) ----------
    insert into public.content (type, title, description, image_url, status, created_by, metadata)
    select t.type, t.title, t.description, t.image_url, t.status, v_admin, t.metadata
    from (values
        ('book'::text, 'Портрет Дориана Грея',
         'Юный красавец Дориан Грей отдаёт душу ради вечной молодости — стареет не он, а его портрет. Единственный роман Оскара Уайльда, манифест эстетизма и декаданса.',
         'https://covers.openlibrary.org/b/isbn/9780141439570-L.jpg', 'approved',
         jsonb_build_object('author','Оскар Уайльд','year',1890,'pages',272,'genre','Английская классика')),
        ('book'::text, 'Гордость и предубеждение',
         'Элизабет Беннет и мистер Дарси проходят путь от взаимной неприязни к любви в английской провинции начала XIX века. Самый известный роман Джейн Остин.',
         'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg', 'approved',
         jsonb_build_object('author','Джейн Остин','year',1813,'pages',432,'genre','Английская классика')),
        ('book'::text, 'Три мушкетёра',
         'Гасконец д’Артаньян приезжает в Париж и становится другом Атоса, Портоса и Арамиса. Вместе они спасают честь королевы от коварства кардинала Ришельё.',
         'https://covers.openlibrary.org/b/isbn/9780140437645-L.jpg', 'approved',
         jsonb_build_object('author','Александр Дюма','year',1844,'pages',720,'genre','Приключенческий роман')),
        ('book'::text, 'Граф Монте-Кристо',
         'Несправедливо заключённый Эдмон Дантес совершает побег из замка Иф, находит сокровище и под именем графа Монте-Кристо методично мстит врагам. Эталонный роман о мести от Дюма.',
         'https://covers.openlibrary.org/b/isbn/9780140449266-L.jpg', 'approved',
         jsonb_build_object('author','Александр Дюма','year',1846,'pages',1276,'genre','Приключенческий роман')),
        ('book'::text, 'Отверженные',
         'Беглый каторжник Жан Вальжан ищет спасения в мире, где закон беспощаден, а революция 1832 года заливает Париж кровью. Грандиозный социальный роман Виктора Гюго.',
         'https://covers.openlibrary.org/b/isbn/9780451525260-L.jpg', 'approved',
         jsonb_build_object('author','Виктор Гюго','year',1862,'pages',1488,'genre','Социальный роман')),
        ('book'::text, 'Собор Парижской Богоматери',
         'Париж XV века. Горбун Квазимодо, цыганка Эсмеральда и архидьякон Клод Фролло связаны страшной страстью вокруг готического собора — главного героя книги.',
         'https://covers.openlibrary.org/b/isbn/9780140443530-L.jpg', 'approved',
         jsonb_build_object('author','Виктор Гюго','year',1831,'pages',656,'genre','Исторический роман')),
        ('book'::text, 'Дракула',
         'Юрист Джонатан Харкер едет в Трансильванию к загадочному графу Дракуле — и выясняет, что хозяин замка не принадлежит миру живых. Канонический готический роман Брэма Стокера.',
         'https://covers.openlibrary.org/b/isbn/9780141439846-L.jpg', 'approved',
         jsonb_build_object('author','Брэм Стокер','year',1897,'pages',488,'genre','Готический роман')),
        ('book'::text, 'Франкенштейн, или Современный Прометей',
         'Молодой учёный Виктор Франкенштейн оживляет существо, собранное из мёртвой плоти, и платит за дерзость страшную цену. Мэри Шелли закладывает фундамент научной фантастики.',
         'https://covers.openlibrary.org/b/isbn/9780141439471-L.jpg', 'approved',
         jsonb_build_object('author','Мэри Шелли','year',1818,'pages',280,'genre','Готический роман')),
        ('book'::text, 'Доктор Живаго',
         'Поэт и врач Юрий Живаго проживает революцию и гражданскую войну между двумя женщинами — Тоней и Ларой. Нобелевский роман Бориса Пастернака о судьбе русской интеллигенции.',
         'https://covers.openlibrary.org/b/isbn/9780679774389-L.jpg', 'approved',
         jsonb_build_object('author','Борис Пастернак','year',1957,'pages',608,'genre','Русская классика')),
        ('book'::text, 'Лолита',
         'Профессор Гумберт Гумберт влюбляется в двенадцатилетнюю Долорес Гейз — и его одержимость превращается в путешествие через всю Америку. Самый спорный роман Владимира Набокова.',
         'https://covers.openlibrary.org/b/isbn/9780679723165-L.jpg', 'approved',
         jsonb_build_object('author','Владимир Набоков','year',1955,'pages',336,'genre','Современная проза')),
        ('book'::text, 'Братья Карамазовы',
         'История трёх сыновей помещика Фёдора Карамазова: страстного Дмитрия, рассудочного Ивана и послушника Алёши. Последний и самый философский роман Достоевского.',
         'https://covers.openlibrary.org/b/isbn/9780374528379-L.jpg', 'approved',
         jsonb_build_object('author','Фёдор Достоевский','year',1880,'pages',800,'genre','Русская классика')),
        ('book'::text, 'Записки из подполья',
         'Безымянный рассказчик — «человек из подполья» — ведёт монолог о разуме, свободе и собственной никчёмности. Повесть Достоевского, предвосхитившая экзистенциализм XX века.',
         'https://covers.openlibrary.org/b/isbn/9780486270531-L.jpg', 'approved',
         jsonb_build_object('author','Фёдор Достоевский','year',1864,'pages',168,'genre','Философская проза')),
        ('book'::text, 'Отцы и дети',
         'Студент-нигилист Евгений Базаров приезжает в усадьбу друга и сталкивается с миром дворянских отцов. Роман Ивана Тургенева, запустивший в русскую речь слово «нигилизм».',
         'https://covers.openlibrary.org/b/isbn/9780199555383-L.jpg', 'approved',
         jsonb_build_object('author','Иван Тургенев','year',1862,'pages',304,'genre','Русская классика')),
        ('book'::text, 'Мёртвые души',
         'Чичиков разъезжает по русской глубинке и скупает умерших крепостных, которые ещё числятся живыми. Поэма в прозе Николая Гоголя — энциклопедия провинциальных типов.',
         'https://covers.openlibrary.org/b/isbn/9780140448078-L.jpg', 'approved',
         jsonb_build_object('author','Николай Гоголь','year',1842,'pages',464,'genre','Русская классика')),
        ('book'::text, 'Герой нашего времени',
         'Офицер Григорий Печорин — холодный, талантливый и бесконечно одинокий. Михаил Лермонтов собирает из пяти повестей психологический портрет лишнего человека эпохи.',
         'https://covers.openlibrary.org/b/isbn/9780140447958-L.jpg', 'approved',
         jsonb_build_object('author','Михаил Лермонтов','year',1840,'pages',224,'genre','Русская классика')),
        ('book'::text, 'Двенадцать стульев',
         'Великий комбинатор Остап Бендер и бывший предводитель дворянства Ипполит Воробьянинов охотятся за бриллиантами, спрятанными в одном из двенадцати стульев. Классика Ильфа и Петрова.',
         'https://covers.openlibrary.org/b/isbn/9780810161962-L.jpg', 'approved',
         jsonb_build_object('author','Илья Ильф и Евгений Петров','year',1928,'pages',448,'genre','Сатира')),
        ('book'::text, 'Один день Ивана Денисовича',
         'Один лагерный день — от подъёма до отбоя — глазами заключённого Ивана Шухова. Повесть Александра Солженицына, впервые открыто рассказавшая советскому читателю о ГУЛАГе.',
         'https://covers.openlibrary.org/b/isbn/9780451531049-L.jpg', 'approved',
         jsonb_build_object('author','Александр Солженицын','year',1962,'pages',182,'genre','Лагерная проза')),
        ('book'::text, 'Процесс',
         'Йозефа К. арестовывают однажды утром, не объясняя за что, и дальше он должен оправдываться перед невидимым судом. Незавершённый шедевр Франца Кафки о бюрократическом аду.',
         'https://covers.openlibrary.org/b/isbn/9780805209990-L.jpg', 'approved',
         jsonb_build_object('author','Франц Кафка','year',1925,'pages',280,'genre','Модернизм')),
        ('book'::text, 'Замок',
         'Землемер К. приезжает в деревню у подножия Замка, чтобы приступить к работе, но попасть в сам Замок он не может никогда. Последний роман Франца Кафки, загадка без ключа.',
         'https://covers.openlibrary.org/b/isbn/9780805211061-L.jpg', 'approved',
         jsonb_build_object('author','Франц Кафка','year',1926,'pages',328,'genre','Модернизм')),
        ('book'::text, 'Превращение',
         'Коммивояжёр Грегор Замза просыпается насекомым — и жизнь его мещанской семьи меняется необратимо. Самая знаменитая новелла Кафки.',
         'https://covers.openlibrary.org/b/isbn/9780553213690-L.jpg', 'approved',
         jsonb_build_object('author','Франц Кафка','year',1915,'pages',96,'genre','Модернизм')),
        ('book'::text, 'Улисс',
         'Один день 16 июня 1904 года в Дублине глазами Леопольда Блума, Стивена Дедала и Молли Блум. Джеймс Джойс пересобирает роман по правилам потока сознания.',
         'https://covers.openlibrary.org/b/isbn/9780679722762-L.jpg', 'approved',
         jsonb_build_object('author','Джеймс Джойс','year',1922,'pages',736,'genre','Модернизм')),
        ('book'::text, 'Шум и ярость',
         'История распада южной семьи Компсонов, рассказанная четырьмя голосами — от умственно отсталого Бенджи до холодного Джейсона. Роман Уильяма Фолкнера, перевернувший американскую прозу.',
         'https://covers.openlibrary.org/b/isbn/9780679732242-L.jpg', 'approved',
         jsonb_build_object('author','Уильям Фолкнер','year',1929,'pages',336,'genre','Модернизм')),
        ('book'::text, 'По ком звонит колокол',
         'Американский доброволец Роберт Джордан ведёт отряд партизан на подрыв моста во время гражданской войны в Испании. Один из сильнейших антивоенных романов Эрнеста Хемингуэя.',
         'https://covers.openlibrary.org/b/isbn/9780684803357-L.jpg', 'approved',
         jsonb_build_object('author','Эрнест Хемингуэй','year',1940,'pages',480,'genre','Военная проза')),
        ('book'::text, 'Прощай, оружие!',
         'Лейтенант Фредерик Генри служит на итальянском фронте Первой мировой и влюбляется в английскую медсестру Кэтрин. Хемингуэй пишет манифест «потерянного поколения».',
         'https://covers.openlibrary.org/b/isbn/9780684801469-L.jpg', 'approved',
         jsonb_build_object('author','Эрнест Хемингуэй','year',1929,'pages',332,'genre','Военная проза')),
        ('book'::text, 'Пролетая над гнездом кукушки',
         'Бродяга Рэндл Макмёрфи симулирует безумие, чтобы сбежать из тюрьмы в психиатрическую лечебницу — и объявляет войну железной сестре Рэтчед. Роман Кена Кизи о свободе и системе.',
         'https://covers.openlibrary.org/b/isbn/9780451163967-L.jpg', 'approved',
         jsonb_build_object('author','Кен Кизи','year',1962,'pages',320,'genre','Современная проза')),
        ('book'::text, 'Миссис Дэллоуэй',
         'Один июньский день в Лондоне 1923 года. Кларисса Дэллоуэй готовит вечерний приём, а ветеран войны Септимус Смит сходит с ума. Вирджиния Вулф о времени, памяти и потоке сознания.',
         'https://covers.openlibrary.org/b/isbn/9780156628709-L.jpg', 'approved',
         jsonb_build_object('author','Вирджиния Вулф','year',1925,'pages',216,'genre','Модернизм')),
        ('book'::text, '451 градус по Фаренгейту',
         'Пожарный Гай Монтэг по долгу службы сжигает книги — пока не начинает читать. Антиутопия Рэя Брэдбери о мире, где телевидение заменило мысль.',
         'https://covers.openlibrary.org/b/isbn/9781451673319-L.jpg', 'approved',
         jsonb_build_object('author','Рэй Брэдбери','year',1953,'pages',256,'genre','Антиутопия')),
        ('book'::text, 'Марсианские хроники',
         'Цикл рассказов Брэдбери о колонизации Марса землянами — мягко-поэтическая фантастика, где больше тоски по дому, чем ракет.',
         'https://covers.openlibrary.org/b/isbn/9780380973835-L.jpg', 'approved',
         jsonb_build_object('author','Рэй Брэдбери','year',1950,'pages',272,'genre','Научная фантастика')),
        ('book'::text, 'О дивный новый мир',
         'Мир, где людей выращивают в инкубаторах и дозируют счастьем. Олдос Хаксли описывает цивилизацию потребления, зачищенную от страданий и смысла.',
         'https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg', 'approved',
         jsonb_build_object('author','Олдос Хаксли','year',1932,'pages',311,'genre','Антиутопия')),
        ('book'::text, 'Скотный двор',
         'Звери прогоняют хозяина и устанавливают на ферме свой строй. Все животные равны, но некоторые равнее. Политическая притча Джорджа Оруэлла о логике революции.',
         'https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg', 'approved',
         jsonb_build_object('author','Джордж Оруэлл','year',1945,'pages',112,'genre','Сатирическая повесть')),
        ('book'::text, 'Дюна',
         'На пустынной планете Арракис добывают Пряность, без которой невозможны межзвёздные путешествия. Юный Пол Атрейдес должен стать пророком. Космический эпос Фрэнка Герберта.',
         'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg', 'approved',
         jsonb_build_object('author','Фрэнк Герберт','year',1965,'pages',688,'genre','Научная фантастика')),
        ('book'::text, 'Автостопом по галактике',
         'За секунду до сноса Земли Артур Дент улетает с инопланетянином-путеводителем. Дуглас Адамс выдаёт самую смешную книгу о смысле жизни, Вселенной и всём таком.',
         'https://covers.openlibrary.org/b/isbn/9780345391803-L.jpg', 'approved',
         jsonb_build_object('author','Дуглас Адамс','year',1979,'pages',224,'genre','Юмористическая фантастика')),
        ('book'::text, 'Игра Эндера',
         'Гениального ребёнка Эндера Виггина готовят в Боевой школе как последнюю надежду человечества в войне с инопланетными жукерами. Классика военной фантастики Орсона Скотта Карда.',
         'https://covers.openlibrary.org/b/isbn/9780812550702-L.jpg', 'approved',
         jsonb_build_object('author','Орсон Скотт Кард','year',1985,'pages',352,'genre','Научная фантастика')),
        ('book'::text, 'Хоббит, или Туда и обратно',
         'Домосед-хоббит Бильбо Бэггинс отправляется с тринадцатью гномами в поход к Одинокой Горе, чтобы отбить сокровища у дракона Смауга. Сказочный пролог к «Властелину колец».',
         'https://covers.openlibrary.org/b/isbn/9780345339683-L.jpg', 'approved',
         jsonb_build_object('author','Дж. Р. Р. Толкин','year',1937,'pages',310,'genre','Фэнтези')),
        ('book'::text, 'Властелин колец: Братство Кольца',
         'Фродо Бэггинс получает от Бильбо Кольцо Всевластья и выходит из Шира с отрядом из девяти хранителей. Первая часть эпопеи Дж. Р. Р. Толкина.',
         'https://covers.openlibrary.org/b/isbn/9780618260300-L.jpg', 'approved',
         jsonb_build_object('author','Дж. Р. Р. Толкин','year',1954,'pages',432,'genre','Фэнтези')),
        ('book'::text, 'Имя розы',
         'Ноябрь 1327 года, бенедиктинский монастырь на севере Италии: монах Вильгельм Баскервильский расследует серию загадочных смертей в стенах библиотеки. Интеллектуальный детектив Умберто Эко.',
         'https://covers.openlibrary.org/b/isbn/9780156001311-L.jpg', 'approved',
         jsonb_build_object('author','Умберто Эко','year',1980,'pages',536,'genre','Исторический детектив')),
        ('book'::text, 'Алхимик',
         'Андалусский пастух Сантьяго идёт через Сахару искать сокровище, о котором ему рассказали во сне. Притча Паулу Коэльо о зове сердца и Языке Мира.',
         'https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg', 'approved',
         jsonb_build_object('author','Паулу Коэльо','year',1988,'pages',176,'genre','Притча')),
        ('book'::text, 'Фауст',
         'Уставший от знания доктор Фауст заключает сделку с Мефистофелем — за одно мгновение, когда захочется воскликнуть «Остановись!». Главный труд Иоганна Гёте, писался почти шестьдесят лет.',
         'https://covers.openlibrary.org/b/isbn/9780140449013-L.jpg', 'approved',
         jsonb_build_object('author','Иоганн Вольфганг Гёте','year',1832,'pages',512,'genre','Трагедия')),
        ('book'::text, 'Моби Дик',
         'Капитан Ахав преследует по всем океанам гигантского белого кашалота, когда-то оторвавшего ему ногу. Герман Мелвилл превращает китобойный рейс в метафизический эпос.',
         'https://covers.openlibrary.org/b/isbn/9780142437247-L.jpg', 'approved',
         jsonb_build_object('author','Герман Мелвилл','year',1851,'pages',720,'genre','Американская классика')),
        ('book'::text, 'Приключения Гекльберри Финна',
         'Беспризорник Гек и беглый раб Джим спускаются на плоту по Миссисипи — от родного городка к свободе. Марк Твен, по словам Хемингуэя, заложил всю современную американскую литературу.',
         'https://covers.openlibrary.org/b/isbn/9780142437179-L.jpg', 'approved',
         jsonb_build_object('author','Марк Твен','year',1884,'pages',368,'genre','Американская классика'))
    ) as t(type, title, description, image_url, status, metadata)
    where not exists (select 1 from public.content c where c.title = t.title and c.type = t.type);

    -- ---------- EXTRA MOVIES (20) ----------
    insert into public.content (type, title, description, image_url, status, created_by, metadata)
    select t.type, t.title, t.description, t.image_url, t.status, v_admin, t.metadata
    from (values
        ('movie'::text, 'Титаник',
         'Пассажир третьего класса Джек Доусон выигрывает билет на «Титаник» и встречает девушку из высшего общества Розу Дьюитт Бьюкейтер. 1912 год, ночь с 14 на 15 апреля — дальше история. Джеймс Кэмерон собирает одиннадцать «Оскаров».',
         'https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png', 'approved',
         jsonb_build_object('director','Джеймс Кэмерон','year',1997,'duration',194,'genre','Драма, мелодрама','actors','Леонардо ДиКаприо, Кейт Уинслет, Билли Зейн')),
        ('movie'::text, 'Аватар',
         'Парализованный морпех Джейк Салли становится на планете Пандора аватаром — телом в облике местных на’ви — и влюбляется в Нейтири. Революция в 3D-кино от Джеймса Кэмерона.',
         'https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.jpg', 'approved',
         jsonb_build_object('director','Джеймс Кэмерон','year',2009,'duration',162,'genre','Научная фантастика','actors','Сэм Уортингтон, Зои Салдана, Сигурни Уивер')),
        ('movie'::text, 'Властелин колец: Две крепости',
         'Пути членов Братства расходятся: Фродо и Сэм идут к Мордору с проводником Голлумом, Арагорн обороняет Хельмову Падь, Мерри и Пиппин поднимают энтов. Вторая часть трилогии Питера Джексона.',
         'https://upload.wikimedia.org/wikipedia/en/a/a1/Lord_Rings_Two_Towers.jpg', 'approved',
         jsonb_build_object('director','Питер Джексон','year',2002,'duration',179,'genre','Фэнтези','actors','Элайджа Вуд, Вигго Мортенсен, Иэн Маккеллен')),
        ('movie'::text, 'Властелин колец: Возвращение короля',
         'Арагорн ведёт армии людей к Чёрным Вратам Мордора, а Фродо карабкается к жерлу Ородруина. Одиннадцать «Оскаров» и главный финал фэнтези-эпоса Питера Джексона.',
         'https://upload.wikimedia.org/wikipedia/en/4/48/Lord_Rings_Return_King.jpg', 'approved',
         jsonb_build_object('director','Питер Джексон','year',2003,'duration',201,'genre','Фэнтези','actors','Элайджа Вуд, Вигго Мортенсен, Шон Остин')),
        ('movie'::text, 'Апокалипсис сегодня',
         'Вьетнам, 1969 год. Капитана Уилларда отправляют вверх по реке Нанг, чтобы ликвидировать сошедшего с ума полковника Курца. Галлюциногенный эпос Фрэнсиса Форда Копполы о безумии войны.',
         'https://upload.wikimedia.org/wikipedia/en/c/c4/Apocalypse_Now_poster.jpg', 'approved',
         jsonb_build_object('director','Фрэнсис Форд Коппола','year',1979,'duration',153,'genre','Военная драма','actors','Мартин Шин, Марлон Брандо, Роберт Дюваль')),
        ('movie'::text, 'Хороший, плохой, злой',
         'Трое стрелков — Блондинчик, Туко и Ангельские Глазки — ищут сундук с двумя сотнями тысяч долларов на просторах Гражданской войны в США. Итоговый спагетти-вестерн Серджо Леоне.',
         'https://upload.wikimedia.org/wikipedia/en/4/45/Good_the_bad_and_the_ugly_poster.jpg', 'approved',
         jsonb_build_object('director','Серджо Леоне','year',1966,'duration',178,'genre','Вестерн','actors','Клинт Иствуд, Элай Уоллак, Ли Ван Клиф')),
        ('movie'::text, 'Однажды в Америке',
         'Нью-Йорк, еврейский квартал: банда Лапши и Макса проходит путь от подростковых драк на улицах до большой мафии и предательства. Последний шедевр Серджо Леоне.',
         'https://upload.wikimedia.org/wikipedia/en/c/c2/Once_Upon_a_Time_in_America.png', 'approved',
         jsonb_build_object('director','Серджо Леоне','year',1984,'duration',229,'genre','Криминальная драма','actors','Роберт Де Ниро, Джеймс Вудс, Элизабет Макговерн')),
        ('movie'::text, 'Большой куш',
         'Лондон, нелегальный бокс и четырёхкаратный бриллиант, который все хотят увести друг у друга. Возвращение Гая Ричи к формуле «Карты, деньги, два ствола».',
         'https://upload.wikimedia.org/wikipedia/en/a/a7/Snatch_ver4.jpg', 'approved',
         jsonb_build_object('director','Гай Ричи','year',2000,'duration',104,'genre','Криминальная комедия','actors','Джейсон Стейтем, Брэд Питт, Бенисио дель Торо')),
        ('movie'::text, '1+1',
         'Парализованный аристократ Филипп нанимает сиделкой уличного парня Дрисса из пригорода — и получает напарника, который разговаривает с ним как с человеком. Хит Оливье Накаша и Эрика Толедано.',
         'https://upload.wikimedia.org/wikipedia/en/9/93/The_Intouchables.jpg', 'approved',
         jsonb_build_object('director','Оливье Накаш, Эрик Толедано','year',2011,'duration',112,'genre','Комедия, драма','actors','Франсуа Клюзе, Омар Си, Анн Ле Ни')),
        ('movie'::text, 'Зелёная книга',
         'Итало-американский вышибала Тони Липа соглашается повозить по Югу США чернокожего пианиста Дона Ширли. История настоящей дружбы на фоне сегрегации. «Оскар» 2019 года.',
         'https://upload.wikimedia.org/wikipedia/en/5/5b/Green_Book_%282018_poster%29.png', 'approved',
         jsonb_build_object('director','Питер Фаррелли','year',2018,'duration',130,'genre','Биография, драма','actors','Виго Мортенсен, Махершала Али, Линда Карделлини')),
        ('movie'::text, 'Отель «Гранд Будапешт»',
         'Лобби-бой Зеро и легендарный консьерж мсье Густав попадают в историю с завещанием, ценной картиной и фашистскими властями вымышленной Зубровки. Самый пастельный фильм Уэса Андерсона.',
         'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Grand_Budapest_Hotel.png', 'approved',
         jsonb_build_object('director','Уэс Андерсон','year',2014,'duration',99,'genre','Комедия-драма','actors','Рэйф Файнс, Тони Револори, Сирша Ронан')),
        ('movie'::text, 'Джокер',
         'Одинокий клоун и неудавшийся комик Артур Флек постепенно превращается в символ протеста и хаоса Готэма. Сольная драма Тодда Филлипса с оскароносной ролью Хоакина Феникса.',
         'https://upload.wikimedia.org/wikipedia/en/e/e1/Joker_%282019_film%29_poster.jpg', 'approved',
         jsonb_build_object('director','Тодд Филлипс','year',2019,'duration',122,'genre','Драма, триллер','actors','Хоакин Феникс, Роберт Де Ниро, Зази Битц')),
        ('movie'::text, 'Оппенгеймер',
         'Физик Роберт Оппенгеймер возглавляет Манхэттенский проект и создаёт первую атомную бомбу — а потом всю оставшуюся жизнь платит за это. Байопик Кристофера Нолана и «Оскар» 2024 года.',
         'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg', 'approved',
         jsonb_build_object('director','Кристофер Нолан','year',2023,'duration',180,'genre','Биография, драма','actors','Киллиан Мёрфи, Эмили Блант, Роберт Дауни-мл.')),
        ('movie'::text, 'Барби',
         'Идеальная Барби выпадает из Барбиленда в реальный мир и теряет плоскостопие. Грета Гервиг снимает манифест о феминизме, пластике и экзистенциальной тоске.',
         'https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_2023_poster.jpg', 'approved',
         jsonb_build_object('director','Грета Гервиг','year',2023,'duration',114,'genre','Комедия, фэнтези','actors','Марго Робби, Райан Гослинг, Америка Феррера')),
        ('movie'::text, 'Терминатор',
         'Из 2029 года в 1984-й присылают киборга Т-800 убить мать будущего лидера сопротивления Сару Коннор. Дебютный блокбастер Джеймса Кэмерона и классика боевика.',
         'https://upload.wikimedia.org/wikipedia/en/6/6d/The_Terminator.png', 'approved',
         jsonb_build_object('director','Джеймс Кэмерон','year',1984,'duration',107,'genre','Фантастика, боевик','actors','Арнольд Шварценеггер, Линда Хэмилтон, Майкл Бин')),
        ('movie'::text, 'Реквием по мечте',
         'Четыре героя в Нью-Йорке тонут каждый в своей зависимости — от героина до таблеток для похудения. Дарен Аронофски снимает самое жёсткое кино о саморазрушении.',
         'https://upload.wikimedia.org/wikipedia/en/9/92/Requiem_for_a_dream.jpg', 'approved',
         jsonb_build_object('director','Даррен Аронофски','year',2000,'duration',102,'genre','Драма','actors','Эллен Бёрстин, Джаред Лето, Дженнифер Коннелли')),
        ('movie'::text, 'Семь самураев',
         'Японская деревня XVI века нанимает семерых странствующих самураев, чтобы защититься от банды разбойников. Акира Куросава задаёт эталон фильма о команде на все времена.',
         'https://upload.wikimedia.org/wikipedia/en/c/c8/Seven_Samurai_Poster.png', 'approved',
         jsonb_build_object('director','Акира Куросава','year',1954,'duration',207,'genre','Драма, боевик','actors','Тосиро Мифунэ, Такаси Симура, Ёсио Инаба')),
        ('movie'::text, 'Король говорит!',
         'Будущий король Георг VI борется с заиканием с помощью нестандартного логопеда-австралийца накануне Второй мировой. Байопик Тома Хупера и «Оскар» за лучший фильм 2011 года.',
         'https://upload.wikimedia.org/wikipedia/en/4/4a/The_King%27s_Speech_poster.jpg', 'approved',
         jsonb_build_object('director','Том Хупер','year',2010,'duration',118,'genre','Биография, драма','actors','Колин Фёрт, Джеффри Раш, Хелена Бонэм Картер')),
        ('movie'::text, 'Звёздные войны. Эпизод IV: Новая надежда',
         'Юный фермер Люк Скайуокер узнаёт о принцессе Лее и Империи, и вместе с Ханом Соло, Чубаккой и парой дроидов включается в галактическую войну. Фильм, с которого Джордж Лукас начал вселенную.',
         'https://upload.wikimedia.org/wikipedia/en/8/87/StarWarsMoviePoster1977.jpg', 'approved',
         jsonb_build_object('director','Джордж Лукас','year',1977,'duration',121,'genre','Космическая фантастика','actors','Марк Хэмилл, Харрисон Форд, Кэрри Фишер')),
        ('movie'::text, 'Бёрдман',
         'Угасающая звезда супергеройских блокбастеров Риган Томсон пытается вернуться на Бродвей с серьёзной пьесой — и постепенно теряет рассудок. «Оскар» Алехандро Гонсалеса Иньярриту за лучший фильм.',
         'https://upload.wikimedia.org/wikipedia/en/6/63/Birdman_poster.png', 'approved',
         jsonb_build_object('director','Алехандро Гонсалес Иньярриту','year',2014,'duration',119,'genre','Трагикомедия','actors','Майкл Китон, Эдвард Нортон, Эмма Стоун'))
    ) as t(type, title, description, image_url, status, metadata)
    where not exists (select 1 from public.content c where c.title = t.title and c.type = t.type);

end
$seed_extra$;

-- Fix posters для фильмов, если их уже засеяли с неверными URL (404 на upload.wikimedia.org).
-- Эти UPDATE безопасно запускать повторно — WHERE ограничивает только строки со старыми URL.
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png'  where title = 'Титаник'                                 and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/1/19/Titanic_%281997_film%29.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.jpg'   where title = 'Аватар'                                  and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/b/b0/Avatar-Teaser-Poster.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/a/a1/Lord_Rings_Two_Towers.jpg'          where title = 'Властелин колец: Две крепости'           and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/1/15/The_Lord_of_the_Rings_-_The_Two_Towers_%282002%29.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/4/48/Lord_Rings_Return_King.jpg'         where title = 'Властелин колец: Возвращение короля'     and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/b/be/The_Lord_of_the_Rings_-_The_Return_of_the_King_%282003%29.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/4/45/Good_the_bad_and_the_ugly_poster.jpg' where title = 'Хороший, плохой, злой'                 and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/4/4e/Good_the_bad_and_the_ugly_poster.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/c/c2/Once_Upon_a_Time_in_America.png'    where title = 'Однажды в Америке'                       and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/d/db/Once_Upon_a_Time_in_America.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/a/a7/Snatch_ver4.jpg'                    where title = 'Большой куш'                             and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/f/f3/Snatch_poster.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/9/93/The_Intouchables.jpg'               where title = '1+1'                                     and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/5/5e/Intocable_poster.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/5/5b/Green_Book_%282018_poster%29.png'   where title = 'Зелёная книга'                           and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/b/b7/Green_Book_%28film%29.png';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Grand_Budapest_Hotel.png'       where title = 'Отель «Гранд Будапешт»'                  and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/a/a6/The_Grand_Budapest_Hotel_Poster.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_2023_poster.jpg'             where title = 'Барби'                                   and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/4/4a/Barbie_Film_Poster.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/6/6d/The_Terminator.png'                 where title = 'Терминатор'                              and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/9/94/Terminator1984movieposter.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/9/92/Requiem_for_a_dream.jpg'            where title = 'Реквием по мечте'                        and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/f/fb/Requiem_for_a_Dream_%282000%29.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/c/c8/Seven_Samurai_Poster.png'           where title = 'Семь самураев'                           and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/5/5d/Seven_Samurai_poster.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/4/4a/The_King%27s_Speech_poster.jpg'     where title = 'Король говорит!'                         and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/1/19/King%27s_Speech_ver3.jpg';
update public.content set image_url = 'https://upload.wikimedia.org/wikipedia/en/6/63/Birdman_poster.png'                 where title = 'Бёрдман'                                 and type = 'movie' and image_url = 'https://upload.wikimedia.org/wikipedia/en/a/a3/Birdman_poster.jpg';
