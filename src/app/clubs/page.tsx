import React from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";

export default function Clubs() {
  const [showToast, setShowToast] = React.useState(false);

  const handleCreateClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-6 max-w-7xl mx-auto pb-24">
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 block">Сообщество</span>
            <h1 className="text-5xl font-bold tracking-tight text-on-surface">Клубы</h1>
          </div>
          {/* FAB-style Glassmorphism Action */}
          <button 
            onClick={handleCreateClick}
            className="glass-action text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/10 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-semibold text-sm">Создать клуб</span>
          </button>
        </header>

        {/* Плавающее уведомление */}
        {showToast && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface px-6 py-3 rounded-2xl shadow-2xl border border-primary/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 z-[100]">
            <span className="material-symbols-outlined text-primary">info</span>
            <span className="text-sm font-bold tracking-tight text-on-surface">Функционал создания клубов находится в разработке</span>
          </div>
        )}

        {/* Bento Grid Layout for Featured Clubs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
          {/* Large Featured Card */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-2xl overflow-hidden relative group shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
            <img
              alt="Cozy library interior"
              className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBllIUzbs7dew7zETAotIrs8w6uAZzkaIAdWLHdF1R632MspBkOkwLnz37sNLaKmB1oE9e0SyJItJvj8IL5AGQglDdMsaj6gA-o2ZKlbxHcBD3eGrXGe25kUUO9fl6ntOCLEjXdHF4yoy0XUF-6q50Dq0LiblTo7SeJX1vFVYGUQL74XNBqmoMak9jzEZBDGwgxyViOj8Q4B260yAMdAD4amHudQc22nxaShDoRkMAWS_4unwqdjM-Gs77CXGMM7jFQzCpHAiJRk0if"
            />
            <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
              <div className="flex justify-between items-end">
                <div>
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] text-white font-bold uppercase tracking-widest mb-4">Популярное</span>
                  <h2 className="text-3xl font-bold text-white mb-2">Классика Нуара</h2>
                  <p className="text-white/80 text-sm max-w-md">Обсуждение эстетики и философии мирового кинематографа 40-х годов.</p>
                </div>
                <div className="text-right">
                  <span className="text-white/60 text-xs block mb-2">1,240 Участники</span>
                  <button className="bg-white text-on-surface px-6 py-2 rounded-lg font-bold text-sm hover:bg-surface-variant transition-colors">Вступить</button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Card 1 */}
          <div className="md:col-span-4 bg-surface-container-lowest p-8 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <span className="material-symbols-outlined text-primary text-4xl mb-6">menu_book</span>
              <h3 className="text-xl font-bold mb-3">Бумажный Город</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Клуб любителей редких изданий и типографского искусства.</p>
            </div>
            <div className="pt-8 flex justify-between items-center">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <img
                    alt="Member profile 1"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoP3GVyrEvAxpu8Fk-XCaAfDhgGHcVjKZ4mp-YKGggXcQah80HX7Eav3GOS0MCwIivWYjuyQJPCjOu66UvjYcvc7e9gOseNMb0foAHxQJMmOba6bnEKR3dLoLSyrTWm8GBnKEWR6rUDSMhpxRE3IFB0SOJq-gJOxXWTI2i1gbHF1UCe0caxYSjU4RIppKHhSeDWxNSXQWANhLF1dubkcOLWE-eqFu912Eimyaymg414My6hIP2Ll7eioaoostX8fMpiNzTdiyl3JRE"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 overflow-hidden">
                  <img
                    alt="Member profile 2"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOlQX7HqIORSj8EgjwQXdA2Vc0jNmaXoPzOu7as5zk4VWuwoKEt5VhXZfUgAvMMdWn_1OOdshrYpS20ZmBUCswnBGv_LX4l2ZyJj2N2mawnt9BH0t8iljtHRLivvZiWhS-zSnRa8csyKTNoxCbwAk-o3xrQFLZy0DzrobK6xwBGODf7G28_VMiB8Dhftdphd07jm-jYReL8844Z5PGc_BDUllyQ2_0Ph9uQY6FLI_8e0Zxy3YtW0dp5BarTu5AAALiDyLmpFwJQ1Gi"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white">
                  +12
                </div>
              </div>
              <button className="text-primary font-bold text-sm hover:underline">Вступить</button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-8 mb-8 border-b border-outline-variant/20 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button className="pb-4 border-b-2 border-primary text-primary font-bold text-sm">Все сообщества</button>
          <button className="pb-4 border-b-2 border-transparent text-on-surface-variant font-medium text-sm hover:text-on-surface transition-colors">Кино</button>
          <button className="pb-4 border-b-2 border-transparent text-on-surface-variant font-medium text-sm hover:text-on-surface transition-colors">Книги</button>
          <button className="pb-4 border-b-2 border-transparent text-on-surface-variant font-medium text-sm hover:text-on-surface transition-colors">Арт</button>
        </div>

        {/* Grid of Clubs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Club Card 1 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-sm">
            <div className="h-40 bg-surface-container-high relative">
              <img
                alt="Cinematic lens flare"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXrze7uDbH_1i-rZEXE_2-Hz6hzaQd9k1lJhzpRBoa5WAw6eBXWoxyX0NqDcO6MwcGIjz_XMiM4om6seusc7tux8yfQM98DRaWSCv-1WM9AbIZ7i3-W7oLB3Fbdfs-Ou39hP4NXmH4y0bY--sFkeFJT_pJyg27MWLjqLBahMDKI1PnFDQlhD5YfJjdMaz_0KwXmLZklrbak6Fj9ZAXw8Cp1AKXVWoQvE2sV5CB29yVPZM2qlG-QARnV8WBUgCrydjFB8NReA-7_Z3G"
              />
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[10px] text-white font-bold">КИНО</div>
            </div>
            <div className="p-5">
              <h4 className="font-bold text-on-surface mb-2">Новая Волна</h4>
              <p className="text-xs text-on-surface-variant line-clamp-2 mb-6">Анализ французского кино и его влияния на современность.</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">450 Участники</span>
                <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-primary">login</span>
                </button>
              </div>
            </div>
          </div>

          {/* Club Card 2 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-sm">
            <div className="h-40 bg-surface-container-high relative">
              <img
                alt="Old book pages"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6E8byIKWOAEOTOzQzgn-3Z6Xt6gKlRkI1DDS2p_AE8t8_fFit-aB5SfLxKvv0zMdmRLHAzmDW-BevwOaipm7920d2qcAFtzhWqHH04LgVlrtBvRVs6VBG7ruL9NIboYwAeAJp6Kdb9aKZuK55wZPGhnhnZWrDTTRgYo8h905pGpM0APkp-W-uFq9OngPgZSc_ozoa8k8u1jN8Mgyou2SEiWI92BzNQF6S41xbe4ZSxvsw77nEpF2HdQinQ9LVdMurIo0lgRn-3JxO"
              />
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[10px] text-white font-bold">КНИГИ</div>
            </div>
            <div className="p-5">
              <h4 className="font-bold text-on-surface mb-2">Поток Сознания</h4>
              <p className="text-xs text-on-surface-variant line-clamp-2 mb-6">Модернизм в литературе: от Джойса до Пруста.</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">890 Участники</span>
                <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-primary">login</span>
                </button>
              </div>
            </div>
          </div>

          {/* Club Card 3 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-sm">
            <div className="h-40 bg-surface-container-high relative">
              <img
                alt="Aesthetic architecture"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDh8MFYQX_u_yRguULJ_8LpfAYwHWq-c0qgB8LtsYkAn8sglgHY1Zn14DPatXI83ecdPzYwWG4UsvLIeAtwB90KLhd4UOk7HV47g0boV4A49NV1LqtovkWPGNKPDOEVNvhWxisEQzDq1krWIUgZZ7hvsMlhgCxE_Y6T1917pY_XwOLsKyFeBSNBMvdG3hcYFC72S25DFFTAB_3OiKPJ-CV3F-d1GCrxQYsZRHgCET9oqsp-kjsKGZvhWiaJIRJnGppPUSajUnoWHMyY"
              />
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[10px] text-white font-bold">АРТ</div>
            </div>
            <div className="p-5">
              <h4 className="font-bold text-on-surface mb-2">Форма и Свет</h4>
              <p className="text-xs text-on-surface-variant line-clamp-2 mb-6">Визуальная культура, архитектура и промышленный дизайн.</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">2,100 Участники</span>
                <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-primary">login</span>
                </button>
              </div>
            </div>
          </div>

          {/* Club Card 4 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-sm">
            <div className="h-40 bg-surface-container-high relative">
              <img
                alt="Sci-fi neon"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwY_Q7Zj0h_V_1YF48taI49iomTRmZBmnAlW1HKuxZYpz_u9TllJb3iWAF11hNDElIZRFIc8EucO2E_YwBhtd0hWlXeP59vwn9Em3Yw4Kvz3dEKpQGpYdbBFuoE0nGCAeYlrAhTnVMpm8RVoqWqvMP-bDwApBT69sGnkX6TWr5t_yP8U_ityHbo6KUM3kVleL8AO33LCRMg4eK44FAp3wCkNjDkiKR_3QSK5vwBFOqluFCMhuzygM31DmypnNqo53Zvt_xHX6j5-uC"
              />
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[10px] text-white font-bold">КИНО</div>
            </div>
            <div className="p-5">
              <h4 className="font-bold text-on-surface mb-2">Завтрашний День</h4>
              <p className="text-xs text-on-surface-variant line-clamp-2 mb-6">Научная фантастика: от ретро-футуризма до киберпанка.</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">615 Участники</span>
                <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-primary">login</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion Section */}
        <section className="mt-20 p-12 bg-surface-container-low rounded-3xl text-center">
          <h3 className="text-2xl font-bold mb-4">Не нашли то, что искали?</h3>
          <p className="text-on-surface-variant max-w-xl mx-auto mb-8 text-sm">Создайте собственное сообщество и пригласите единомышленников для обсуждения любимых произведений.</p>
          <button 
            onClick={handleCreateClick}
            className="bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-primary-dim transition-all shadow-lg shadow-primary/20"
          >
            Начать новое обсуждение
          </button>
        </section>
      </main>
      <BottomNavBar activeTab="clubs" />
    </>
  );
}
