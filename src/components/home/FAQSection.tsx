import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is agricultural insurance and how does it work?",
      answer: "Agricultural insurance protects farmers against crop losses due to natural disasters, pests, diseases, and adverse weather conditions. Our platform uses AI and satellite technology to assess risks, monitor crops, and process claims efficiently, ensuring farmers receive timely compensation for their losses."
    },
    {
      question: "How does the AI-powered risk assessment work?",
      answer: "Our AI system analyzes multiple data sources including satellite imagery, weather patterns, soil conditions, and historical data to evaluate farm-specific risks. This provides accurate risk scoring and helps insurers offer fair premiums while ensuring farmers get appropriate coverage for their crops."
    },
    {
      question: "What crops are covered under the insurance policies?",
      answer: "We cover a wide range of crops including maize, rice, beans, coffee, tea, potatoes, and other staple crops. Each policy is customized based on the crop type, farm size, location, and specific risk factors to provide comprehensive protection."
    },
    {
      question: "How long does it take to process a claim?",
      answer: "Our automated system significantly reduces claim processing time. Using drone surveillance and AI-powered damage assessment, most claims are processed within 7-10 days, compared to traditional methods that can take weeks or months."
    },
    {
      question: "How do I register as a farmer on the platform?",
      answer: "Simply click on the 'Farmer Portal' from the role selection page, fill out the registration form with your farm details, and submit required documents. Once verified, you'll receive a Farmer ID and can immediately start requesting insurance policies."
    },
    {
      question: "What technology is used for crop monitoring?",
      answer: "We use a combination of drone surveillance, satellite imagery (Sentinel-2), weather forecasting APIs, and IoT sensors to provide continuous crop monitoring. This multi-source approach ensures accurate, real-time data for both insurers and farmers."
    },
    {
      question: "How are premiums calculated?",
      answer: "Premiums are calculated based on multiple factors including crop type, farm size, location, historical yield data, weather patterns, and AI-assessed risk levels. Our automated underwriting system ensures fair and competitive pricing for all farmers."
    },
    {
      question: "Can I track my policy and claims online?",
      answer: "Yes! Our platform provides real-time tracking for all policies and claims. Farmers can log in to their dashboard to view policy status, file new claims, upload evidence, and track claim progress through every stage of assessment and approval."
    },
    {
      question: "What payment methods are supported?",
      answer: "We support multiple payment methods including mobile money (MTN Mobile Money, Airtel Money), bank transfers, and USSD services. This ensures farmers can easily pay premiums and receive claim payouts through their preferred channels."
    },
    {
      question: "Is there government support or subsidies available?",
      answer: "Yes, the government provides subsidies covering up to 15% of insurance premiums to make agricultural insurance more affordable for farmers. Our platform automatically applies these subsidies when calculating premium amounts."
    }
  ];

  return (
    <section className="relative bg-white py-20 sm:py-24 mb-12 sm:mb-16 md:mb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            FAQ
          </h2>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left py-4 flex items-center justify-between group hover:opacity-80 transition-opacity"
              >
                <span className="text-base sm:text-lg text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`h-5 w-5 text-gray-900 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div className="border-b border-gray-200"></div>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 pb-6">
                      <p className="text-base text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

