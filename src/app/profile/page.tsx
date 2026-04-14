import React from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";

export default function Profile() {
  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        {/* Hero Section / User Profile */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 items-start">
          <div className="md:col-span-4 flex flex-col items-center md:items-start space-y-6">
            <div className="relative group">
              <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <img
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCsGKGj36vgW6CPCQdpSQxlsEumutf5W60_C4V9oqOWrA5GjVy3KOfr7g65EJLTUNEZngqPXqdk3DLL-sYjp5C487YIDPG0QaiE88f3BKILJh41Hvj0oiMwRbEyJ8oGiv_2DMSrNn8U3N5lyXm9ZkQ1NO_PHtqp0dIO-eOueGZMlvoqGhAtdbU9ra9rM3J_4nIQAHLr25skNrQg8-crUygTgjz4O1dQVQ05ZLH1Nx2WaXfJ4q30sHVbdZjQqWef1m1lCA99uorZBgy"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-on-surface">Анастасия Волкова</h1>
              <p className="text-on-surface-variant font-medium">Кинокритик и Библиофил</p>
              <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                <div className="text-center">
                  <span className="block text-xl font-bold">142</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Рецензии</span>
                </div>
                <div className="text-center px-4 border-x border-outline-variant/20">
                  <span className="block text-xl font-bold">2.4k</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Подписчики</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold">89</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Награды</span>
                </div>
              </div>
            </div>
            {/* Glassmorphism Edit Button */}
            <button className="w-full md:w-auto px-8 py-4 glass-action text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Редактировать профиль
            </button>
          </div>

          <div className="md:col-span-8 space-y-12">
            {/* Achievements Bento */}
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-6">Награды</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4 transition-all hover:bg-white">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <div>
                    <h3 className="font-bold text-on-surface">Золотое перо</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">За 50+ детальных обзоров классики</p>
                  </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>movie_filter</span>
                  <div>
                    <h3 className="font-bold text-on-surface">Киноман 2024</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Просмотрено 100 фильмов за год</p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4 col-span-2 md:col-span-1">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
                  <div>
                    <h3 className="font-bold text-on-surface">Архивариус</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Редкие находки немого кино</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">Мои рецензии</h2>
                <span className="text-sm font-semibold text-primary">Показать все</span>
              </div>
              <div className="space-y-6">
                {/* Review Card 1 */}
                <div className="bg-surface-container-lowest rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm">
                  <div className="md:w-1/3 h-48 md:h-auto">
                    <img
                      alt="Movie Poster"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB3RI_Wr6b1ecVojyUG3mVKrL0PhqwzNo5KjyW2jTMsJ2C8XsJRZK4p2NvUub3DJP4MNQmDQRACEClsqu9NhI0iWWokA9zZES96cZiO-8FHiRomGH8c2qMaA-AovaB9ZOoW3YK_26EhAaPpXkYBSQvGxIyn-bENaacETr5UlOaIK2v4-mZ8ZZjxYy0pddfGXOBPJeAnyMhH52Vn4hdfa-4pr0CyZsvSUyMNxOKTiXZKlFb7Mm0QIpZTXs9oeJlpAjMtX21Jq1IZQI9"
                    />
                  </div>
                  <div className="md:w-2/3 p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-on-surface">Начало (2010)</h3>
                          <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">Фильм • Кристофер Нолан</p>
                        </div>
                        <div className="bg-secondary-container px-3 py-1 rounded-lg text-on-secondary-container font-bold flex items-center gap-1">
                          <span>9.5</span>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                      </div>
                      <p className="text-on-surface-variant text-sm leading-relaxed italic">
                        &quot;Глубокое погружение в архитектуру сновидений. Нолан мастерски сплетает уровни реальности, создавая не просто блокбастер, а интеллектуальный лабиринт...&quot;
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                          <span className="text-xs font-bold">1.2k</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                          <span className="text-xs font-bold">45</span>
                        </button>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-medium">Опубликовано 2 дня назад</span>
                    </div>
                  </div>
                </div>

                {/* Review Card 2 */}
                <div className="bg-surface-container-lowest rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm">
                  <div className="md:w-1/3 h-48 md:h-auto">
                    <img
                      alt="Book Cover"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzQuDOEEnGmglIaorywKmINTAFmtc8gBAdRSYjboOmRFwBoiElcirmLavLEhwMq6U76kjnntgiAsxdQCnQXQ0adO8SzlFp13oveUnGpV2CME1F-HczVveD-NMnrk4vjHlOoEK-W36O2h9FgVHt0T6jr-6wrM0oJAPeWfd2gbOg7xVWM1E9M7UI5UVroul2Rhkopwo59SpJ_mUutlYFFQVKcu-ic2H52rYi8Un48lBv9w1S0ozSoVM_0bIBT0dy7DvEvyJogNGQKS_X"
                    />
                  </div>
                  <div className="md:w-2/3 p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-on-surface">Преступление и наказание</h3>
                          <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">Книга • Ф. Достоевский</p>
                        </div>
                        <div className="bg-secondary-container px-3 py-1 rounded-lg text-on-secondary-container font-bold flex items-center gap-1">
                          <span>10</span>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                      </div>
                      <p className="text-on-surface-variant text-sm leading-relaxed italic">
                        &quot;Психологическая бездна, в которую Достоевский заставляет нас заглянуть. Это не просто история убийства, а монументальное исследование человеческой совести...&quot;
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                          <span className="text-xs font-bold">856</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                          <span className="text-xs font-bold">12</span>
                        </button>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-medium">Опубликовано 1 неделю назад</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <BottomNavBar activeTab="profile" />
    </>
  );
}
