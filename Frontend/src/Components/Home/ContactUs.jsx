import React, { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

const quickContacts = [
  {
    title: "Call us",
    description: "Speak with our support team for orders, deliveries, and product availability.",
    value: "+91 98765 43210",
    icon: Phone,
    accent: "bg-green-50 text-[#0e6827]",
  },
  {
    title: "Email us",
    description: "Send your questions or feedback and we will reply within a few working hours.",
    value: "support@supermarket.in",
    icon: Mail,
    accent: "bg-amber-50 text-amber-700",
  },
  {
    title: "Visit the store",
    description: "Drop by for fresh produce, household essentials, and quick pickups.",
    value: "12, Main Market Road, Chennai",
    icon: Store,
    accent: "bg-slate-100 text-slate-700",
  },
];

const serviceCards = [
  {
    title: "Same-day delivery",
    text: "Fast delivery for essentials, snacks, beverages, and everyday needs.",
    icon: Truck,
  },
  {
    title: "Fresh quality",
    text: "Carefully sourced vegetables, dairy, pantry staples, and household items.",
    icon: ShoppingBag,
  },
  {
    title: "Helpful support",
    text: "Friendly staff ready to assist you with orders, returns, and product picks.",
    icon: BadgeCheck,
  },
];

const supportHighlights = [
  {
    title: "Order updates",
    text: "Track your delivery window, pickup status, and any special requests with ease.",
  },
  {
    title: "Bulk shopping",
    text: "Ask about family packs, party supplies, and weekly pantry restocking options.",
  },
  {
    title: "Store offers",
    text: "Get help with discounts, seasonal deals, and loyalty benefits available in-store.",
  },
];

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-[#f7f8f3] text-slate-800">
      <PageHeader title="Contact Us" />

      <PageContainer>
        <div className="py-8 sm:py-10">
          <div className="overflow-hidden rounded-[2rem] border border-green-100 bg-gradient-to-br from-[#0e6827] via-[#168637] to-[#ffc107] p-8 shadow-[0_20px_50px_rgba(14,104,39,0.2)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  Everyday essentials made easy
                </div>
                <h1 className="mt-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  Need help with your supermarket order?
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                  From fresh groceries and pantry staples to household supplies and quick delivery support, our team is ready to help you shop with ease.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="tel:+919876543210"
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0e6827] transition hover:bg-green-50"
                  >
                    Call now
                  </a>
                  <a
                    href="mailto:support@supermarket.in"
                    className="rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Email support
                  </a>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                  <Clock3 className="h-4 w-4" />
                  Store hours
                </div>
                <div className="mt-4 space-y-3 text-sm text-white/85">
                  <div className="flex items-center justify-between border-b border-white/15 pb-2">
                    <span>Mon - Fri</span>
                    <span className="font-semibold">7:00 AM - 10:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/15 pb-2">
                    <span>Saturday</span>
                    <span className="font-semibold">7:00 AM - 11:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sunday</span>
                    <span className="font-semibold">8:00 AM - 9:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {quickContacts.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-[0_20px_40px_rgba(14,104,39,0.06)]">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                  <p className="mt-4 text-sm font-semibold text-[#0e6827]">{item.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_40px_rgba(14,104,39,0.08)] sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0e6827]">More ways to help</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Everything you need for a smoother grocery experience</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Whether you are planning a weekly shop, checking on a delivery, or looking for seasonal offers, our team is here to make every visit feel easy and convenient.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[480px]">
                {supportHighlights.map((item) => (
                  <div key={item.title} className="rounded-[1.25rem] bg-[#f7f8f3] p-4">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_40px_rgba(14,104,39,0.08)] sm:p-8">
              <div className="flex items-center gap-2 text-[#0e6827]">
                <MessageCircle className="h-5 w-5" />
                <h3 className="text-xl font-semibold text-slate-900">Send us a message</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Share your order concerns, delivery questions, or product requests and we will get back to you quickly.
              </p>

              {submitted ? (
                <div className="mt-6 rounded-[1.25rem] border border-green-200 bg-green-50 p-6 text-center">
                  <p className="text-lg font-semibold text-[#0e6827]">Thanks for reaching out!</p>
                  <p className="mt-2 text-sm text-slate-600">Our supermarket team will contact you shortly with the help you need.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100"
                      required
                    />
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email address"
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100"
                    />
                    <input
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Subject"
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100"
                      required
                    />
                  </div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help"
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#0e6827] focus:bg-white focus:ring-2 focus:ring-green-100"
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0e6827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#168637]"
                  >
                    Send message
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_40px_rgba(14,104,39,0.08)]">
                <div className="flex items-center gap-2 text-[#0e6827]">
                  <MapPin className="h-5 w-5" />
                  <h3 className="text-xl font-semibold text-slate-900">Visit our supermarket</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  Shop fresh produce, daily essentials, and household supplies at our main branch.
                </p>
                <div className="mt-4 rounded-[1.25rem] bg-[#f7f8f3] p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Supermarket Main Branch</p>
                  <p className="mt-2">12, Main Market Road</p>
                  <p>West Tambaram, Chennai - 600045</p>
                  <p className="mt-2">Phone: +91 98765 43210</p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_40px_rgba(14,104,39,0.08)]">
                <h3 className="text-xl font-semibold text-slate-900">Why shoppers choose us</h3>
                <div className="mt-4 space-y-4">
                  {serviceCards.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex gap-3 rounded-[1.25rem] bg-[#f7f8f3] p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0e6827]/10 text-[#0e6827]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_40px_rgba(14,104,39,0.08)]">
                <h3 className="text-lg font-semibold text-slate-900">Follow us</h3>
                <div className="mt-4 flex gap-3">
                  {[{ icon: FaInstagram, color: "hover:bg-pink-600" }, { icon: FaFacebookF, color: "hover:bg-blue-600" }, { icon: FaTwitter, color: "hover:bg-sky-500" }, { icon: FaYoutube, color: "hover:bg-red-600" }].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={index}
                        href="#"
                        className={`flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-600 transition hover:text-white ${item.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default ContactUs;
