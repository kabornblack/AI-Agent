// // src/components/landing/TestimonialsSection.jsx
// import React from "react";

// const TestimonialsSection = () => {
//   const testimonials = [
//     {
//       quote:
//         "AI Agent Builder reduced our customer support response time from hours to seconds. Our team can now focus on complex issues while the AI handles routine queries.",
//       author: "Sarah Chen",
//       role: "Head of Customer Experience",
//       company: "TechGrowth Inc.",
//     },
//     {
//       quote:
//         "We deployed 5 different AI agents across sales, HR, and support in just one week. The no-code interface made it accessible for our entire team.",
//       author: "Marcus Rodriguez",
//       role: "CTO",
//       company: "StartupXYZ",
//     },
//     {
//       quote:
//         "The analytics helped us understand customer needs better. We've seen a 40% reduction in support tickets and much higher customer satisfaction scores.",
//       author: "Emily Watson",
//       role: "Product Manager",
//       company: "SaaS Innovations",
//     },
//   ];

//   return (
//     <section className="relative py-20 bg-gradient-to-br from-blue-600 to-purple-700 overflow-hidden">
//       {/* ===== LEFT MARQUEE (same as HeroSection) ===== */}
//       <div className="hidden lg:block absolute left-12 top-0 h-full w-72 overflow-hidden">
//         <div className="marquee flex flex-col gap-6">
//           <div className="marquee-hero flex flex-col gap-6">
//             {[
//               "img-7.jpg",
//               "img-8.jpg",
//               "img-6.jpg",
//               "img-7-removebg.png",
//               "img-6-removebg.png",
//               "img-21-removebg.png",
//               "img-9.jpg",
//               "img-10.jpg",
//             ].map((img, i) => (
//               <img
//                 key={i}
//                 src={`/hero/${img}`}
//                 className="w-60 h-64 rounded-xl object-cover  object-center mix-blend-lg"
//                 alt=""
//               />
//             ))}
//           </div>

//           <div aria-hidden="true" className="marquee-hero flex flex-col gap-6">
//             {[
//               "img-11.jpg",
//               "img-12.jpg",
//               "img-13.jpg",
//               "img-7-removebg.png",
//               "img-6-removebg.png",
//               "img-21-removebg.png",
//               "img-14.jpg",
//               "img-21.jpg",
//               "auth-img.jpg",
//             ].map((img, i) => (
//               <img
//                 key={"dup-left-" + i}
//                 src={`/hero/${img}`}
//                 className="w-60 h-64 rounded-xl object-cover object-center mix-blend-lg"
//                 alt=""
//               />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ===== RIGHT MARQUEE (same as HeroSection) ===== */}
//       <div className="hidden lg:block absolute right-0 top-0 h-full w-72 overflow-hidden">
//         <div className="marquee-reverse flex flex-col gap-6">
//           <div className="marquee-hero flex flex-col gap-6">
//             {[
//               "img-6.jpg",
//               "img-7.jpg",
//               "img-8.jpg",
//               "img-9.jpg",
//               "img-10.jpg",
//               "img-7-removebg.png",
//               "img-6-removebg.png",
//               "img-21-removebg.png",
//             ].map((img, i) => (
//               <img
//                 key={i}
//                 src={`/hero/${img}`}
//                 className="w-60 h-64 rounded-xl object-cover object-center mix-blend-lg"
//                 alt=""
//               />
//             ))}
//           </div>

//           <div aria-hidden="true" className="marquee-hero flex flex-col gap-6">
//             {[
//               "img-11.jpg",
//               "img-12.jpg",
//               "img-13.jpg",
//               "img-14.jpg",
//               "img-21.jpg",
//               "img-7-removebg.png",
//               "img-6-removebg.png",
//               "img-21-removebg.png",
//               "auth-img.jpg",
//             ].map((img, i) => (
//               <img
//                 key={"dup-right-" + i}
//                 src={`/hero/${img}`}
//                 className="w-60 h-64 rounded-xl object-cover object-center mix-blend-lg"
//                 alt=""
//               />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ===== CENTER CONTENT ===== */}
//       {/* <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mr-[2px]"> */}
//       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-72 pr-72">
//         <div className="text-center mb-16">
//           <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
//             Loved by Teams Worldwide
//           </h2>
//           <p className="text-xl text-blue-100 max-w-2xl mx-auto">
//             See how companies are transforming their operations with AI Agent
//             Builder
//           </p>
//         </div>

//         {/* Testimonials Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           {testimonials.map((testimonial, index) => (
//             <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
//               <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
//               <blockquote className="text-gray-700 mb-6 italic">
//                 "{testimonial.quote}"
//               </blockquote>
//               <div className="flex items-center">
//                 <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
//                   {testimonial.author.charAt(0)}
//                 </div>
//                 <div className="ml-4">
//                   <div className="font-semibold text-gray-900">
//                     {testimonial.author}
//                   </div>
//                   <div className="text-gray-600 text-sm">
//                     {testimonial.role}, {testimonial.company}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center">
//           {[
//             { number: "10K+", label: "AI Agents Created" },
//             { number: "500+", label: "Companies" },
//             { number: "5M+", label: "Conversations" },
//             { number: "99%", label: "Customer Satisfaction" },
//           ].map((stat, index) => (
//             <div key={index} className="text-white">
//               <div className="text-3xl md:text-4xl font-bold mb-2">
//                 {stat.number}
//               </div>
//               <div className="text-blue-100 text-sm">{stat.label}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default TestimonialsSection;

// src/components/landing/TestimonialsSection.jsx
import React from "react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote:
        "AI Agent Builder reduced our customer support response time from hours to seconds. Our team can now focus on complex issues while the AI handles routine queries.",
      author: "Sarah Chen",
      role: "Head of Customer Experience",
      company: "TechGrowth Inc.",
    },
    {
      quote:
        "We deployed 5 different AI agents across sales, HR, and support in just one week. The no-code interface made it accessible for our entire team.",
      author: "Marcus Rodriguez",
      role: "CTO",
      company: "StartupXYZ",
    },
    {
      quote:
        "The analytics helped us understand customer needs better. We've seen a 40% reduction in support tickets and much higher customer satisfaction scores.",
      author: "Emily Watson",
      role: "Product Manager",
      company: "SaaS Innovations",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Loved by Teams Worldwide
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            See how companies are transforming their operations with AI Agent
            Builder
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <blockquote className="text-gray-700 mb-6 italic">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.author.charAt(0)}
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">
                    {testimonial.author}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center">
          {[
            { number: "10K+", label: "AI Agents Created" },
            { number: "500+", label: "Companies" },
            { number: "5M+", label: "Conversations" },
            { number: "99%", label: "Customer Satisfaction" },
          ].map((stat, index) => (
            <div key={index} className="text-white">
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {stat.number}
              </div>
              <div className="text-blue-100 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
