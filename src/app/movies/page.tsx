'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent } from "@/lib/db";
import { ContentItem } from "@/lib/types";

export default function Movies() {
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const allContent = await getApprovedContent();
      // To show "popular", could sort by rating if available, but for now just filter by movie type
      setMovies(allContent.filter(c => c.type === 'movie'));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-6 max-w-5xl mx-auto space-y-12 pb-24">
        {/* Hero Section: Curated Feature */}
        <section className="relative h-[450px] rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
          <img
            className="w-full h-full object-cover"
            alt="Hero Feature"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC13_q8um-jhBv9OSOggFUrTjFMg5mxzIlisK194TlMDgrC2n00BOYAk0rwgFBf-nOfGfEYeUvQoqErgAwRiK1diUaeNB0FtOMhq5mCRSw2SAHoBgz1bfkBDhDn_okUiLejLUgFx3e7N12sB3Tqqsyv1PY_NCRrls-3hTTorpcfmMZ0gkLfkz04TRqfSCYgFQGIp3vPMqVGbKNlesC_Ok2WvkPdwNxG7Kwc-qHS8KbWpi5sxZAR7nh34XPuh6CHTQCn1_siiIR5Qsyb"
          />
          <div className="absolute bottom-0 left-0 p-8 z-20 w-full md:w-2/3">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-2">Выбор недели</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">Бегущий по лезвию 2049</h2>
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-secondary-container/30 backdrop-blur-md px-3 py-1 rounded text-white text-sm font-medium">8.5 / 10</span>
              <span className="text-white/80 text-sm font-medium">Режиссер: Дени Вильнёв</span>
            </div>
            <button className="glass-button px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2 transition-transform active:scale-95">
              <span className="material-symbols-outlined">play_arrow</span>
              Смотреть детали
            </button>
          </div>
        </section>

        {/* Bento Grid: Trending & Critics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Large Feature */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-8 space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold tracking-tight">Популярное сейчас</h3>
              <span className="text-sm text-on-surface-variant font-medium cursor-pointer hover:text-primary transition-colors">Показать все</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {loading ? (
                <div className="col-span-1 sm:col-span-2 flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : movies.length === 0 ? (
                <p className="col-span-1 sm:col-span-2 text-on-surface-variant">Пока нет фильмов. Добавьте первый!</p>
              ) : (
                movies.slice(0, 4).map(movie => (
                  <div key={movie.id} className="group cursor-pointer">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-4 bg-surface-container">
                      {movie.imageUrl ? (
                        <img
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt={movie.title}
                          src={movie.imageUrl}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container border-2 border-dashed border-outline-variant/30 rounded-xl">
                          <span className="material-symbols-outlined text-outline-variant">movie</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{movie.title}</h4>
                        <p className="text-sm text-on-surface-variant">{movie.author || 'Неизвестный режиссер'}</p>
                      </div>
                      {movie.rating && (
                        <span className="bg-secondary-container px-2 py-0.5 rounded text-[11px] font-bold text-on-secondary-container">{movie.rating}</span>
                      )}
                    </div>
                    <p className="text-[10px] mt-2 text-on-surface-variant/60 font-medium">Добавлено пользователем</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Side Critics Section */}
          <div className="md:col-span-4 bg-surface-container-high rounded-xl p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold uppercase tracking-wider text-on-surface-variant/80">Мнения критиков</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-slate-400"></div>
                  <span className="text-xs font-bold">@anton_dolin</span>
                </div>
                <p className="text-sm leading-relaxed text-on-surface">&laquo;Шедевр визуального повествования, который заставляет задуматься о природе человечности.&raquo;</p>
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-sm">star</span>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-slate-300"></div>
                  <span className="text-xs font-bold">@critique_pro</span>
                </div>
                <p className="text-sm leading-relaxed text-on-surface">&laquo;Актерская игра заслуживает Оскара. Каждый кадр — как отдельная картина.&raquo;</p>
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button className="w-full py-3 rounded-lg bg-surface-container-lowest font-semibold text-sm hover:bg-white transition-colors">Все рецензии</button>
            </div>
          </div>
        </div>

        {/* Cast & Details Section */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold tracking-tight px-2">Актерский состав</h3>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex-shrink-0 w-24 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-2 bg-surface-container">
                <img
                  alt="Actor"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZI-pEumo_rdke1QMGzXf45fe5R6V6XNx-ipdo0rEW-anWXK3JZkf07S5voyKSOSx7phw-FCRl-pS-QVLGtX28v0r0D2N71Utho_BAQQfxqMdRWHzktgNw0UvqtF4J1l1UinIY1TQy9SLlKWWFRCTBB9ytYPsdH3mdM5ko0XUWhxMozJIg3Gj1l8IH1wsXNsG3qbVQmakEPf8OFUTX7kxcocKrLzWpjLFMPd_9hf-7PXEVYjze40ERnzcym8kdpRsrwvDY8DW-hQi_"
                />
              </div>
              <p className="text-[11px] font-bold">Райан Гослинг</p>
            </div>
            <div className="flex-shrink-0 w-24 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-2 bg-surface-container">
                <img
                  alt="Actor"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyTInRrXju7WnXaauF0unqQ8nz-RFt3qCwj5vdz-jqoerKaxKDivLdTIAD9ncQYQRHRcoitnjOB9rGwWiqNqCBNvYZbGLe42elkklWim8WcJ4VMOupKUwQa7fkMMtYIeMqwYGt83JBkH2TZEGWXSknw_Nc4BzLO08DU_KMy_kDNYZxttJpRFRktTUJy6QWfvgEMpf6-QmYGZEhbnXf1hZFN2FVpzKerxgyBUi2ECLbxBhUR6r59nBcZK7IX-6ogw0H0ja5Y17jBPxJ"
                />
              </div>
              <p className="text-[11px] font-bold">Ана де Армас</p>
            </div>
            <div className="flex-shrink-0 w-24 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-2 bg-surface-container">
                <img
                  alt="Actor"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhA0tZUGoYc2xwDd4L-9Rg5CzHF6ha5wRbWKlVLcUYouH5AN74kXWC9qiUvYkWNi9S8BNjQsjJnuOtMbR7fizbD-dYNDZ_41tDjI3tRD_BTafFbfqB7S4JMFhHayWb1vUfDghUpwvBwTz6Gkv__3jRzlD-jRNJcjEPXsqsao34ZEpUjrXk0rObrZNo1EHsHIw9HptaGtcNE1RfhKvj444fpCB4buX9RYihw7JQ6aklNnd1C0lW0oDolf2Z0CVvN5J4cIm9SZXZzgpJ"
                />
              </div>
              <p className="text-[11px] font-bold">Харрисон Форд</p>
            </div>
            <div className="flex-shrink-0 w-24 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-2 bg-surface-container">
                <img
                  alt="Actor"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeNj9vi5A1JOqlSsiIhnzbAUGtm68a2JPboYH66EILZGJKPhZbPz0yZHW75t0xh0oKKxClhSsMZ5m3D2tfJ41vP4UpS6DGdSHOKQgTyaSOxPtgdglRDY_YKU8tStlcqkXhMfexlwsCwddw-rtrhzzNYrkCBdTAR5c1eJ2tmjxWC3bhi-IHBPXGvUcKkwA84VSjLXGgJsKEEKqxZ6tBxbV6GrGi4LPbxRIvfZNIotoaswMUonqdtoOj2R4sLmJyfTBx-c4RNZcnGW50"
                />
              </div>
              <p className="text-[11px] font-bold">Джаред Лето</p>
            </div>
            <div className="flex-shrink-0 w-24 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-2 bg-surface-container">
                <img
                  alt="Actor"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAncsTs9vmrayMLl30-k3EfPJO8lhS4RRHK-AB4_wvNu5ch89t57jji2HUGBAr0dMgz6X_fRM9Rdce8YGzPcKqcNNqJPdwOFI6-6MddzNQsxjbtUErp0xHeVcTSog1il8gz873pliRqbzTuelMkX-rn114_Yo0V6ug9ZIUFUgOreD5Kfi-PNMyfAYe07BY1sGW3RScWDaaxDFaJ2b84kvZPtgfK85hN0CZ4258FaEr1bb1TTx5PQTh4c3lMbLXiBkirq5cn9tyPvRdq"
                />
              </div>
              <p className="text-[11px] font-bold">Робин Райт</p>
            </div>
          </div>
        </section>
      </main>
      <BottomNavBar activeTab="movies" />
    </>
  );
}
