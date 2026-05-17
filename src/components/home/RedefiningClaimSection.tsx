import { motion } from "framer-motion";
import { Clock, TrendingDown, Layers, MapPinOff, Zap } from "lucide-react";

export function RedefiningClaimSection() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden bg-[#fdfdfd]">
      
      {/* Elegant Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#14284B]/[0.02] rounded-full blur-[100px] -translate-y-1/3" />
        <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-emerald-400/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Main Section Full Background Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-100"
        style={{
          backgroundImage: "url('/bg_img.png')",
          backgroundPosition: "left top",
          backgroundRepeat: "no-repeat",
          backgroundSize: "auto 100%"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
        
        {/* Right Side: Content Area (Pushed right to avoid bg_img pattern) */}
        <div className="w-full pl-0 md:pl-28 lg:pl-32 xl:pl-44">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 mb-6">
               <span className="flex h-[3px] w-6 bg-[#14284B]" />
               <span className="text-[#14284B]/60 text-xs font-bold tracking-[0.2em] uppercase">
                 Efficiency & Scale
               </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#14284B] leading-[1.1] mb-10">
              From Weeks to Minutes:<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14284B]/80 to-[#14284B]/40">
                Redefining Claim Assessments
              </span>
            </h2>
            
            <div className="space-y-6 text-[15px] sm:text-base md:text-lg text-slate-600 leading-relaxed font-light mb-12">
              <p>
                In the fast-changing world of agro-insurance, digital technologies are reshaping risk management. Reliable, accurate data is the backbone of effective insurance practices, enabling companies to assess risks, set fair premiums, and customize coverage for specific farming practices.
              </p>
              <p>
                Yet, traditional methods create massive operational bottlenecks. Relying on field agents to manually inspect remote, scattered farms makes claims slow, unscalable, and expensive to process. This reliance on physical field visits leaves insurers buried under high administrative costs and forces smallholder farmers to wait too long for critical payouts.
              </p>
            </div>

            {/* Premium Blockquote */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative p-8 md:p-10 bg-gradient-to-br from-[#14284B] to-[#0a1628] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden mb-12"
            >
              {/* Internal Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative z-10 flex gap-4 md:gap-6">
                <div className="flex-shrink-0 w-1 bg-gradient-to-b from-[#4ade80] to-transparent rounded-full" />
                <p className="text-white/90 font-medium text-base sm:text-lg md:text-xl leading-relaxed italic">
                  "To bridge this gap, Starhawk introduces high-resolution drones and satellite data into the claim workflow. This hybrid approach allows insurers to instantly assess damage caused by climate shocks or pests in remote areas without sending teams to the field. By replacing manual inspection delays with automated geospatial data, we eliminate high administrative overhead and ensure farmers receive prompt, accurate support when they need it most."
                </p>
              </div>
            </motion.div>

            {/* Added Value Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#14284B]/10 mt-6">
               <div className="flex flex-col gap-2">
                 <div className="w-10 h-10 rounded-full bg-[#14284B]/5 flex items-center justify-center mb-2">
                   <Clock className="w-5 h-5 text-[#14284B]" />
                 </div>
                 <h4 className="font-bold text-[#14284B] text-sm">Instant Resolution</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">Processing times drop from weeks to near real-time minutes.</p>
               </div>
               <div className="flex flex-col gap-2">
                 <div className="w-10 h-10 rounded-full bg-[#14284B]/5 flex items-center justify-center mb-2">
                   <TrendingDown className="w-5 h-5 text-[#14284B]" />
                 </div>
                 <h4 className="font-bold text-[#14284B] text-sm">Lower Overhead</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">Dramatically reduce operational and manual inspection costs.</p>
               </div>
               <div className="flex flex-col gap-2">
                 <div className="w-10 h-10 rounded-full bg-[#14284B]/5 flex items-center justify-center mb-2">
                   <MapPinOff className="w-5 h-5 text-[#14284B]" />
                 </div>
                 <h4 className="font-bold text-[#14284B] text-sm">No Field Visits</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">Scale across thousands of remote farms without sending agents.</p>
               </div>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
