'use client';

import React from 'react';
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';

/**
 * Обёртка для любой «нажимаемой» кнопки/карточки.
 * Даёт лёгкий pop-эффект (scale) на hover/tap — ощущение «отзывчивого» UI.
 */
export function TapScale({
  children,
  className = '',
  disabled = false,
  ...rest
}: HTMLMotionProps<'button'> & { disabled?: boolean }) {
  return (
    <motion.button
      className={className}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

/**
 * Лайк-кнопка с «сердечком-burst»: иконка подпрыгивает, а при активации
 * вылетает небольшой halo. Не завязана на конкретный API — принимает
 * текущее состояние liked и счётчик.
 */
export function LikeButton({
  liked,
  count,
  onToggle,
  size = 20,
}: {
  liked: boolean;
  count: number;
  onToggle: () => void;
  size?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      whileTap={{ scale: 0.85 }}
      className="relative flex items-center gap-2 group/btn"
    >
      <span className="relative flex items-center justify-center">
        <AnimatePresence>
          {liked && (
            <motion.span
              key="halo"
              className="absolute inset-0 rounded-full bg-red-400/30"
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
        <motion.span
          key={liked ? 'filled' : 'outline'}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="material-symbols-outlined"
          style={{
            fontSize: size,
            color: liked ? '#e0245e' : 'currentColor',
            fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          favorite
        </motion.span>
      </span>
      <motion.span
        key={count}
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-[12px] font-black text-on-surface"
      >
        {count}
      </motion.span>
    </motion.button>
  );
}

/**
 * Анимированная обёртка элемента списка — fade+slide-in с небольшой задержкой.
 * Используется для карточек, которые появляются после загрузки.
 */
export function MotionListItem({
  children,
  index = 0,
  className = '',
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Галочка «выполнено» для пунктов марафона — рисуется с анимацией.
 * Используйте при переключении isCompleted в true.
 */
export function CheckBurst({ active }: { active: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {active ? (
        <motion.span
          key="check"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="material-symbols-outlined text-emerald-500"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </motion.span>
      ) : (
        <motion.span
          key="empty"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="material-symbols-outlined text-on-surface-variant/50"
        >
          radio_button_unchecked
        </motion.span>
      )}
    </AnimatePresence>
  );
}
