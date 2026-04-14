import React from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";

export default function Library() {
  return (
    <>
      <TopNavBar
        avatarUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCVu7ibxXVuHBAp1fLDGeLpebNz4AAEZAY8BRH5W0zrQ1ZwF_B0MplLU7orLWL18sJpJCOhe0ojO2M3rc6LxvGsU5SZMImDO5NWGH5gT2iSWZnKf77PxtOy7D4KlHbbqCTjFNfp_i-sXjPk9uQpkZ0jW-wGkB3ZDtb0_DEqekZCVce2-0zjhocVSJJ02-2PwfxrB4egmlbInQSosCP7R7TLAp2KElmjkV2jSZ86kiwGDMMKNDa8g25Yi2e7oFUq2xouFZUH5hkUzREP"
      />
      <main className="pt-24 px-6 max-w-7xl mx-auto pb-24">
        {/* Hero Editorial Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 block">Коллекция 2024</span>
              <h2 className="text-5xl md:text-6xl font-bold text-on-surface tracking-tighter leading-none mb-4">Библиотека смыслов</h2>
              <p className="text-on-surface-variant text-lg max-w-md">Курируемая подборка литературы, которая вдохновляет великое кино и меняет восприятие реальности.</p>
            </div>
            {/* Glassmorphism Action Button */}
            <button className="glass-button text-white px-8 py-4 rounded-xl flex items-center gap-3 transition-transform active:scale-95 shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined">add</span>
              <span className="font-semibold tracking-tight">Добавить книгу</span>
            </button>
          </div>

          {/* Bento Featured Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Featured Card */}
            <div className="md:col-span-2 bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col md:flex-row group transition-all shadow-sm">
              <div className="w-full md:w-1/2 h-80 md:h-auto overflow-hidden">
                <img
                  alt="Book Cover"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlU9yMwqlr2miI8TJVytSlWB8x78DTbi2LjdXIztHtWQkWkeIygDBzHvuudIuFaB8DP_PdOHA5ue6a4Q5_x3hkMjQf8bMtXlxtV_iKD-9WzqCyxo83yCc4qW2_v0MUaJVXYlhkMdBgMNQ-23GaP-apF2-WC2uSxL42f33yPtNIvfLgKpYkBvws3pkrGdji6NYEpAdiae77rXKAgRIVAGUB5MQzLgG7Z12euPvMAIwql7WjnseQLeDFTjyrz1-lsn0iI8_B2w0KCYl8"
                />
              </div>
              <div className="p-8 flex flex-col justify-between md:w-1/2">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-1 rounded-full uppercase">Выбор редакции</span>
                    <div className="flex items-center gap-1 text-primary">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-xs font-bold">4.9</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Пустота и форма</h3>
                  <p className="text-on-surface-variant text-sm line-clamp-3 mb-6">Исследование минимализма в современной литературе и его влияние на визуальный язык кинематографа XXI века.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
                    <img
                      alt="Author"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpmvOCBeB7gAQ5TEpiQvQWlLxfpwpeSmYPZ81PfKawSOTtYu5S9h2HC_dqJj32QhmpY_KJV08eWHKuXPDMJLKj32VUvEKrH3sTUoGJ5nUUicGaIXgwvr7xiZBQZbAX3tQod9OyBTEr-SApx2m95RQf3HK348DBRpZ2J5yk7iTYexhHAs3DddnASi5RV2Oe532DI7LVMotPH7afEBKwNhZgHOsKPh9AeBxDQ502tkJwrbehc8qoyRw7g7boZOrDVLFIahVgp2hBMPXO"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Александр Иванов</p>
                    <p className="text-[11px] text-on-surface-variant">Философия, Искусство</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Featured */}
            <div className="bg-primary text-on-primary rounded-xl p-8 flex flex-col justify-between bg-gradient-to-br from-primary to-primary-dim shadow-sm">
              <span className="material-symbols-outlined text-4xl mb-6">auto_awesome</span>
              <div>
                <h3 className="text-xl font-bold mb-2">Архив критики</h3>
                <p className="text-on-primary/80 text-sm mb-6">Более 500 рецензий от ведущих кинокритиков и литературоведов мира в одном месте.</p>
                <button className="bg-white/20 backdrop-blur-md border border-white/10 text-white w-full py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors">
                  Открыть архив
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog Filter Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h3 className="text-2xl font-semibold tracking-tight">Каталог изданий</h3>
          <div className="flex gap-2">
            <button className="bg-surface-container-high px-4 py-2 rounded-full text-xs font-bold text-on-surface">Все</button>
            <button className="bg-surface-container-low px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">Новинки</button>
            <button className="bg-surface-container-low px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">Популярное</button>
          </div>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {/* Book Card 1 */}
          <div className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low mb-4 relative shadow-sm">
              <img
                alt="Book"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGpRiigOBUERIQlTigk9BNzuAQ1mozT0-4Fq8EGPf7d1A9Ic6wLrMJaJEDt6owAHfPft0vZQorawDVMos4fKcn4IMZi8rx5Hi-SIeo1UyjfWfdOLhYYomGPrIUeBAlwwT24aJRRE3QBaZ-64m2b5vge-4XXbgdf-UP4S5O0jEpBXOQCG4zweQOg9dzzs9R-PLl9GxTg1opkMuafJSgrYDk0oYgb-CtTA7ugF7OIIP0CvGUIW0wbXkrOJyJ7-k09BoXGk3y2iTU92M5"
              />
              <div className="absolute top-3 right-3 glass-button p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">bookmark</span>
              </div>
            </div>
            <h4 className="font-semibold text-sm mb-1 truncate">Теория кадра</h4>
            <p className="text-xs text-on-surface-variant mb-2">Марк Стивенс</p>
            <div className="flex items-center gap-1.5">
              <div className="flex text-primary">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="text-[11px] font-bold">4.8</span>
            </div>
          </div>

          {/* Book Card 2 */}
          <div className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low mb-4 relative shadow-sm">
              <img
                alt="Book"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoGE9Nn7szE_zj07CfwGrvDDU3EMgCFvrCFS9ow8dsGb-Y5g5Dl0yBoWs2yl32DGKVdq1PhUaolFE37FW4nTb475VQhiXsGXADMBUvWEgDkcBPb78qpssH5HIkCI5_cB5pAx1uNkwj-QxS3hmU2VtgQ6PXqtxDw7LhesxmFt-ZPm7eA3MfbpQ5Bcg9KKLKp4uaxwDB_mvCvpw05Uf2hVpSUUcDSC-XwiCzgk1gZGzMkT3IAalEFvEtXyAVzLxY1NzGZ8W5Kh2OR9dY"
              />
              <div className="absolute top-3 right-3 glass-button p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">bookmark</span>
              </div>
            </div>
            <h4 className="font-semibold text-sm mb-1 truncate">Цвет в кино</h4>
            <p className="text-xs text-on-surface-variant mb-2">Елена Громова</p>
            <div className="flex items-center gap-1.5">
              <div className="flex text-primary">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="text-[11px] font-bold">4.7</span>
            </div>
          </div>

          {/* Book Card 3 */}
          <div className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low mb-4 relative shadow-sm">
              <img
                alt="Book"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3qD2pJJ6R4SS7DgskqVNvF1Sx1g_4M1hyAi4dYmlFBjnl7_HPMJQsppwbm_Ppk3vk-vRtWeFRWUx081FxQSsqWZyQweMpRbNlor-1xYoGRu3PerjKlSkHiMMyoCc0-P-9i7SOjjhRbJQf9KRLN5pXZFv88kev66sv47WoZhkjzaIef-CDGGFxGEgsvzJlD7D7wrt2TPAO5H8l3SsMcH5lJt8n5fOuN322_BB_s-ytAAIfW2YbkD1KmUxGAT6Qp0d5vgulpW-sV98a"
              />
              <div className="absolute top-3 right-3 glass-button p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">bookmark</span>
              </div>
            </div>
            <h4 className="font-semibold text-sm mb-1 truncate">Архитектура сюжета</h4>
            <p className="text-xs text-on-surface-variant mb-2">Дэвид Мамет</p>
            <div className="flex items-center gap-1.5">
              <div className="flex text-primary">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="text-[11px] font-bold">5.0</span>
            </div>
          </div>

          {/* Book Card 4 */}
          <div className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low mb-4 relative shadow-sm">
              <img
                alt="Book"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaHNtYCA587_CLsIs50CmbDaf3KtwyWuMEykfxEBp9q5gtlI1Zrx08D3fhaauP5PDMi2nBNyjN5JyXkAerabyeXdM_FQqWiBlaOxlMDIVP37L5rdz12OqMkzgqOI8HD074fX9ZDg5X9KQWvpvSBi0cw-kwrpvfnbRPZ0PduY7gO08EnZLfNhzy2iOnYjsBIN6aI3puNgzMfSLD4s0vybw8JJcycflHzYtgwvHn7zARlJkGJ3nbuEOACPiynCqyeBAX7a0Chg_IkPfU"
              />
              <div className="absolute top-3 right-3 glass-button p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">bookmark</span>
              </div>
            </div>
            <h4 className="font-semibold text-sm mb-1 truncate">Магия монтажа</h4>
            <p className="text-xs text-on-surface-variant mb-2">Уолтер Мёрч</p>
            <div className="flex items-center gap-1.5">
              <div className="flex text-primary">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="text-[11px] font-bold">4.9</span>
            </div>
          </div>

          {/* Book Card 5 */}
          <div className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low mb-4 relative shadow-sm">
              <div className="w-full h-full flex items-center justify-center bg-surface-container border-2 border-dashed border-outline-variant/30 rounded-xl">
                <span className="material-symbols-outlined text-outline-variant">auto_stories</span>
              </div>
              <div className="absolute top-3 right-3 glass-button p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">bookmark</span>
              </div>
            </div>
            <h4 className="font-semibold text-sm mb-1 truncate">Скоро в продаже</h4>
            <p className="text-xs text-on-surface-variant mb-2">Анонс</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-outline-variant">Ожидается</span>
            </div>
          </div>
        </div>
      </main>
      <BottomNavBar activeTab="books" />
    </>
  );
}
