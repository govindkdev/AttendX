import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/common/ScrollReveal';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const Contact: React.FC = () => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.submitContact(data);
      setSuccessMsg(res.message || 'Inquiry submitted successfully.');
      reset();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 text-[#F8FAFC]">
      <ScrollReveal className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-[#3B82F6] tracking-wider uppercase">
          Institutional Inquiries
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC]">
          Contact Campus Office
        </h1>
        <p className="text-base sm:text-lg text-[#A1AEC2] leading-relaxed">
          Questions regarding AttendX deployment, academic integration, or faculty and student onboarding? Reach out to our campus office.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {/* Contact Info Card */}
        <ScrollReveal delay={0}>
          <div className="bg-[#111D30] border border-[#23334A] text-[#F8FAFC] rounded-3xl p-7 sm:p-8 space-y-8 shadow-xl h-full">
            <div>
              <h3 className="text-xl font-bold mb-1">Campus Administration</h3>
              <p className="text-xs text-[#A1AEC2]">AttendX Academic Systems</p>
            </div>

            <div className="space-y-6 text-sm text-[#A1AEC2]">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#F8FAFC]">Academic Systems Division</p>
                  <p className="text-xs text-[#A1AEC2] mt-0.5">Campus Academic Complex, Lucknow, Uttar Pradesh 226201</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#F8FAFC]">Electronic Correspondence</p>
                  <p className="text-xs text-[#A1AEC2] mt-0.5">contact@attendx.com</p>
                  <p className="text-xs text-[#A1AEC2]">support@attendx.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#F8FAFC]">Administrative Helpdesk</p>
                  <p className="text-xs text-[#A1AEC2] mt-0.5">+91 (522) 200-4000</p>
                  <p className="text-xs text-[#64748B]">Mon – Sat: 9:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Contact Form */}
        <ScrollReveal delay={150} className="md:col-span-2">
          <div className="bg-[#111D30] rounded-3xl p-7 sm:p-8 border border-[#23334A] shadow-xl">
            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full bg-[#0D1525] px-4 py-2.5 rounded-xl border border-[#23334A] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all"
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="name@institute.edu"
                    className="w-full bg-[#0D1525] px-4 py-2.5 rounded-xl border border-[#23334A] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all"
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  {...register('subject')}
                  placeholder="Inquiry regarding department attendance setup"
                  className="w-full bg-[#0D1525] px-4 py-2.5 rounded-xl border border-[#23334A] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all"
                />
                {errors.subject && <p className="mt-1 text-xs text-rose-400">{errors.subject.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1AEC2] uppercase tracking-wider mb-2">
                  Message Content
                </label>
                <textarea
                  rows={5}
                  {...register('message')}
                  placeholder="Please describe your campus inquiry in detail..."
                  className="w-full bg-[#0D1525] px-4 py-2.5 rounded-xl border border-[#23334A] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all"
                ></textarea>
                {errors.message && <p className="mt-1 text-xs text-rose-400">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center px-7 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs tracking-wide uppercase disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
              >
                {submitting ? 'Submitting...' : 'Send Inquiry'}
                <Send className="w-4 h-4 ml-2" />
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
