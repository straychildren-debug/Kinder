import React from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";

export default function Leaderboard() {
  return (
    <>
      <TopNavBar
        avatarUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuALJlkvkQTCGmkhrWTVUG-dGM3xwzWn_tlRznjASh3Q3oBR5MrZoI4U86esCNtsF3nMaZh9KPStFHvZwq6x8shlMYPDYW66I-qlO0ukbKGhEka49IVmPw-_DOxcZSDRLs-WHdu8yTYF4Q-MSypeu4GKyaaO0yZxZN8EjIPqnq6GIEW5OPRJIcEZeswtodb7mbOm-xh6raa_0j8ddMGTiUF_GlRbeBEGDXMF_9AZ2_UCxerAPQd64cVkeDijMGv0-Q4ZNwLksxuFmtsy"
      />
      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-on-surface-variant block mb-2">Сообщество знатоков</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight">Рейтинг кураторов</h2>
            </div>
            <div className="flex gap-2">
              <button className="bg-surface-container-low px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-colors">За месяц</button>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-primary/10 transition-all hover:scale-95">За всё время</button>
            </div>
          </div>
        </section>

        {/* Top 3 Leaders (Asymmetric Bento) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
          {/* Rank 1 */}
          <div className="md:col-span-6 bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden group shadow-sm">
            <div className="absolute -top-4 -right-4 text-9xl font-bold text-surface-container-high opacity-40 select-none">1</div>
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    alt="Top Curator 1"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBA_QDSwRrXsqW-qTwWhRc4BpQ4jQxuCPMQWjA6lDJl0csfbYlWVpE0SFnW0wSfx74unDnBRCY9_iOHh4z80HkkyRmj7ejVsgKoP0heL9Yp64DIDIo6axaeOFUgUolxHJmeI1ek6JVPBYlSEW-zbU_bJcZnpiZ7O0AHraBIGs1hDlC9QfabOHvOyf1XswLQR9b2OL2xzz-0U4n4_sEdcZkrQMnfRSoKs7SH8Nk9HFACEcby0H8SRn-aVA2KE1S6oQUhsX1p6AvL4rQ"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-1">Александр Морозов</h3>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span className="text-sm font-medium">Ведущий критик</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <p className="text-[11px] uppercase font-semibold text-on-surface-variant mb-1">Лайки</p>
                  <p className="text-xl font-bold">12.4k</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <p className="text-[11px] uppercase font-semibold text-on-surface-variant mb-1">Рецензии</p>
                  <p className="text-xl font-bold">342</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <p className="text-[11px] uppercase font-semibold text-on-surface-variant mb-1">Очки</p>
                  <p className="text-xl font-bold">8.9k</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rank 2 & 3 */}
          <div className="md:col-span-6 flex flex-col gap-6">
            {/* Rank 2 */}
            <div className="bg-surface-container-lowest rounded-xl p-6 flex items-center justify-between group shadow-sm">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-outline-variant mr-2">02</div>
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  <img
                    alt="Top Curator 2"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYnduUEUXzM60EHA06Dg27LINIxoF9e1Qzick4jEHm3pR0JUOZrVy4fQRVC_xFgg8KCETjPruv52pRKXWvGK5YHdVTGhZIS-wdelcqnEXTvb2m9cAEPfi8NlkhAagx6S7qTvpDSgEWI28SicPq_wqR15oVzJYcWXASwtZno_GaDYAE28JN7YkyPsbqt4N_6BTJHph_cL5DYyzlLHRL4P5qPgNIlAybgXFT0rtNWpZUE2g4vWezBKwMQIHG352M1JQMa32yBnj2vKha"
                  />
                </div>
                <div>
                  <p className="font-semibold text-lg leading-tight">Елена Громова</p>
                  <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Киноэксперт</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">10.1k</p>
                <p className="text-[10px] uppercase font-semibold text-on-surface-variant">Лайков</p>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="bg-surface-container-lowest rounded-xl p-6 flex items-center justify-between group shadow-sm">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-outline-variant mr-2">03</div>
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  <img
                    alt="Top Curator 3"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAp9zKm4J0MNQcyhSkPF9Z7TpA4KERAaqM1enIaGi7OKYUmG67z1sQxypwC9H4HxGhPAP4bG7tvKEZTwkvmVc8EaWH7Wp2hMo2wTjm2GAE5UX4eNNvcqdSqsjq7rFFwYJZ9Zp1kchuXJL1CiJ0-dpjKFBN-dwI2bLDIdOqpD4MzFK_xG_Udcvba9PDaXOQzDJ8N-4yc0ux7K2jfgNjiIAUsbiGiVBUpKxwU-8afe-W_SK6HNPXtezNSOU9KIeTc3ZcV-JD0-kxmBcC"
                  />
                </div>
                <div>
                  <p className="font-semibold text-lg leading-tight">Марк Левин</p>
                  <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Библиофил</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">9.8k</p>
                <p className="text-[10px] uppercase font-semibold text-on-surface-variant">Лайков</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="mb-12">
          <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">leaderboard</span>
            Полный список
          </h4>
          <div className="space-y-3">
            {/* Entry 4 */}
            <div className="glass-card rounded-xl p-4 flex items-center transition-all hover:bg-white/80 shadow-sm border border-outline-variant/10">
              <div className="w-8 text-center text-on-surface-variant font-bold">4</div>
              <div className="flex items-center gap-4 flex-1 px-4">
                <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
                  <img
                    alt="User"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwq1veOb9u-Ac0g7Cd68srlqct8YAUU65fSj85e2Dy7KxZcDHP_B0DyK-z5JAmgErAG1J11hTmUFi3CwZNNNuG2sdXn1tcuo4mYRfo4LP6xJj_9eLZz8RvQCQORk9jWvc30hkofHF_S8fqU0BKcdnervfBVEmF305Wr8aiq9eSSXb-tMYAkhJC0GCTt72TeM9H0wsMV6-drhfiCq62IVQect6K4rbH-2UD0LKX5Ri9y4zlFn63yjlt7aHLt7ayDFZAqZbshG5wg4Mv"
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">Анна Волкова</p>
                  <div className="flex gap-1 mt-1">
                    <span className="bg-tertiary-container text-[9px] px-1.5 py-0.5 rounded text-on-tertiary-container font-bold uppercase">Топ-10</span>
                    <span className="bg-secondary-container text-[9px] px-1.5 py-0.5 rounded text-on-secondary-container font-bold uppercase">Сценарист</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 pr-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold">156</p>
                  <p className="text-[9px] text-on-surface-variant uppercase font-semibold">Рецензий</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-bold">7.2k</p>
                  <p className="text-[9px] text-on-surface-variant uppercase font-semibold">Лайков</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </div>
            </div>

            {/* Entry 5 */}
            <div className="glass-card rounded-xl p-4 flex items-center transition-all hover:bg-white/80 shadow-sm border border-outline-variant/10">
              <div className="w-8 text-center text-on-surface-variant font-bold">5</div>
              <div className="flex items-center gap-4 flex-1 px-4">
                <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
                  <img
                    alt="User"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXi83xD5gWhtdKcu2YQuK_eURBQ0IdtGg490dQEpfe6YStYQaYEksYXAMx4i46ZMP-DlV8BH5T3vy2brRcPakZRBt3dor-FT9mPntbZHCGF4vcNT34-sJ7Z9l-cY7ZwB-HqAkkfCW16E79q-tC4eHlmWYiv7JVHZC98ecW9LtQdmfJD2aGHwIxz5IdAdy1K-t43O1Xpha8Zozc4LzbsmcjsDTQe8UoYuUBROo9DPVRxrnS9UyZHzPuc-kCVOCHLfWxhbGfRpvy6wOH"
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">Игорь Соколов</p>
                  <div className="flex gap-1 mt-1">
                    <span className="bg-surface-container-highest text-[9px] px-1.5 py-0.5 rounded text-on-surface-variant font-bold uppercase">Активный</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 pr-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold">98</p>
                  <p className="text-[9px] text-on-surface-variant uppercase font-semibold">Рецензий</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-bold">5.4k</p>
                  <p className="text-[9px] text-on-surface-variant uppercase font-semibold">Лайков</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </div>
            </div>

            {/* Entry 6 */}
            <div className="glass-card rounded-xl p-4 flex items-center transition-all hover:bg-white/80 shadow-sm border border-outline-variant/10">
              <div className="w-8 text-center text-on-surface-variant font-bold">6</div>
              <div className="flex items-center gap-4 flex-1 px-4">
                <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
                  <img
                    alt="User"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXrkUwSum5emAKOn1lniQhu64RCce_iF5iqyezpNl0ORqQTms5a4GtU6KB4wbjb_5UcxXsw6t56M7wzf5lblIsILfM4Z0qLgtEB9Q9wUCgueVqdERZhAHnBnBVgZgcVflTpJq0BzKofjCMXoMOXwwmXLid4yMlqpAWFGNN_YXHgF4OJDh5seAwN4sB3B4O84JJiICWWgu0JLkmFanNZ7o3BhCDUv_yiRfbBc4SMqAaw6xJveo7H2m8rAu_IS39ppGJHKjXuN84pGwQ"
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">Марина Кравц</p>
                  <div className="flex gap-1 mt-1">
                    <span className="bg-secondary-container text-[9px] px-1.5 py-0.5 rounded text-on-secondary-container font-bold uppercase">Редактор</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 pr-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold">212</p>
                  <p className="text-[9px] text-on-surface-variant uppercase font-semibold">Рецензий</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-bold">4.9k</p>
                  <p className="text-[9px] text-on-surface-variant uppercase font-semibold">Лайков</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNavBar activeTab="profile" />
    </>
  );
}
