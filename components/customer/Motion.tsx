"use client";

import {
  motion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

interface MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease,
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease,
    },
  },
};

export function MotionSection({
  children,
  className,
  delay = 0,
  duration = 0.55,
}: MotionProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 24,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.12,
      }}
      transition={{
        duration,
        delay,
        ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionStagger({
  children,
  className,
}: MotionProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        amount: 0.08,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({
  children,
  className,
}: MotionProps) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionButton({
  children,
  className,
  ...props
}: HTMLMotionProps<"button">) {
  return (
    <motion.button
      {...props}
      whileHover={{
        y: -2,
        scale: 1.015,
      }}
      whileTap={{
        scale: 0.97,
      }}
      transition={{
        duration: 0.18,
        ease,
      }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

export function MotionLink({
  children,
  className,
  ...props
}: HTMLMotionProps<"a">) {
  return (
    <motion.a
      {...props}
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale: 0.97,
      }}
      transition={{
        duration: 0.18,
        ease,
      }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export function MotionCard({
  children,
  className,
}: MotionProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.08,
      }}
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.45,
        ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionImage({
  children,
  className,
}: MotionProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 1.02,
      }}
      whileInView={{
        opacity: 1,
        scale: 1,
      }}
      viewport={{
        once: true,
        amount: 0.1,
      }}
      transition={{
        duration: 0.7,
        ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}