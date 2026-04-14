import React from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";

export default function Home() {
  return (
    <>
      <TopNavBar />
      <main className="pt-20 px-6 max-w-7xl mx-auto pb-24">
        {/* Hero Section / Title */}
        <section className="mt-8 mb-12">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Обзор</span>
          <h2 className="text-[3.5rem] font-bold leading-none tracking-tight text-on-surface mt-2">Лента сообщества</h2>
        </section>

        {/* Bento Grid for Feed */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Featured Section: "Новое сегодня" */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold tracking-tight">Новое сегодня</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Все книги</button>
                <button className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Все фильмы</button>
              </div>
            </div>

            {/* Gallery Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Movie Card */}
              <article className="group bg-surface-container-lowest rounded-xl overflow-hidden transition-all shadow-sm">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt="Movie"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe9JLyk6pF9atS8hv95Mxzo_rlqnP72jxUHC7ALSxDlaFz-TYB5Fi4kyBHKSbSXeCzf758hcBfu30KnsXI0ReSegIpH8CXH5V-Rn-x3MLhYyHHccvkYY7QdBnekZplserrbrg8Gy2C6-aXnwADgEwcBiuuY81VhJlQIZq7nSj5maYTWmppbzdgrAy3fAztk2y00-XrZLlfmJAcNlvsDL7VADA1qAM_9C1JF-EtsDduOguOh6ZAS81uSwOOqirHKLqyaTSCt41tTCzg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="bg-secondary-container/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">Movie</span>
                    <h4 className="text-2xl font-bold text-white mt-2">Начало</h4>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
                      <img
                        className="w-full h-full object-cover"
                        alt="User"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD39qb0qOFVvbDntVeCLAfcslAJs4FsM_0mLV0pHXPiG_PyDSaEsInOGUo8raIsLd9878zIYI4W9xwuVlJbb7FaWDzD8HQQB6gY4SzoUgmeKckwbxQHv7q1TZVBZWjJCljixbVk8OMF3hrexfuFEyZriKCB_7hGH43IS9lE34WlhXbUNNmBOfLDPAekG7FsHJZHQQiJfnEPbUk76oA3gdewkK8DnAW2NOrvl5dNaGhkRLMjftaqTmiBkGL3jTlh9dMk99I_RtQjVZC-"
                      />
                    </div>
                    <span className="text-sm font-medium text-on-surface-variant">Добавил @alex_k</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed mb-6">Визуальный шедевр Кристофера Нолана, который заставляет переосмыслить реальность с каждым просмотром.</p>
                  <button className="glass-btn w-full py-4 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95">
                    <span className="material-symbols-outlined">play_arrow</span>
                    Посмотреть
                  </button>
                </div>
              </article>

              {/* Book Card */}
              <article className="group bg-surface-container-lowest rounded-xl overflow-hidden transition-all shadow-sm">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt="Book"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd7Glfrs1ZUlnqgSwsArIljbLvVmD6zryA7-_J3TflmMB-6_701dEEAS963HEMHc17UIzFBskb4GG73igJsjzUj-XmpgiDPA7mShXRlWzwN9jwuMumopACoV4-NVDgsoyAmyYIT1vHXlYk9yjDjFtJwSWDsCM9FVyK_NA5JdR2kh7LnvgFQhg8RMipnYmFIZL0jWv4J7QF7HANmMlmot0G5uz0cYFzwOQCdv9MR6mQVEeDUNCKw09YMONRPGI1mNKrHFdKawqg4N_P"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="bg-secondary-container/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">Book</span>
                    <h4 className="text-2xl font-bold text-white mt-2">Мастер и Маргарита</h4>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
                      <img
                        className="w-full h-full object-cover"
                        alt="User"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMxPqLGsJrXxS3FFycNv6iNXthett-12C8_u80CO9gBgNFJbXqU5UlwB6i4AvV6QE-8s7VliYcXhNVHj7Mo72YImg4EBmaV6Tlc_H45v0FD6_SVFHIQzia2N72Iyykna1Ucp9DQYvcWJBJpDxvqNeWdc6yBL0ZPNdt-_9nplxl7XbRlRrLHeQTY9MAOCa_l0Xst31ISPZpx3DoBsZ86Dy60v-Boz1ocJJd_ehqzDatdcuwTKXjfNU8mw3wAhqIJktHkhqmujCx_UJD"
                      />
                    </div>
                    <span className="text-sm font-medium text-on-surface-variant">Добавил @elena_read</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed mb-6">Бессмертная классика Булгакова о любви, магии и человеческой природе в Москве 1930-х годов.</p>
                  <button className="glass-btn w-full py-4 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95">
                    <span className="material-symbols-outlined">menu_book</span>
                    Читать рецензию
                  </button>
                </div>
              </article>
            </div>
          </div>

          {/* Sidebar Content */}
          <aside className="md:col-span-4 space-y-12">
            {/* Trending Collections */}
            <div className="bg-surface-container-low p-8 rounded-2xl">
              <h3 className="text-lg font-semibold mb-6">Популярные клубы</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">auto_stories</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Детективы ХХ века</p>
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">1.2k участников</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">movie_filter</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Артхаус и нуар</p>
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">850 участников</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">history_edu</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">История кино</p>
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">2.4k участников</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-3 text-sm font-bold text-primary bg-surface-container-highest rounded-lg hover:opacity-80 transition-opacity">
                Посмотреть все клубы
              </button>
            </div>

            {/* Suggested Critics */}
            <div className="px-4">
              <h3 className="text-lg font-semibold mb-6">Активные критики</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200">
                      <img
                        className="w-full h-full object-cover rounded-full"
                        alt="Critic"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUmYum-sP8-LmyJXRvdqfXy-MAeY-oxNj8FzR_-Q0ulJ0vRHYFrHG8GkD9Bp5mYgT8YWxumfl_15tWxm0ZOPzoKg5_277BPZxZewPw4KemjYMUQDN-IG_quzCLtfldwMcxyi8li8blhoacBsf9JWAxPYrWNswOa9dgiXgfBDuE1PmlsJXE-eTRetlSBuGMcD9lmDCuznOCaW_dtWuRfGJAve7ZcTrH8-wBaDCfTQxO23TGodhRz85g4Un6zJDm-AJRDNN3fWisf6f8"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">@sergey_films</p>
                      <p className="text-xs text-on-surface-variant">42 рецензии</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-primary tracking-widest uppercase">Follow</button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200">
                      <img
                        className="w-full h-full object-cover rounded-full"
                        alt="Critic"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbyw3SFsBd6zMQ5IRN7sus8UksEU9JrYcaeWbsTctd_hTEMB_EyXEaU998kwpWeXNS5dN0OaFVHlahHJvMGZD5vomiJwRhfxjUm4MiGNhnp7R6taZurzB-9hvbWgbAUUAgXggPacctt9ei1_DICoi1VQQLHbw6w5mQ3ctTVX1xPNjUE0bpyFACc0EnJhcuCnBY2zBJRG6sLvX6331c-O2jJ0LkbxhrAO31dDyA_GzaG_ybHE_H_9tsSoKECFy7IrItVOk9KwNacT8u"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">@maria_books</p>
                      <p className="text-xs text-on-surface-variant">128 рецензий</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-primary tracking-widest uppercase">Follow</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* FAB: Post Something */}
      <button className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-14 h-14 glass-btn rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform z-50">
        <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>add</span>
      </button>

      <BottomNavBar activeTab="home" />
    </>
  );
}
