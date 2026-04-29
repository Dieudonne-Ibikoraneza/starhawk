import { HomeNavbar } from "@/components/layout/HomeNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Linkedin, Github, ArrowRight } from "lucide-react";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import { motion } from "framer-motion";

const teamMembers = [
  {
    image: "/vico.jpg",
    name: "Victor Muragwa",
    role: "Business Lead",
    bio: "Driving STARHAWK's commercial vision and forging strategic partnerships to expand agricultural insurance access across Africa.",
    handle: "@victormuragwa",
    url: "https://linkedin.com/in/victormuragwa",
    icon: Linkedin,
    iconColor: "#0A66C2",
  },
  {
    image: "/kiba.jpg",
    name: "Kiba Muvunyi MBA",
    role: "Growth & Strategy Advisory",
    bio: "Advising on growth strategies and market expansion, leveraging deep expertise in African business development and agri-finance.",
    handle: "@kibamuvunyi",
    url: "https://linkedin.com/in/kibamuvunyi",
    icon: Linkedin,
    iconColor: "#0A66C2",
  },
  {
    image: "/gad.jpeg",
    name: "Gad Kalisa",
    role: "Software Engineer & Product Designer",
    bio: "Architecting and designing the technical backbone of STARHAWK — from satellite data pipelines to the user-facing platform experience.",
    handle: "@gadkalisa",
    url: "https://github.com/gadkalisa",
    icon: Github,
    iconColor: "#14284B",
  },
];

const values = [
  { label: "Innovation", desc: "Building tech-first solutions for traditional industries" },
  { label: "Integrity",  desc: "Transparent and honest in everything we do" },
  { label: "Impact",     desc: "Measurable outcomes for farmers and communities" },
];

const Team = () => {
  return (
    <CustomScrollbar>
      <div className="bg-[#f8f9fc] min-h-screen">
        <HomeNavbar />

        {/* ── Hero ── */}
        <section className="relative w-full overflow-hidden">
          <div className="relative w-full min-h-[50vh] flex flex-col">
            {/* Background */}
            <div className="absolute inset-0">
              <img
                src="/service.png"
                alt="Team hero background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#14284B]/88 via-[#14284B]/70 to-[#0a1628]/80" />
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
            </div>

            <div className="relative z-10 flex-1 flex items-center justify-center py-16 pt-32">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65 }}
                className="text-center px-6 max-w-3xl"
              >
                <span className="inline-block text-white/50 text-xs font-semibold tracking-[0.18em] uppercase mb-4">
                  The People Behind STARHAWK
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                  Our Expert Team
                </h1>
                <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl mx-auto">
                  A passionate team combining deep expertise in technology, agriculture, and insurance
                  to protect farmers and transform the sector.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Team Cards ── */}
        <section className="py-16 md:py-24 px-6 sm:px-8 lg:px-10">
          <div className="max-w-6xl mx-auto">
            {/* Section label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="inline-block text-[#14284B]/50 text-xs font-semibold tracking-[0.18em] uppercase mb-3">
                Leadership
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#14284B]">
                Meet the founders
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => {
                const Icon = member.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: index * 0.12 }}
                    className="group"
                  >
                    <div className="bg-white rounded-2xl border border-[#14284B]/8 shadow-[0_4px_24px_rgba(20,40,75,0.08)] hover:shadow-[0_12px_48px_rgba(20,40,75,0.16)] hover:-translate-y-1.5 transition-all duration-400 overflow-hidden flex flex-col">
                      {/* Photo */}
                      <div className="relative h-80 overflow-hidden">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#14284B]/80 via-[#14284B]/20 to-transparent" />

                        {/* Social badge */}
                        <a
                          href={member.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
                          aria-label={`${member.name} profile`}
                        >
                          <Icon className="h-5 w-5" style={{ color: member.iconColor }} />
                        </a>

                        {/* Name overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <h3 className="text-white font-black text-lg leading-tight">{member.name}</h3>
                          <p className="text-white/70 text-sm font-semibold mt-0.5">{member.role}</p>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="p-6 flex flex-col flex-1">
                        <p className="text-slate-600 text-sm leading-relaxed flex-1">{member.bio}</p>

                        <div className="mt-5 pt-4 border-t border-[#14284B]/8 flex items-center justify-between">
                          <span className="text-xs text-[#14284B]/50 font-medium">{member.handle}</span>
                          <a
                            href={member.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold text-[#14284B] hover:gap-2.5 transition-all duration-200"
                          >
                            View Profile
                            <ArrowRight className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Values strip ── */}
        <section className="py-12 md:py-16 bg-[#14284B]">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-white/10">
              {values.map((v, i) => (
                <motion.div
                  key={v.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center md:px-8"
                >
                  <h3 className="text-2xl font-black text-white mb-2">{v.label}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Join CTA ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-[#14284B]/50 text-xs font-semibold tracking-[0.18em] uppercase mb-4">
                Join Our Mission
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#14284B] mb-4">
                Passionate about AgriTech?
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
                We're always looking for talented people who care about food security, technology,
                and making a real impact across Africa.
              </p>
              <a
                href="mailto:info@starhawk.rw"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#14284B] text-white font-bold text-sm rounded-full hover:bg-[#0f1e38] transition-all duration-300 shadow-[0_4px_20px_rgba(20,40,75,0.3)] hover:shadow-[0_6px_28px_rgba(20,40,75,0.4)] hover:-translate-y-0.5"
              >
                Get In Touch
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </section>

        <FooterSection />
      </div>
    </CustomScrollbar>
  );
};

export default Team;
