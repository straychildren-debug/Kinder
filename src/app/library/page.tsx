'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent } from "@/lib/db";
import { ContentItem } from "@/lib/types";

export default function Library() {
  const [books, setBooks] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const allContent = await getApprovedContent();
      setBooks(allContent.filter(c => c.type === 'book'));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-6 max-w-7xl mx-auto pb-24">
        {/* Hero Editorial Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 block">Коллекция 2024</span>
              <h2 className="text-5xl md:text-6xl font-bold text-on-surface tracking-tighter leading-none mb-4">Библиотека смыслов</h2>
              <p className="text-on-surface-variant text-lg max-w-md">Курируемая подборка литературы, которая вдохновляет великое кино и меняет восприятие реальности.</p>
            </div>
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
        {loading ? (
           <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : books.length === 0 ? (
          <p className="text-on-surface-variant">Пока нет книг. Добавьте первую!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {books.map(book => (
              <div key={book.id} className="group cursor-pointer">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low mb-4 relative shadow-sm">
                  {book.imageUrl ? (
                    <img
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={book.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container border-2 border-dashed border-outline-variant/30 rounded-xl">
                      <span className="material-symbols-outlined text-outline-variant">auto_stories</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 glass-button p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-sm">bookmark</span>
                  </div>
                </div>
                <h4 className="font-semibold text-sm mb-1 truncate">{book.title}</h4>
                <p className="text-xs text-on-surface-variant mb-2">{book.author || 'Неизвестный автор'}</p>
                {book.rating && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-primary">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                    <span className="text-[11px] font-bold">{book.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNavBar activeTab="books" />
    </>
  );
}
