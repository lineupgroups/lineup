import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search, MessageCircle, Activity, Sparkles } from 'lucide-react';
import { useFAQItems } from '../../hooks/useLandingPage';

export default function FAQSection() {
  const { faqs, loading } = useFAQItems(true); // Get featured FAQs
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (loading) {
    return (
      <section className="py-24 bg-brand-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/5 h-24 rounded-[1.5rem]"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  // Filter FAQs
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      all: 'Global Registry',
      creator: 'Creator Protocol',
      supporter: 'Supporter Protocol',
      general: 'System General',
      payment: 'Capital Flow',
      legal: 'Compliance'
    };
    return labels[category] || category.toUpperCase();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      creator: 'text-brand-acid',
      supporter: 'text-brand-orange',
      general: 'text-neutral-400',
      payment: 'text-brand-acid',
      legal: 'text-neutral-500'
    };
    return colors[category] || 'text-neutral-400';
  };

  return (
    <section className="py-32 bg-brand-black relative overflow-hidden border-b border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-brand-acid/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
            <HelpCircle className="w-4 h-4 text-brand-acid" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
              SYSTEM <span className="text-brand-acid">KNOWLEDGE</span>
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-brand-white italic uppercase tracking-tighter mb-8 leading-none">
            INTEL <span className="text-brand-orange">REPOSITORY</span>
          </h2>
          <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-medium tracking-tight">
            Deciphering the operational protocols of the Idea Nation ecosystem.
          </p>
        </div>

        {/* Search Bar - Cinematic UI */}
        <div className="mb-12">
          <div className="relative max-w-3xl mx-auto group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-acid/20 to-brand-orange/20 rounded-[2rem] blur opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-hover:text-brand-acid transition-colors" />
              <input
                type="text"
                placeholder="QUERY THE KNOWLEDGE BASE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 py-6 bg-brand-black border border-white/10 rounded-[2rem] focus:border-brand-acid outline-none transition-all text-brand-white placeholder-neutral-700 font-black italic uppercase tracking-widest text-xs"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-8 py-3 rounded-full text-[9px] font-black italic uppercase tracking-[0.2em] transition-all duration-500 ${selectedCategory === category
                  ? 'bg-brand-acid text-brand-black shadow-[0_0_20px_rgba(204,255,0,0.3)] border-transparent'
                  : 'bg-white/5 text-neutral-500 hover:text-brand-white border border-white/10'
                }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-6">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <Activity className="w-12 h-12 text-neutral-800 mx-auto mb-6 animate-pulse" />
              <p className="text-neutral-600 font-black uppercase tracking-[0.3em] text-[10px]">Zero Intel Matches Found</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-6 text-brand-acid hover:text-brand-white font-black italic uppercase tracking-widest text-[9px] transition-colors"
              >
                Reset Search Protocol
              </button>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <div
                key={faq.id}
                className={`group relative bg-white/5 backdrop-blur-3xl rounded-[2rem] border transition-all duration-500 overflow-hidden ${
                  openIndex === index ? 'border-brand-acid/30 bg-white/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-8 text-left transition-colors"
                >
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${getCategoryColor(faq.category)}`}>
                        {getCategoryLabel(faq.category)}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-brand-white italic uppercase tracking-tight group-hover:text-brand-acid transition-colors">
                      {faq.question}
                    </h3>
                  </div>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500 ${openIndex === index ? 'rotate-180 bg-brand-acid border-brand-acid' : ''}`}>
                    <ChevronDown className={`w-5 h-5 ${openIndex === index ? 'text-brand-black' : 'text-neutral-600'}`} />
                  </div>
                </button>

                {/* Answer */}
                <div
                  className={`transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="px-8 pb-10">
                    <div className="h-[1px] w-full bg-white/5 mb-8"></div>
                    <p className="text-lg text-neutral-400 font-medium leading-relaxed tracking-tight">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Global Support CTA */}
        <div className="mt-24 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-acid to-brand-orange rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
          <div className="relative bg-brand-black rounded-[3rem] p-12 border border-white/10 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-acid/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <MessageCircle className="w-16 h-16 mx-auto mb-8 text-brand-orange group-hover:scale-110 transition-transform" />
            <h3 className="text-4xl font-black text-brand-white italic uppercase tracking-tighter mb-4 leading-none">
              PERSISTENT QUERIES?
            </h3>
            <p className="text-neutral-500 font-medium text-lg mb-12 max-w-xl mx-auto">
              Our tactical support collective is active 24/7 to resolve complex protocol exceptions.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="px-12 py-5 bg-brand-acid text-brand-black font-black italic uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-brand-acid/20 hover:scale-105 active:scale-95 transition-all">
                Establish Direct Feed
              </button>
              <button className="px-12 py-5 bg-white/5 backdrop-blur-2xl text-brand-white font-black italic uppercase tracking-[0.2em] text-xs rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all">
                Archive Surveillance
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
