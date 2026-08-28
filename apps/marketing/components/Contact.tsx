const socials = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/spattoo.official/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@spattoo.official",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    ),
  },
];

export default function Contact() {
  return (
    <section id="contact" className="py-20 px-8 md:px-16 bg-[#0f0f0f] border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs tracking-[0.35em] uppercase text-[#6b8f7e] mb-3">Get in touch</p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#edeae3] mb-10">We&apos;re here to help.</h2>

        <div className="grid md:grid-cols-3 gap-10">

          {/* Email */}
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-widest text-[#6b8f7e]">Email</p>
            <a
              href="mailto:care@spattoo.com"
              className="text-[#edeae3] font-medium hover:text-[#a8c5b5] transition-colors"
            >
              care@spattoo.com
            </a>
            <p className="text-xs text-[#edeae3]/45">We reply within 24 hours</p>
          </div>

          {/* Phone & WhatsApp */}
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-widest text-[#6b8f7e]">Phone & WhatsApp</p>
            <a
              href="tel:+919104844000"
              className="text-[#edeae3] font-medium hover:text-[#a8c5b5] transition-colors"
            >
              +91 91048 44000
            </a>
            <a
              href="https://wa.me/919104844000"
              className="text-xs text-[#6b8f7e] hover:text-[#a8c5b5] transition-colors"
            >
              Chat on WhatsApp →
            </a>
          </div>

          {/* Socials */}
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-[#6b8f7e]">Follow Us</p>
            <div className="flex items-center gap-4">
              {socials.map(({ name, href, icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="text-[#edeae3]/40 hover:text-[#a8c5b5] transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
