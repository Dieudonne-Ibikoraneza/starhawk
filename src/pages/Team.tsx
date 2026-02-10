import { HomeNavbar } from "@/components/layout/HomeNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const Team = () => {
  const teamMembers = [
    {
      image: "/vico.jpg",
      title: "Victor Muragwa",
      subtitle: "Business Lead",
      handle: "@victormuragwa",
      url: "https://linkedin.com/in/victormuragwa",
      icon: Linkedin
    },
    {
      image: "/kiba.jpg",
      title: "Kiba Muvunyi MBA",
      subtitle: "Growth & Strategy Advisory",
      handle: "@kibamuvunyi",
      url: "https://linkedin.com/in/kibamuvunyi",
      icon: Linkedin
    },
    {
      image: "/gad.jpeg",
      title: "Gad Kalisa",
      subtitle: "Software Engineer & Product Designer",
      handle: "@gadkalisa",
      url: "https://github.com/gadkalisa",
      icon: Github
    }
  ];

  return (
    <CustomScrollbar>
      <div 
        className="relative min-h-screen"
        style={{
          backgroundImage: 'url(/bg_img.png)',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <HomeNavbar />

        {/* Hero Section */}
        <section className="relative py-8">
          <div className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24 text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/80 backdrop-blur-sm p-6 rounded-lg"
            >
              <h1 className="text-xl font-bold text-[rgba(20,40,75,1)] mb-4">
                Our Expert Team
              </h1>
              
              <p className="text-base text-gray-600 max-w-3xl leading-relaxed">
                The talented individuals behind STARHAWK's revolutionary agricultural insurance platform.
                Our team combines expertise in technology, agriculture, and insurance to deliver 
                innovative solutions for farmers worldwide.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => {
                const Icon = member.icon;
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="border border-gray-200 hover:border-[rgba(20,40,75,0.3)] hover:shadow-lg transition-all duration-300 overflow-hidden group">
                      <div className="relative h-96 overflow-hidden">
                        <img 
                          src={member.image} 
                          alt={member.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        
                        {/* Social Icon - Top Right */}
                        <div className="absolute top-4 right-4">
                          <a 
                            href={member.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white rounded-full backdrop-blur-sm transition-colors shadow-lg"
                          >
                            <Icon className="h-5 w-5 text-gray-700" />
                          </a>
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        
                        {/* Text Overlay - Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-base font-bold text-white mb-1">{member.title}</h3>
                          <p className="text-[rgba(20,40,75,0.6)] text-sm font-medium mb-1">{member.subtitle}</p>
                          <p className="text-white/80 text-xs">{member.handle}</p>      
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <FooterSection />
      </div>
    </CustomScrollbar>
  );
};

export default Team;
