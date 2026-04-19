"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    eyebrow: "3D cake designer for bakers",
    headline: ["Your customers design", "their cake in 3D.", "You just bake it."],
    highlight: "You just bake it.",
    sub: "They pick every layer, colour and topping — in 3D. You get a confirmed design, ready to bake.",
  },
  {
    eyebrow: "Save hours every week",
    headline: ["Less design chats.", "More baking."],
    highlight: "More baking.",
    sub: "Stop spending hours describing cake designs over messages. Let your customers design it themselves.",
  },
  {
    eyebrow: "No design skills needed.",
    headline: ["No design skills needed.", "Start from a template."],
    highlight: "Start from a template.",
    sub: "Choose from cake templates — your customers pick one and personalise it to their taste.",
  },
  {
    eyebrow: "They see your brand, not ours.",
    headline: ["Your logo.", "Your colours.", "Your customer's design experience."],
    highlight: "Your customer's design experience.",
    sub: "Every design link your customer opens carries your brand — your logo, your colours, your identity.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function HeroText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <>
      {/* Desktop */}
      <motion.div
        className="hidden md:block relative z-10 px-16 max-w-lg"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={`eyebrow-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block text-xs tracking-[0.2em] uppercase text-[#a8c5b5] font-medium mb-5 px-4 py-1.5 rounded-full"
            style={{ border: "1px solid rgba(107,143,126,0.4)", backgroundColor: "rgba(107,143,126,0.08)" }}
          >
            {slide.eyebrow}
          </motion.p>
        </AnimatePresence>

        {/* Cycling headline */}
        <div className="mb-6" style={{ minHeight: "200px" }}>
          <AnimatePresence mode="wait">
            <motion.h1
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-5xl font-bold leading-snug text-[#edeae3]"
            >
              {slide.headline.map((line, i) =>
                line === slide.highlight ? (
                  <span key={line} className="text-transparent bg-clip-text bg-gradient-to-r from-[#edeae3] to-[#a8c5b5]">
                    {i > 0 && <br />}{line}
                  </span>
                ) : (
                  <span key={line}>
                    {i > 0 && <br />}{line}
                  </span>
                )
              )}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Cycling subline */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`sub-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-base text-[#edeae3]/70 mb-8 leading-relaxed"
          >
            {slide.sub}
          </motion.p>
        </AnimatePresence>

        {/* Dot indicators */}
        <motion.div variants={item} className="flex gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="h-1 rounded-full transition-all cursor-pointer"
              style={{
                width: i === index ? "24px" : "8px",
                backgroundColor: i === index ? "#6b8f7e" : "rgba(237,234,227,0.2)",
              }}
            />
          ))}
        </motion.div>

        <motion.div variants={item} className="flex gap-3">
          <a href="#how-it-works" className="px-6 py-2.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm hover:bg-[#4a6357] transition-colors text-center">
            See How It Works
          </a>
          <a href="https://spattoo.app" className="px-6 py-2.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm hover:bg-[#4a6357] transition-colors text-center">
            Get Started Free
          </a>
        </motion.div>
      </motion.div>

      {/* Mobile */}
      <motion.div
        className="md:hidden absolute bottom-0 left-0 right-0 z-10 px-6 pt-6 pb-10"
        style={{ background: "linear-gradient(to top, #111111 60%, transparent)" }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={`mob-eyebrow-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block text-[10px] tracking-[0.2em] uppercase text-[#a8c5b5] font-medium mb-2 px-3 py-1 rounded-full"
            style={{ border: "1px solid rgba(107,143,126,0.4)", backgroundColor: "rgba(107,143,126,0.08)" }}
          >
            {slide.eyebrow}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.h1
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold leading-snug mb-2 text-[#edeae3]"
          >
            {slide.headline.map((line, i) =>
              line === slide.highlight ? (
                <span key={line} className="text-transparent bg-clip-text bg-gradient-to-r from-[#edeae3] to-[#a8c5b5]">
                  {i > 0 && <br />}{line}
                </span>
              ) : (
                <span key={line}>
                  {i > 0 && <br />}{line}
                </span>
              )
            )}
          </motion.h1>
        </AnimatePresence>

        <div className="flex gap-2 mb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="h-1 rounded-full transition-all cursor-pointer"
              style={{
                width: i === index ? "20px" : "6px",
                backgroundColor: i === index ? "#6b8f7e" : "rgba(237,234,227,0.2)",
              }}
            />
          ))}
        </div>

        <motion.div variants={item} className="flex gap-3">
          <a href="#how-it-works" className="flex-1 py-3.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm text-center">
            See How It Works
          </a>
          <a href="https://spattoo.app" className="flex-1 py-3.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm text-center">
            Get Started Free
          </a>
        </motion.div>
      </motion.div>
    </>
  );
}
