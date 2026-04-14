import React from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";

export default function BookDetails() {
  return (
    <>
      <TopNavBar leftIcon="arrow_back" rightIcon="share" />
      <main className="pt-24 pb-32 px-4 md:px-12 max-w-7xl mx-auto">
        {/* Hero Section: Book Details */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start mb-20">
          {/* Asymmetrical Book Cover */}
          <div className="md:col-span-5 lg:col-span-4 relative group">
            <div className="absolute -inset-4 bg-surface-container rounded-xl -rotate-2 z-0"></div>
            <img
              className="relative z-10 w-full aspect-[2/3] object-cover rounded-lg shadow-2xl transition-transform group-hover:scale-[1.02] duration-500"
              alt="Premium book cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhKW8-nd0TIs--x9AUHCPGhRUlhBp78XZ3eYyGuWcVtO8hP0qu3zf0UzlkxSmGUnNs9BVkAsRz0gwcyHKbHChI66omnUmue7y2-hlQWHQNNwfbZVraHDTKCMxzSYV-_53QoWk6bN4L_rzJiayhwVTfKtcQiIsQ940aGkrrxXaInmBHyzzP8aoM5DQ_vQR0XjKwF6UIjj4FYby7_NhWUpUbdItSFqHpuckX-Kf2Jn6qRAseL6aiZA41MLSwQki_V_d2jFLr4c9HTbo7"
            />
          </div>

          {/* Content Area */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-8">
            <div className="space-y-4">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-primary">Классика литературы</span>
              <h2 className="text-5xl md:text-6xl font-bold text-on-surface tracking-tight leading-none">О дивный новый мир</h2>
              <p className="text-xl text-on-surface-variant font-medium">Олдос Хаксли</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="bg-secondary-container px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-on-secondary-container font-bold">4.8</span>
              </div>
              <span className="text-on-surface-variant text-sm">2,450 оценок</span>
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-l-4 border-primary pl-4 uppercase tracking-wider text-primary">О книге</h3>
              <p className="text-on-surface-variant leading-relaxed max-w-2xl">
                Культовая антиутопия Олдоса Хаксли о генетически программируемом обществе потребления. В этом мире нет места страданиям, но нет и места человечности. Каждому суждена своя роль — от Альф до Эпсилонов, и каждый обязан быть счастлив под воздействием сомы. Однако Дикарь, выросший вне цивилизации, бросает вызов этому совершенному, но пустому порядку.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-1.5 bg-surface-container-low text-on-surface text-sm rounded-full">Антиутопия</span>
              <span className="px-4 py-1.5 bg-surface-container-low text-on-surface text-sm rounded-full">Философия</span>
              <span className="px-4 py-1.5 bg-surface-container-low text-on-surface text-sm rounded-full">Классика XX века</span>
            </div>
          </div>
        </section>

        {/* Glassmorphism Action Bar */}
        <div className="sticky top-20 z-40 py-4 flex justify-between items-center mb-12">
          <h3 className="text-2xl font-semibold tracking-tight text-on-surface">Рецензии</h3>
          <button className="glass-button text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">edit_square</span>
            <span className="font-semibold text-sm uppercase tracking-wide">Написать отзыв</span>
          </button>
        </div>

        {/* Bento Grid Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Review Card 1 (Large) */}
          <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img
                  className="w-12 h-12 rounded-full object-cover"
                  alt="Avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJo8C1Dt7XKlmLz2DVxRo0Kg4kSIJQuET-oyAQKu0h3sHgbARj06FByEza77cr2kzky4E9AaSQC8fCnyUcz-NZD2m3yUrasx2BoHIwo2omacJTVoLuXtv7hbHis66W8EKeVvl9SnHYSeYIaMXFz0H4yLI2F52IiotJhakk7jivM_AVFLlR_KMrCBTNOcNwpZJxA3L4Cu_aXtjMALCPffIEySYXd2WBECghOQDgNtbWuLLKlaYmsuGVjCTSxS7IjNMnklrNPchGMhXx"
                />
                <div>
                  <p className="font-semibold text-on-surface">Александр Воронин</p>
                  <p className="text-xs text-on-surface-variant">Топ-критик • 12 минут назад</p>
                </div>
              </div>
              <div className="flex gap-1 text-primary">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
            <p className="text-on-surface leading-relaxed text-lg italic">
              &laquo;Пророческая работа, которая с каждым десятилетием становится все актуальнее. Хаксли пугает не насилием, а комфортом, который лишает нас души.&raquo;
            </p>
            <div className="pt-4 flex gap-6 border-t border-surface-container">
              <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">thumb_up</span>
                <span className="text-sm font-medium">124</span>
              </button>
              <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">forum</span>
                <span className="text-sm font-medium">Обсуждение (12)</span>
              </button>
            </div>

            {/* Nested Discussions */}
            <div className="pl-8 space-y-6 mt-6 border-l-2 border-surface-container">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">Елена М.</span>
                  <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant">4 часа назад</span>
                </div>
                <p className="text-sm text-on-surface-variant">Согласна, сома в нашем мире — это бесконечный скроллинг ленты соцсетей.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">Марк Г.</span>
                  <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant">2 часа назад</span>
                </div>
                <p className="text-sm text-on-surface-variant">Интересно сравнение с Оруэллом. Хаксли предсказал будущее гораздо точнее.</p>
              </div>
            </div>
          </div>

          {/* Sidebar Stats / Secondary Cards */}
          <div className="space-y-6">
            {/* Rating Summary */}
            <div className="bg-surface-container-high p-8 rounded-xl space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Рейтинг сообщества</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold w-4">5</span>
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[85%]"></div>
                  </div>
                  <span className="text-xs text-on-surface-variant">85%</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold w-4">4</span>
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[10%]"></div>
                  </div>
                  <span className="text-xs text-on-surface-variant">10%</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold w-4">3</span>
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[3%]"></div>
                  </div>
                  <span className="text-xs text-on-surface-variant">3%</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold w-4">2</span>
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[2%]"></div>
                  </div>
                  <span className="text-xs text-on-surface-variant">2%</span>
                </div>
              </div>
            </div>

            {/* Secondary Review Card */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <img
                  className="w-10 h-10 rounded-full object-cover"
                  alt="Avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQK0K0bBTug8HhAV1zzsMsabnmbwfFWSOqiyUkQ_lVXXYDReYxli6MDrad4f2jYKxTAB1ARdel-fgUSSoYz8OvP6V3QqE5hwhYzT-pNnSC55lBSy29YlhqrjV1kJew0PUwBZTnGZBzVNTTPc_WnC2PC2zMqR66wHTpD9GxxU_HILMQboOgmSWUc2vFu8O9blCFE07yAwbCAabhOWbPTEYvlYJg_QzGRIDARsWt2T8XIwrtnobd0DU7AG4pa3xje03WvT69SAxDv5FI"
                />
                <div>
                  <p className="font-semibold text-sm">Мария Петрова</p>
                  <p className="text-[10px] text-on-surface-variant uppercase">Вчера</p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant line-clamp-3">
                Книга, которую нужно перечитывать каждые пять лет. Каждый раз открываешь новые смыслы в диалогах Мустафы Монда.
              </p>
            </div>
          </div>
        </div>
      </main>
      <BottomNavBar activeTab="books" />
    </>
  );
}
