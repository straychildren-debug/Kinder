import React from "react";
import Image from "next/image";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";

export default function BookDetails() {
  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-6xl mx-auto bg-surface">
        {/* Hero Section: Book Details */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start mb-24">
          {/* Asymmetrical Book Cover */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute inset-4 bg-on-surface/5 rounded-[48px] rotate-3 blur-2xl group-hover:rotate-6 transition-transform duration-1000"></div>
            <div className="relative z-10 w-full aspect-[3/4] overflow-hidden rounded-[40px] shadow-2xl transition-all duration-700 group-hover:scale-[1.02] border border-on-surface/5 bg-surface-container">
              <Image
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 brightness-95"
                alt="Premium book cover"
                fill
                sizes="(min-width: 1024px) 400px, 100vw"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhKW8-nd0TIs--x9AUHCPGhRUlhBp78XZ3eYyGuWcVtO8hP0qu3zf0UzlkxSmGUnNs9BVkAsRz0gwcyHKbHChI66omnUmue7y2-hlQWHQNNwfbZVraHDTKCMxzSYV-_53QoWk6bN4L_rzJiayhwVTfKtcQiIsQ940aGkrrxXaInmBHyzzP8aoM5DQ_vQR0XjKwF6UIjj4FYby7_NhWUpUbdItSFqHpuckX-Kf2Jn6qRAseL6aiZA41MLSwQki_V_d2jFLr4c9HTbo7"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-7 flex flex-col pt-10">
            <div className="space-y-6 mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40  block underline underline-offset-8">Архив классики</span>
              <h2 className="text-6xl md:text-8xl font-black text-on-surface tracking-tighter leading-[0.85]">О дивный<br/>новый мир</h2>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-1 rounded-full bg-on-surface"></div>
                 <p className="text-2xl font-black tracking-tight text-on-surface opacity-60 ">Олдос Хаксли</p>
              </div>
            </div>

            <div className="flex gap-4 items-center mb-12">
              <div className="bg-on-surface text-surface px-6 py-2.5 rounded-full flex items-center gap-2 shadow-2xl">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-[11px] font-black uppercase tracking-widest">4.8 / 5.0</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-30">2,450 критика</span>
            </div>

            <div className="space-y-6 mb-12">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40 ">Аннотация</h3>
              <p className="text-on-surface text-lg font-medium leading-[1.6] opacity-80  max-w-2xl border-l-2 border-on-surface/5 pl-8">
                Культовая антиутопия Олдоса Хаксли о генетически программируемом обществе потребления. В этом мире нет места страданиям, но нет и места человечности. Каждому суждена своя роль — от Альф до Эпсилонов, и каждый обязан быть счастлив под воздействием сомы.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {['Антиутопия', 'Философия', 'Классика XX века'].map(tag => (
                <span key={tag} className="px-5 py-2.5 bg-surface-container text-on-surface text-[10px] font-black uppercase tracking-widest rounded-full border border-on-surface/5 hover:bg-on-surface hover:text-surface transition-all cursor-crosshair">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="sticky top-24 z-40 bg-surface/80 backdrop-blur-3xl py-6 flex justify-between items-center mb-16 border-b border-on-surface/5">
          <h3 className="text-2xl font-black tracking-tighter text-on-surface ">Мнение сообщества</h3>
          <button className="bg-on-surface text-surface px-8 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-on-surface/20">
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span className="font-black text-[10px] uppercase tracking-widest">Оставить рецензию</span>
          </button>
        </div>

        {/* Review Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Review */}
          <div className="lg:col-span-8 space-y-12">
             <article className="bg-white p-12 rounded-[48px] border border-on-surface/5 shadow-sm space-y-10 group hover:shadow-2xl transition-all duration-700">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-5">
                    <Image
                      className="rounded-[20px] object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all"
                      alt="Avatar"
                      width={56}
                      height={56}
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJo8C1Dt7XKlmLz2DVxRo0Kg4kSIJQuET-oyAQKu0h3sHgbARj06FByEza77cr2kzky4E9AaSQC8fCnyUcz-NZD2m3yUrasx2BoHIwo2omacJTVoLuXtv7hbHis66W8EKeVvl9SnHYSeYIaMXFz0H4yLI2F52IiotJhakk7jivM_AVFLlR_KMrCBTNOcNwpZJxA3L4Cu_aXtjMALCPffIEySYXd2WBECghOQDgNtbWuLLKlaYmsuGVjCTSxS7IjNMnklrNPchGMhXx"
                    />
                    <div className="space-y-1">
                      <p className="font-black text-sm tracking-tighter">Александр Воронин</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-30 ">Золотое перо • 12 мин назад</p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-on-surface opacity-10">
                    {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                  </div>
                </div>
                <p className="text-on-surface leading-[1.5] text-2xl font-black tracking-tight  opacity-90">
                  &laquo;Пророческая работа, которая с каждым десятилетием становится все актуальнее. Хаксли пугает не насилием, а комфортом, который лишает нас души.&raquo;
                </p>
                <div className="pt-10 flex gap-8 border-t border-on-surface/5">
                  <button className="flex items-center gap-3 text-on-surface-variant/40 hover:text-on-surface transition-all group/btn">
                    <span className="material-symbols-outlined text-[20px] group-hover/btn:scale-125 transition-transform">favorite</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">124</span>
                  </button>
                  <button className="flex items-center gap-3 text-on-surface-variant/40 hover:text-on-surface transition-all group/btn">
                    <span className="material-symbols-outlined text-[20px] group-hover/btn:-rotate-12 transition-transform">mode_comment</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Обсуждение (12)</span>
                  </button>
                </div>
             </article>

             {/* Thread */}
             <div className="pl-12 space-y-10">
                {[
                  { name: 'Елена М.', time: '4 часа назад', text: 'Согласна, сома в нашем мире — это бесконечный скроллинг ленты соцсетей.' },
                  { name: 'Марк Г.', time: '2 часа назад', text: 'Интересно сравнение с Оруэллом. Хаксли предсказал будущее гораздо точнее.' }
                ].map((comment, idx) => (
                  <div key={idx} className="space-y-3 relative">
                    <div className="absolute -left-6 top-4 w-[2px] h-full bg-on-surface/5"></div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black tracking-tighter">{comment.name}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-20 ">{comment.time}</span>
                    </div>
                    <p className="text-sm font-medium text-on-surface-variant  opacity-70 leading-relaxed">{comment.text}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-surface-container rounded-[40px] p-10 border border-on-surface/5 space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40 ">Распределение</h4>
              <div className="space-y-6">
                {[
                  { star: 5, pct: 85 },
                  { star: 4, pct: 10 },
                  { star: 3, pct: 3 },
                  { star: 2, pct: 2 },
                ].map(r => (
                  <div key={r.star} className="flex items-center gap-6">
                    <span className="text-[11px] font-black w-4">{r.star}</span>
                    <div className="flex-1 h-1 bg-white rounded-full overflow-hidden">
                      <div className="bg-on-surface h-full" style={{ width: `${r.pct}%` }}></div>
                    </div>
                    <span className="text-[9px] font-black text-on-surface-variant opacity-30">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <article className="bg-white p-8 rounded-[32px] border border-on-surface/5 shadow-sm space-y-4 group hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-black  text-xs text-on-surface/20">М</div>
                <div>
                  <p className="font-black text-xs tracking-tighter">Мария Петрова</p>
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-30 ">Вчера</p>
                </div>
              </div>
              <p className="text-xs font-medium text-on-surface-variant  opacity-70 leading-relaxed line-clamp-3">
                Книга, которую нужно перечитывать каждые пять лет. Каждый раз открываешь новые смыслы в диалогах с Мустафой Мондом.
              </p>
            </article>
          </div>
        </div>
      </main>
      <BottomNavBar activeTab="books" />
    </>
  );
}
