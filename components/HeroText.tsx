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

function Headline({ line, isHighlight, addBreak }: { line: string; isHighlight: boolean; addBreak: boolean }) {
  return isHighlight ? (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#edeae3] to-[#a8c5b5]">
      {addBreak && <br />}{line}
    </span>
  ) : (
    <span>{addBreak && <br />}{line}</span>
  );
}

export default function HeroText() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block relative z-10 px-16 max-w-lg">
        {/* Eyebrow — always visible, fades on slide change */}
        <AnimatePresence initial={false}>
          <motion.p
            key={`eyebrow-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-block text-xs tracking-[0.2em] uppercase text-[#a8c5b5] font-medium mb-5 px-4 py-1.5 rounded-full"
            style={{ border: "1px solid rgba(107,143,126,0.4)", backgroundColor: "rgba(107,143,126,0.08)" }}
          >
            {slide.eyebrow}
          </motion.p>
        </AnimatePresence>

        {/* Headline */}
        <div className="mb-6" style={{ minHeight: "200px" }}>
          <AnimatePresence initial={false}>
            <motion.h1
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
              className="text-4xl md:text-5xl font-bold leading-snug text-[#edeae3]"
            >
              {slide.headline.map((line, i) => (
                <Headline key={line} line={line} isHighlight={line === slide.highlight} addBreak={i > 0} />
              ))}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Subline */}
        <AnimatePresence initial={false}>
          <motion.p
            key={`sub-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-base text-[#edeae3]/70 mb-8 leading-relaxed"
          >
            {slide.sub}
          </motion.p>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex gap-2 mb-6">
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
        </div>

        <div className="flex gap-3">
          <a href="#how-it-works" className="px-6 py-2.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm hover:bg-[#4a6357] transition-colors text-center">
            See How It Works
          </a>
          <a href="https://spattoo.app" className="px-6 py-2.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm hover:bg-[#4a6357] transition-colors text-center">
            Get Started Free
          </a>
        </div>
      </div>

      {/* Mobile */}
      <div
        className="md:hidden absolute bottom-0 left-0 right-0 z-10 px-6 pt-6 pb-10"
        style={{ background: "linear-gradient(to top, #111111 60%, transparent)" }}
      >
        <AnimatePresence initial={false}>
          <motion.p
            key={`mob-eyebrow-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-block text-[10px] tracking-[0.2em] uppercase text-[#a8c5b5] font-medium mb-2 px-3 py-1 rounded-full"
            style={{ border: "1px solid rgba(107,143,126,0.4)", backgroundColor: "rgba(107,143,126,0.08)" }}
          >
            {slide.eyebrow}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence initial={false}>
          <motion.h1
            key={`mob-h-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, position: "absolute" } as object}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold leading-snug mb-2 text-[#edeae3]"
          >
            {slide.headline.map((line, i) => (
              <Headline key={line} line={line} isHighlight={line === slide.highlight} addBreak={i > 0} />
            ))}
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

        <div className="flex gap-3">
          <a href="#how-it-works" className="flex-1 py-3.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm text-center">
            See How It Works
          </a>
          <a href="https://spattoo.app" className="flex-1 py-3.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm text-center">
            Get Started Free
          </a>
        </div>
      </div>
    </>
  );
}
