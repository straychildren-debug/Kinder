-- =====================================================================
-- Seed content — 10 books + 10 movies (titles/authors in Russian)
--
-- Applies via Supabase SQL Editor. Idempotent: skips rows whose title
-- already exists. Uses the first available admin/superadmin/moderator
-- as created_by. Images are deterministic Picsum placeholders so that
-- covers render consistently without relying on external CDNs we don't
-- trust.
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

    -- ---------- BOOKS ----------
    insert into public.content (type, title, description, image_url, status, created_by, metadata)
    select t.type, t.title, t.description, t.image_url, t.status, v_admin, t.metadata
    from (values
        (
            'book'::text,
            'Мастер и Маргарита',
            'Роман Михаила Булгакова, над которым автор работал последние двенадцать лет жизни. Три сюжетные линии — сатирическая московская, библейская ершалаимская и мистическая свита Воланда — сходятся в размышлении о трусости, любви и свободе.',
            'https://picsum.photos/seed/master-i-margarita/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Михаил Булгаков',
                'year', 1967,
                'pages', 480,
                'genre', 'Современная русская классика'
            )
        ),
        (
            'book'::text,
            'Преступление и наказание',
            'Петербургский студент Родион Раскольников совершает убийство старухи-процентщицы, чтобы проверить теорию о «праве сильного». Достоевский превращает детективную канву в глубочайшее исследование совести и вины.',
            'https://picsum.photos/seed/prestuplenie-i-nakazanie/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Фёдор Достоевский',
                'year', 1866,
                'pages', 672,
                'genre', 'Русская классика'
            )
        ),
        (
            'book'::text,
            'Война и мир',
            'Эпопея Льва Толстого о русском обществе в эпоху Наполеоновских войн. Судьбы Болконских, Ростовых, Безухова переплетаются с историей Отечественной войны 1812 года.',
            'https://picsum.photos/seed/voyna-i-mir/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Лев Толстой',
                'year', 1869,
                'pages', 1300,
                'genre', 'Исторический роман'
            )
        ),
        (
            'book'::text,
            '1984',
            'Антиутопия Джорджа Оруэлла о государстве тотальной слежки, где Партия контролирует прошлое, настоящее и даже мысли граждан. Уинстон Смит пытается сохранить личность в мире новояза и двоемыслия.',
            'https://picsum.photos/seed/1984-orwell/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Джордж Оруэлл',
                'year', 1949,
                'pages', 328,
                'genre', 'Антиутопия'
            )
        ),
        (
            'book'::text,
            'Сто лет одиночества',
            'Хроника семи поколений семьи Буэндиа в вымышленном городке Макондо. Главный образец магического реализма: реальное и мифическое сплетаются в портрет Латинской Америки XX века.',
            'https://picsum.photos/seed/sto-let-odinochestva/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Габриэль Гарсиа Маркес',
                'year', 1967,
                'pages', 448,
                'genre', 'Магический реализм'
            )
        ),
        (
            'book'::text,
            'Великий Гэтсби',
            'История загадочного миллионера Джея Гэтсби, его любви к Дэзи Бьюкенен и краха американской мечты в ревущих двадцатых. Классика американской литературы XX века.',
            'https://picsum.photos/seed/velikiy-getsbi/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Фрэнсис Скотт Фицджеральд',
                'year', 1925,
                'pages', 224,
                'genre', 'Американская классика'
            )
        ),
        (
            'book'::text,
            'Убить пересмешника',
            'Алабама тридцатых годов глазами девочки Глазастика. Её отец, адвокат Аттикус Финч, берётся защищать чернокожего, обвинённого в преступлении, которого не совершал.',
            'https://picsum.photos/seed/ubit-peresmeshnika/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Харпер Ли',
                'year', 1960,
                'pages', 384,
                'genre', 'Социальная драма'
            )
        ),
        (
            'book'::text,
            'Норвежский лес',
            'Роман Харуки Мураками о студенте Тору Ватанабэ, двух женщинах в его жизни и травмах юности в Токио конца шестидесятых. Меланхоличная проза взросления под звуки The Beatles.',
            'https://picsum.photos/seed/norvezhskiy-les/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Харуки Мураками',
                'year', 1987,
                'pages', 360,
                'genre', 'Современная проза'
            )
        ),
        (
            'book'::text,
            'Мы',
            'Первая в истории антиутопия. Евгений Замятин показывает тоталитарное Единое Государство XXX века, где люди — «нумера», а свобода объявлена несчастьем.',
            'https://picsum.photos/seed/my-zamyatin/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Евгений Замятин',
                'year', 1920,
                'pages', 240,
                'genre', 'Антиутопия'
            )
        ),
        (
            'book'::text,
            'Гарри Поттер и философский камень',
            'Сирота Гарри в день одиннадцатилетия узнаёт, что он волшебник, и отправляется в школу Хогвартс. Первая книга всемирной саги Джоан Роулинг.',
            'https://picsum.photos/seed/garry-potter-1/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Джоан Роулинг',
                'year', 1997,
                'pages', 352,
                'genre', 'Фэнтези'
            )
        ),
        (
            'book'::text,
            'Анна Каренина',
            'Трагедия светской женщины, которая ради любви бросила вызов общественной морали Петербурга. Параллельная линия — семейная идиллия Кити и Лёвина — уравновешивает разрушение.',
            'https://picsum.photos/seed/anna-karenina/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Лев Толстой',
                'year', 1877,
                'pages', 864,
                'genre', 'Русская классика'
            )
        ),
        (
            'book'::text,
            'Евгений Онегин',
            'Роман в стихах, энциклопедия русской жизни. Онегин, Татьяна, Ленский и Ольга проходят путь от юности к расплате за упущенные чувства.',
            'https://picsum.photos/seed/evgeniy-onegin/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Александр Пушкин',
                'year', 1833,
                'pages', 256,
                'genre', 'Роман в стихах'
            )
        ),
        (
            'book'::text,
            'Идиот',
            'Князь Мышкин возвращается в Россию, чтобы столкнуться с блистательным и жестоким светом Петербурга. Достоевский выводит в нём идеал «положительно прекрасного человека».',
            'https://picsum.photos/seed/idiot-dostoevskiy/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Фёдор Достоевский',
                'year', 1869,
                'pages', 640,
                'genre', 'Русская классика'
            )
        ),
        (
            'book'::text,
            'Тихий Дон',
            'Эпос Михаила Шолохова о донском казачестве в годы Первой мировой, революции и гражданской войны. История Григория Мелехова — человека, разорванного эпохой.',
            'https://picsum.photos/seed/tikhiy-don/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Михаил Шолохов',
                'year', 1940,
                'pages', 1536,
                'genre', 'Эпический роман'
            )
        ),
        (
            'book'::text,
            'Старик и море',
            'Старый кубинский рыбак Сантьяго выходит в море и восемьдесят четыре дня не ловит ничего. А потом наступает схватка его жизни. Нобелевская повесть Хемингуэя.',
            'https://picsum.photos/seed/starik-i-more/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Эрнест Хемингуэй',
                'year', 1952,
                'pages', 128,
                'genre', 'Повесть'
            )
        ),
        (
            'book'::text,
            'Над пропастью во ржи',
            'Голдену Колфилду шестнадцать, его выгнали из третьей школы, и он бродит по Нью-Йорку, рассказывая нам о лицемерии взрослых. Голос поколения от Джерома Сэлинджера.',
            'https://picsum.photos/seed/nad-propastyu-vo-rzhi/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Джером Сэлинджер',
                'year', 1951,
                'pages', 272,
                'genre', 'Современная проза'
            )
        ),
        (
            'book'::text,
            'Маленький принц',
            'Лётчик терпит аварию в Сахаре и встречает мальчика с далёкой планеты. Философская сказка Антуана де Сент-Экзюпери для детей и взрослых.',
            'https://picsum.photos/seed/malenkiy-princ/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Антуан де Сент-Экзюпери',
                'year', 1943,
                'pages', 96,
                'genre', 'Философская сказка'
            )
        ),
        (
            'book'::text,
            'Цветы для Элджернона',
            'Чарли Гордон — уборщик с умственной отсталостью — соглашается на экспериментальную операцию. Его дневник превращается в одну из самых пронзительных книг XX века.',
            'https://picsum.photos/seed/cvety-dlya-eldzhernona/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Дэниел Киз',
                'year', 1966,
                'pages', 320,
                'genre', 'Научная фантастика'
            )
        ),
        (
            'book'::text,
            'Убийство в Восточном экспрессе',
            'Поезд застрял в снегу, один из пассажиров убит. Эркюль Пуаро выясняет, что мотив есть у каждого. Классический детектив Агаты Кристи.',
            'https://picsum.photos/seed/ubiystvo-v-vostochnom-ekspresse/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Агата Кристи',
                'year', 1934,
                'pages', 288,
                'genre', 'Детектив'
            )
        ),
        (
            'book'::text,
            'Задача трёх тел',
            'Китайские учёные в разгар Культурной революции устанавливают контакт с инопланетной цивилизацией — и человечество оказывается на пороге вторжения. Первый роман трилогии Лю Цысиня.',
            'https://picsum.photos/seed/zadacha-treh-tel/400/600',
            'approved',
            jsonb_build_object(
                'author', 'Лю Цысинь',
                'year', 2008,
                'pages', 432,
                'genre', 'Твёрдая научная фантастика'
            )
        )
    ) as t(type, title, description, image_url, status, metadata)
    where not exists (select 1 from public.content c where c.title = t.title and c.type = t.type);

    -- ---------- MOVIES ----------
    insert into public.content (type, title, description, image_url, status, created_by, metadata)
    select t.type, t.title, t.description, t.image_url, t.status, v_admin, t.metadata
    from (values
        (
            'movie'::text,
            'Крёстный отец',
            'Сага Фрэнсиса Форда Копполы о семье сицилийских иммигрантов Корлеоне в послевоенной Америке. Отец — дон Вито, младший сын Майкл — наследник, который не хотел становиться мафиози.',
            'https://picsum.photos/seed/krestnyy-otets/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Фрэнсис Форд Коппола',
                'year', 1972,
                'duration', 175,
                'genre', 'Криминальная драма',
                'actors', 'Марлон Брандо, Аль Пачино, Джеймс Каан'
            )
        ),
        (
            'movie'::text,
            'Начало',
            'Дом Кобб — вор, умеющий красть идеи прямо из снов. Последнее задание: вместо кражи мысль нужно внедрить. Интеллектуальный блокбастер Кристофера Нолана.',
            'https://picsum.photos/seed/nachalo-inception/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Кристофер Нолан',
                'year', 2010,
                'duration', 148,
                'genre', 'Научная фантастика',
                'actors', 'Леонардо ДиКаприо, Джозеф Гордон-Левитт, Эллен Пейдж'
            )
        ),
        (
            'movie'::text,
            'Побег из Шоушенка',
            'Банкир Энди Дюфрейн попадает в тюрьму Шоушенк за убийство жены, которого не совершал. История дружбы, надежды и терпения длиной почти в два десятилетия.',
            'https://picsum.photos/seed/pobeg-iz-shoushenka/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Фрэнк Дарабонт',
                'year', 1994,
                'duration', 142,
                'genre', 'Драма',
                'actors', 'Тим Роббинс, Морган Фриман'
            )
        ),
        (
            'movie'::text,
            'Интерстеллар',
            'Земля умирает. Бывший пилот Купер уходит сквозь червоточину искать человечеству новый дом, оставляя дочь на грани смерти от пыли. Эпос Кристофера Нолана о времени и любви.',
            'https://picsum.photos/seed/interstellar/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Кристофер Нолан',
                'year', 2014,
                'duration', 169,
                'genre', 'Научная фантастика',
                'actors', 'Мэттью Макконахи, Энн Хэтэуэй, Джессика Честейн'
            )
        ),
        (
            'movie'::text,
            'Однажды в Голливуде',
            'Квентин Тарантино переписывает хронику Лос-Анджелеса 1969 года. Звезда сериалов Рик Долтон и его дублёр Клифф Бут живут рядом с Шэрон Тейт накануне ночи, изменившей эпоху.',
            'https://picsum.photos/seed/odnazhdy-v-gollivude/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Квентин Тарантино',
                'year', 2019,
                'duration', 161,
                'genre', 'Комедия-драма',
                'actors', 'Леонардо ДиКаприо, Брэд Питт, Марго Робби'
            )
        ),
        (
            'movie'::text,
            'Зелёная миля',
            'Охранник блока смертников Пол Эджкомб встречает заключённого с необъяснимым даром. Экранизация Стивена Кинга от Фрэнка Дарабонта.',
            'https://picsum.photos/seed/zelenaya-milya/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Фрэнк Дарабонт',
                'year', 1999,
                'duration', 189,
                'genre', 'Драма, фэнтези',
                'actors', 'Том Хэнкс, Майкл Кларк Дункан'
            )
        ),
        (
            'movie'::text,
            'Матрица',
            'Программист Нео узнаёт, что окружающий мир — иллюзия, сгенерированная машинами. Революционный научно-фантастический боевик сестёр Вачовски.',
            'https://picsum.photos/seed/matrica-matrix/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Лана и Лилли Вачовски',
                'year', 1999,
                'duration', 136,
                'genre', 'Фантастика, боевик',
                'actors', 'Киану Ривз, Лоуренс Фишбёрн, Кэрри-Энн Мосс'
            )
        ),
        (
            'movie'::text,
            'Брат 2',
            'Данила Багров отправляется в Чикаго мстить за гибель друга и заодно находит справедливость по-своему. Культовый фильм Алексея Балабанова и зеркало девяностых.',
            'https://picsum.photos/seed/brat-2/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Алексей Балабанов',
                'year', 2000,
                'duration', 127,
                'genre', 'Криминальный боевик',
                'actors', 'Сергей Бодров-мл., Виктор Сухоруков'
            )
        ),
        (
            'movie'::text,
            'Левиафан',
            'Автомеханик Николай защищает дом от мэра провинциального города, который хочет снести его землю. Андрей Звягинцев рисует современную русскую трагедию.',
            'https://picsum.photos/seed/leviafan/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Андрей Звягинцев',
                'year', 2014,
                'duration', 140,
                'genre', 'Драма',
                'actors', 'Алексей Серебряков, Елена Лядова, Роман Мадянов'
            )
        ),
        (
            'movie'::text,
            'Иди и смотри',
            'Белоруссия, 1943 год. Подросток Флёра попадает в партизанский отряд и проходит через ад карательных операций. Фильм Элема Климова — один из сильнейших о войне.',
            'https://picsum.photos/seed/idi-i-smotri/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Элем Климов',
                'year', 1985,
                'duration', 142,
                'genre', 'Военная драма',
                'actors', 'Алексей Кравченко, Ольга Миронова'
            )
        ),
        (
            'movie'::text,
            'Форрест Гамп',
            'Парень с низким IQ проходит через полвека американской истории: Вьетнам, пинг-понг, креветочный бизнес. И всегда помнит про Дженни. Роберт Земекис о случайности и доброте.',
            'https://picsum.photos/seed/forrest-gump/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Роберт Земекис',
                'year', 1994,
                'duration', 142,
                'genre', 'Драма',
                'actors', 'Том Хэнкс, Робин Райт, Гари Синиз'
            )
        ),
        (
            'movie'::text,
            'Криминальное чтиво',
            'Четыре переплетённые истории из жизни лос-анджелесского криминала: бандиты-философы, боксёр, жена босса и два случайных грабителя. Тарантино, перевернувший девяностые.',
            'https://picsum.photos/seed/kriminalnoe-chtivo/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Квентин Тарантино',
                'year', 1994,
                'duration', 154,
                'genre', 'Криминальная комедия',
                'actors', 'Джон Траволта, Сэмюэл Л. Джексон, Ума Турман'
            )
        ),
        (
            'movie'::text,
            'Список Шиндлера',
            'Немецкий промышленник Оскар Шиндлер использует свой завод, чтобы спасти более тысячи евреев от Холокоста. Чёрно-белый шедевр Стивена Спилберга.',
            'https://picsum.photos/seed/spisok-shindlera/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Стивен Спилберг',
                'year', 1993,
                'duration', 195,
                'genre', 'Историческая драма',
                'actors', 'Лиам Нисон, Бен Кингсли, Рэйф Файнс'
            )
        ),
        (
            'movie'::text,
            'Властелин колец: Братство Кольца',
            'Хоббит Фродо получает древнее Кольцо Всевластья и отправляется с восемью соратниками уничтожить его в жерле Ородруина. Первая часть эпопеи Питера Джексона.',
            'https://picsum.photos/seed/vlastelin-kolec-1/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Питер Джексон',
                'year', 2001,
                'duration', 178,
                'genre', 'Фэнтези',
                'actors', 'Элайджа Вуд, Иэн Маккеллен, Вигго Мортенсен'
            )
        ),
        (
            'movie'::text,
            'Бойцовский клуб',
            'Страдающий бессонницей клерк встречает обаятельного торговца мылом Тайлера Дёрдена, и вместе они основывают подпольные бойцовские клубы. Дэвид Финчер о кризисе мужественности.',
            'https://picsum.photos/seed/boycovskiy-klub/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Дэвид Финчер',
                'year', 1999,
                'duration', 139,
                'genre', 'Драма, триллер',
                'actors', 'Брэд Питт, Эдвард Нортон, Хелена Бонем Картер'
            )
        ),
        (
            'movie'::text,
            'Сталкер',
            'В Зоне — охраняемой территории с необъяснимыми аномалиями — есть Комната, исполняющая заветные желания. Писатель и Профессор нанимают Сталкера, чтобы туда попасть. Фильм Андрея Тарковского.',
            'https://picsum.photos/seed/stalker-tarkovskiy/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Андрей Тарковский',
                'year', 1979,
                'duration', 162,
                'genre', 'Философская фантастика',
                'actors', 'Александр Кайдановский, Анатолий Солоницын, Николай Гринько'
            )
        ),
        (
            'movie'::text,
            'Москва слезам не верит',
            'Три провинциалки приезжают покорять Москву шестидесятых. Двадцать лет спустя у каждой своя судьба. Оскароносная мелодрама Владимира Меньшова.',
            'https://picsum.photos/seed/moskva-slezam-ne-verit/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Владимир Меньшов',
                'year', 1979,
                'duration', 148,
                'genre', 'Мелодрама',
                'actors', 'Вера Алентова, Алексей Баталов, Ирина Муравьёва'
            )
        ),
        (
            'movie'::text,
            'Дюна',
            'На пустынной планете Арракис добывают главное вещество Вселенной — Пряность. Юный наследник дома Атрейдес Пол должен стать пророком. Экранизация Фрэнка Герберта от Дени Вильнёва.',
            'https://picsum.photos/seed/dyuna-denis-villeneuve/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Дени Вильнёв',
                'year', 2021,
                'duration', 156,
                'genre', 'Научная фантастика',
                'actors', 'Тимоти Шаламе, Ребекка Фергюсон, Оскар Айзек'
            )
        ),
        (
            'movie'::text,
            'Паразиты',
            'Бедная сеульская семья Ким постепенно внедряется в дом богачей Пак — и вскрывает классовую пропасть в корейском обществе. «Золотая пальмовая ветвь» и «Оскар» Пон Джун-хо.',
            'https://picsum.photos/seed/parazity-parasite/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Пон Джун-хо',
                'year', 2019,
                'duration', 132,
                'genre', 'Социальный триллер',
                'actors', 'Сон Кан-хо, Ли Сон-гюн, Чо Ё-джон'
            )
        ),
        (
            'movie'::text,
            'Джентльмены',
            'Американец Микки Пирсон построил в Британии марихуановую империю и решает продать бизнес. Мгновенно разгорается война интересов. Возвращение Гая Ричи к стилю «Большого куша».',
            'https://picsum.photos/seed/dzhentlmeny-gentlemen/400/600',
            'approved',
            jsonb_build_object(
                'director', 'Гай Ричи',
                'year', 2019,
                'duration', 113,
                'genre', 'Криминальная комедия',
                'actors', 'Мэттью Макконахи, Чарли Ханнэм, Хью Грант, Колин Фаррелл'
            )
        )
    ) as t(type, title, description, image_url, status, metadata)
    where not exists (select 1 from public.content c where c.title = t.title and c.type = t.type);

end
$seed$;

-- Quick check:
-- select type, title, (metadata->>'year')::int as year, status
--   from public.content
--   where title in (
--      'Мастер и Маргарита','Крёстный отец','Левиафан'
--   )
--   order by type, title;
