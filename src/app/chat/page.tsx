import React from "react";
import TopNavBar from "@/components/TopNavBar";

export default function Chat() {
  return (
    <>
      <TopNavBar title="Внутри клуба" />
      <main className="pt-24 pb-32 px-4 max-w-2xl mx-auto min-h-screen">
        {/* Marathon Banner (Asymmetric Layout) */}
        <section className="mb-10 relative overflow-hidden rounded-xl bg-surface-container-low p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="z-10 max-w-sm">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-2 block">Событие клуба</span>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-3 leading-tight">Киномарафон: <br />Классика научной фантастики</h1>
              <p className="text-sm text-on-surface-variant mb-4">Смотрим и обсуждаем культовые картины каждую субботу. Присоединяйтесь к текущему забегу!</p>
              <button className="glass-marathon px-6 py-2.5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-primary/10 transition-all active:scale-95">
                Участвовать в марафоне
              </button>
            </div>
            <div className="relative w-full md:w-32 h-32 flex-shrink-0">
              <img
                alt="Marathon visual"
                className="w-full h-full object-cover rounded-lg shadow-xl rotate-3"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB22pSE3W3FjQT38_w-JPoN-Xwa6bIwzi1Ni8fHIa4BQv2nQwnii48E3dVIr61FBXUN9eR3Fl_n93YKPswL_UbuP4L0vMkGjQ5FZHScK9jYRXzHlbpNVyzqX0b-zDoqGPOhPQUVSNp7z2nvIVjjLSv6K3R5qT6QtMFL-oiBOh8Jcxr2IHITteY3XhCn3fnzbvb9HKqu74axSviRi7wpCY6m_EmUT3b3zZ4aadG3XWUNkTFz_3GglyJS8C7G5COMniaaX8Z6dy4D5ouf"
              />
            </div>
          </div>
        </section>

        {/* Discussion Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Сегодня</span>
          <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
        </div>

        {/* Chat Stream */}
        <div className="space-y-8 mb-12">
          {/* Message: Received */}
          <div className="flex items-end gap-3 max-w-[85%] group">
            <img
              alt="Avatar"
              className="w-8 h-8 rounded-full mb-1 object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVBa1r3NjqIj_r0c6eyKzaS5826d17WNz4T-Sb--R45myuu6p9Khijd-f3SkL65_HRfSVRzYRXe64f0QsvGUEAgQqMz1GU7GyFe7j9pd4YwPflTCmTy0q_JK6c9uEDLlZlzJW6KTE6a6MlMCdcjmKOd56stRSitzg4tON2-Hp2-DexzvUKlptqvtQKUTf2Gm0fS73ApyMrge4Bj7BvYQ2PtmBkdj-njoETppDpA_3zJWp83WpSm5-Mk0o2tYrLyg4Blkcsye8h50fT"
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-on-surface-variant mb-1 ml-2">Анна Волкова</span>
              <div className="bg-surface-container-lowest p-4 rounded-t-xl rounded-br-xl shadow-sm">
                <p className="text-sm text-on-surface leading-relaxed">Кто-нибудь уже читал новое издание &laquo;Дюны&raquo; с иллюстрациями Сэма Вебера? Это просто эстетический восторг!</p>
              </div>
            </div>
          </div>

          {/* Message: Sent (Glassmorphism) */}
          <div className="flex items-end gap-3 flex-row-reverse max-w-[85%] ml-auto">
            <div className="flex flex-col items-end">
              <div className="glass-bubble-user p-4 rounded-t-xl rounded-bl-xl border border-white/40 shadow-sm">
                <p className="text-sm text-on-surface leading-relaxed">Да, вчера забрал из магазина. Согласен, типографика там на высшем уровне. Особенно впечатлила верстка глав.</p>
              </div>
              <span className="text-[10px] font-medium text-outline-variant mt-1 mr-2">Прочитано</span>
            </div>
          </div>

          {/* Message with Content Card (Bento-like inside chat) */}
          <div className="flex items-end gap-3 max-w-[85%]">
            <img
              alt="Avatar"
              className="w-8 h-8 rounded-full mb-1 object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw_RpTxBoDQYdENvnsihYYqxrG_sMtCFDA8Kilx8Mq_VkqLrP9WfVAO5y-SaTxfjvrv6taiscEyadOQpEsMF9npXTR_14gMnVK9DAnVZElPBg8Av3tbhr2uZDnGXegTduAEyUK_s_cEzky_t-QYPnmv6zgHLcN3WlGqaSgtEMnvzvq9Vh4jSwEUL_H9k0Wy5uCjeXdCEkpLiDInz6szLBVGMsbvMsRdUW9PaTZhE5d--3h5ovqYKcqsBE9850_-HsK1bh1f8TVyRxU"
            />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-on-surface-variant mb-1 ml-2">Марк Левин</span>
              <div className="bg-surface-container-lowest p-4 rounded-t-xl rounded-br-xl shadow-sm space-y-3">
                <p className="text-sm text-on-surface leading-relaxed">Кстати, Вильнёв подтвердил, что работа над третьей частью уже в активной фазе. Вот концепт-арт, который слили вчера:</p>
                <div className="rounded-lg overflow-hidden">
                  <img
                    alt="Concept Art"
                    className="w-full aspect-video object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD10GgamqH3RHHdVuTCnd1H8oUFt1yCURsiHHwWZgkZjgPIOh64f13jl_Lw24DdlSFgnUBszY_UY6aT-G6D8-eZ9ZvJ8ICnIgn3Fv63Z-keBGDMBIczGEHBU3TTkjvtHl4-dWy_OPBic9TpFiKRHukhVBRuk0wrVUkcDqIKy0XRxT1kHyUE0BrI7ee2kUYn9-SEaztlXHn74AFIk1LC5vfd0BfHme5zzqTk8gJT59NtW-pcJw7rzzWCDN20SxSOf-jf4w_Ez7huRg_x"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="bg-secondary-container px-2 py-1 rounded text-[10px] font-bold text-on-secondary-container">CRITIC CHOICE</div>
                  <span className="text-[10px] text-on-surface-variant">9.2/10 Рейтинг ожидания</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message: Received */}
          <div className="flex items-end gap-3 max-w-[85%] group">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-primary">ЕК</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-on-surface-variant mb-1 ml-2">Елена Котова</span>
              <div className="bg-surface-container-lowest p-4 rounded-t-xl rounded-br-xl shadow-sm">
                <p className="text-sm text-on-surface leading-relaxed">Потрясающе! Надеюсь, они сохранят ту же цветовую палитру. Это делает фильм таким монументальным.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Glassmorphism Chat Input Area */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        <div className="max-w-2xl mx-auto px-4 pb-8 pt-4">
          <div className="glass-input p-2 rounded-2xl flex items-center gap-2 border border-white/40 shadow-xl shadow-black/5">
            <button className="w-10 h-10 flex items-center justify-center text-primary hover:bg-white/40 rounded-xl transition-all">
              <span className="material-symbols-outlined">add_circle</span>
            </button>
            <input
              className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-sm placeholder:text-on-surface-variant/60"
              placeholder="Напишите сообщение..."
              type="text"
            />
            <button className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-md hover:bg-primary-dim transition-all active:scale-90">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
