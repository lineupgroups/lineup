import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { reportProject, reportUser } from '../../lib/reports';
import { FirestoreReport } from '../../types/firestore';
import toast from 'react-hot-toast';

interface ReportButtonProps {
  targetType: 'project' | 'user';
  targetId: string;
  targetName: string;
}

export default function ReportButton({ targetType, targetId, targetName }: ReportButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<FirestoreReport['category']>('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !description.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      if (targetType === 'project') {
        await reportProject(
          targetId,
          user.uid,
          user.displayName || 'Anonymous',
          user.email || '',
          category,
          description
        );
      } else {
        await reportUser(
          targetId,
          user.uid,
          user.displayName || 'Anonymous',
          user.email || '',
          category,
          description
        );
      }

      toast.success('Report submitted successfully');
      setShowModal(false);
      setDescription('');
      setCategory('spam');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="group flex items-center space-x-2 px-3 py-1.5 rounded-full border border-neutral-800 hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-300"
        title={`Report ${targetType}`}
      >
        <Flag className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-500 transition-colors" />
        <span className="text-[10px] font-black italic uppercase tracking-widest text-neutral-500 group-hover:text-red-500 transition-colors">Report</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-[#111] rounded-[1.5rem] border border-neutral-800 max-w-md w-full p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Luxury Background Accents */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-red-500" />
                    Protocol Violation
                  </h3>
                  <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">
                    Report {targetType}
                  </h4>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full bg-white/5 border border-white/5 text-neutral-500 hover:text-brand-white hover:border-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[9px] font-black italic uppercase tracking-widest text-neutral-600 mb-1">Target Identity</p>
                <p className="text-sm font-bold text-brand-white truncate">{targetName}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black italic uppercase tracking-widest text-neutral-500 mb-3 ml-1">
                    Violation Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as FirestoreReport['category'])}
                      className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl p-3 text-sm text-brand-white focus:outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="spam">Spam / Bot Activity</option>
                      <option value="fraud">Fraudulent Content</option>
                      <option value="inappropriate_content">Inappropriate Material</option>
                      <option value="harassment">Targeted Harassment</option>
                      <option value="misinformation">False Information</option>
                      <option value="other">Other Violation</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black italic uppercase tracking-widest text-neutral-500 mb-3 ml-1">
                    Intel Briefing <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide specific details about this violation..."
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl p-3 text-sm text-brand-white placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50 transition-all resize-none h-20"
                    required
                  />
                  <div className="flex items-center gap-2 mt-3 ml-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                    <p className="text-[9px] font-black italic uppercase tracking-widest text-neutral-600">
                      Submit precise evidence for faster processing
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !description.trim()}
                  className="w-full relative group overflow-hidden px-8 py-3 bg-red-600 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <Flag className="w-4 h-4 text-white" />
                    <span className="text-sm font-black italic uppercase tracking-widest text-white">
                      {submitting ? 'Transmitting...' : 'Submit Evidence'}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="w-full py-3 text-[10px] font-black italic uppercase tracking-[0.2em] text-neutral-600 hover:text-brand-white transition-colors uppercase"
                >
                  Abort Protocol
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5">
                <p className="text-[9px] font-medium leading-relaxed text-neutral-600 text-center italic">
                  False reports may result in permanent account suspension. <br />
                  All submissions are analyzed by the Central Intelligence unit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Add ChevronDown to imports
import { ChevronDown } from 'lucide-react';



