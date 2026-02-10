import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { TrendingUp, Users, Shield, Globe } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Active Farmers",
    description: "Trusted by farmers across the region",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Globe,
    value: "50,000+",
    label: "Farms Monitored",
    description: "Real-time monitoring and protection",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    value: "98%",
    label: "Accuracy Rate",
    description: "AI-powered risk assessment precision",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: TrendingUp,
    value: "$5M+",
    label: "Claims Processed",
    description: "Fast and reliable payout system",
    color: "from-orange-500 to-red-500"
  }
];

function AnimatedCounter({ value, inView }: { value: string; inView: boolean }) {
  // Extract number from value (e.g., "10,000+" -> 10000)
  const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
  const suffix = value.replace(/[0-9,]/g, ''); // Get +, %, $, etc.
  
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, numValue);
      setDisplayValue(Math.floor(current));
      
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(numValue);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [inView, numValue]);

  // Format number with commas
  const formatted = displayValue.toLocaleString();
  
  return <span>{formatted}{suffix}</span>;
}

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-20 md:py-28 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating Orbs */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
      ></motion.div>
      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
      ></motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by Thousands
            <br />
            <span className="text-white/90">Across the Region</span>
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Our platform is making a real difference in agricultural insurance, 
            helping farmers protect their livelihoods with cutting-edge technology.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/0 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>

                {/* Value */}
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value.includes('%') || stat.value.includes('$') ? (
                    stat.value
                  ) : (
                    <AnimatedCounter value={stat.value} inView={isInView} />
                  )}
                </div>

                {/* Label */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-green-50 text-sm">
                  {stat.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
