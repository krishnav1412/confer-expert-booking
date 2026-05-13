import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Expert from '../models/Expert.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import Promotion from '../models/Promotion.js';
import Payment from '../models/Payment.js';
import ExpertApplication from '../models/ExpertApplication.js';

// ---------- Helpers ----------
const generateDates = (count = 7) => {
  const dates = [];
  const today = new Date();
  let added = 0;
  let offset = 1;
  while (added < count) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().split('T')[0]);
      added += 1;
    }
    offset += 1;
  }
  return dates;
};

const TIME_POOL = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
];

const parseTime = (s) => {
  const [time, period] = s.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const buildSlots = () => {
  const dates = generateDates(7);
  return dates.map((date) => {
    const count = 4 + Math.floor(Math.random() * 3);
    const shuffled = [...TIME_POOL].sort(() => Math.random() - 0.5).slice(0, count);
    shuffled.sort((a, b) => parseTime(a) - parseTime(b));
    return { date, slots: shuffled };
  });
};

const buildWeeklyTemplate = () => {
  // Mon-Fri 10am, 2pm, 4pm by default
  return [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
    dayOfWeek: dow,
    enabled: dow >= 1 && dow <= 5,
    slots: dow >= 1 && dow <= 5 ? ['10:00 AM', '02:00 PM', '04:00 PM'] : [],
  }));
};

// ---------- Service templates ----------
const servicesByCategory = {
  'Career Mentor': [
    { name: 'Resume Review', description: 'Detailed feedback on your resume with line-by-line suggestions to highlight impact.', durationMinutes: 45 },
    { name: 'Mock Interview', description: 'A realistic interview simulation followed by structured feedback and a written report.', durationMinutes: 60 },
    { name: 'Career Strategy Session', description: 'Map out a 6–12 month career roadmap with concrete milestones and accountability.', durationMinutes: 90 },
  ],
  'Software Engineer': [
    { name: 'Code Review & Architecture', description: 'Walk through your codebase for design feedback, refactoring ideas, and trade-offs.', durationMinutes: 60 },
    { name: 'System Design Interview Prep', description: 'Tackle a real interview-style problem end to end with structured feedback.', durationMinutes: 75 },
    { name: 'Career Roadmap for Engineers', description: 'Plan your path to senior, staff, or principal with specific projects and signals.', durationMinutes: 60 },
  ],
  'UI/UX Expert': [
    { name: 'Portfolio Review', description: 'Honest review of your case studies with framing, visual, and storytelling feedback.', durationMinutes: 45 },
    { name: 'Design Critique', description: 'Bring any active product surface for fresh eyes and structured critique.', durationMinutes: 60 },
    { name: 'Design System Audit', description: 'Review your design system for tokens, consistency, and scalability.', durationMinutes: 90 },
  ],
  'Startup Advisor': [
    { name: 'Pitch Deck Review', description: 'Slide-by-slide feedback on narrative, financials, and investor-readiness.', durationMinutes: 60 },
    { name: 'Fundraising Strategy', description: 'Build a target investor list, sequence the raise, and prepare for diligence.', durationMinutes: 75 },
    { name: '0 to 1 Founder Coaching', description: 'Talk through GTM, hiring, and prioritisation for the first year of building.', durationMinutes: 90 },
  ],
  'AI Consultant': [
    { name: 'LLM Strategy Call', description: 'Decide build vs buy, evaluate models, and scope your first AI feature.', durationMinutes: 60 },
    { name: 'RAG / Eval Workshop', description: 'Hands-on session on retrieval pipelines and evaluation harnesses.', durationMinutes: 75 },
    { name: 'AI Product Audit', description: 'Review an existing AI feature for cost, latency, and quality trade-offs.', durationMinutes: 90 },
  ],
  'Fitness Coach': [
    { name: 'Movement Assessment', description: 'Identify mobility limitations and build a corrective routine for desk workers.', durationMinutes: 45 },
    { name: 'Custom Training Plan', description: 'Get a 4-week training plan built around your goals, schedule, and equipment.', durationMinutes: 60 },
    { name: 'Nutrition & Habits', description: 'Discuss sustainable nutrition habits and build accountability check-ins.', durationMinutes: 60 },
  ],
  'Product Manager': [
    { name: 'PM Interview Prep', description: 'Practice product sense, execution, and behavioural rounds with a senior PM.', durationMinutes: 60 },
    { name: 'Roadmap Review', description: 'Pressure-test your roadmap, prioritisation framework, and stakeholder alignment.', durationMinutes: 75 },
    { name: 'PRD Critique', description: 'Bring a real PRD or spec for line-by-line review and sharpening.', durationMinutes: 60 },
  ],
  'Data Scientist': [
    { name: 'Case Study Walkthrough', description: 'Solve a realistic DS case end to end with framing, modelling, and storytelling.', durationMinutes: 75 },
    { name: 'Project Review', description: 'Walk through your portfolio project for technical feedback and presentation tips.', durationMinutes: 60 },
    { name: 'ML Career Roadmap', description: 'Plan your transition into ML or DS with concrete projects and target roles.', durationMinutes: 60 },
  ],
  'Marketing Expert': [
    { name: 'Growth Audit', description: 'Audit acquisition, retention, and lifecycle metrics with concrete next experiments.', durationMinutes: 60 },
    { name: 'Brand Positioning', description: 'Sharpen your messaging hierarchy, audience, and differentiation.', durationMinutes: 75 },
    { name: 'Performance Marketing Review', description: 'Review paid funnels across Google, Meta, and creator channels.', durationMinutes: 60 },
  ],
};

const pricingTiers = {
  junior: [1499, 2499, 3999],
  mid: [1999, 3499, 5999],
  senior: [2999, 4999, 8999],
  elite: [4999, 7999, 12999],
};

const tierFor = (experience) => {
  if (experience >= 14) return 'elite';
  if (experience >= 9) return 'senior';
  if (experience >= 5) return 'mid';
  return 'junior';
};

const buildServicesFor = (category, experience) => {
  const templates = servicesByCategory[category] || servicesByCategory['Career Mentor'];
  const prices = pricingTiers[tierFor(experience)];
  return templates.map((t, i) => ({
    name: t.name,
    description: t.description,
    durationMinutes: t.durationMinutes,
    price: prices[i] ?? prices[prices.length - 1],
    active: true,
  }));
};

const buildDeliverables = (category) => {
  const m = {
    'Career Mentor': ['Personalised career roadmap document', 'Detailed written feedback on resume / interview', 'Curated reading list and resources', 'Follow-up notes within 24 hours'],
    'Software Engineer': ['Annotated review of your code or design', 'Reading list tailored to your gaps', 'Architecture diagram or sketch', 'Follow-up notes within 24 hours'],
    'UI/UX Expert': ['Frame-by-frame written critique', 'Reference inspiration board', 'Specific next-step actions', 'Follow-up notes within 24 hours'],
    'Startup Advisor': ['Annotated pitch deck or strategy doc', 'Targeted investor / partner intro list (where relevant)', 'Decision framework for your next moves', 'Follow-up notes within 48 hours'],
    'AI Consultant': ['Architecture sketch or build vs buy memo', 'Model and tooling recommendations', 'Cost / quality trade-off summary', 'Follow-up notes within 24 hours'],
    'Fitness Coach': ['Custom training programme PDF', 'Movement assessment summary', 'Nutrition and recovery checklist', 'Weekly check-in template'],
    'Product Manager': ['Detailed written critique of your work', 'Frameworks tailored to your situation', 'Recommended reading and exemplars', 'Follow-up notes within 24 hours'],
    'Data Scientist': ['Annotated case walkthrough', 'Reading list for skill gaps', 'Specific next projects to ship', 'Follow-up notes within 24 hours'],
    'Marketing Expert': ['Audit summary with priority experiments', 'Channel-specific recommendations', 'Benchmarks relevant to your stage', 'Follow-up notes within 48 hours'],
  };
  return m[category] || m['Career Mentor'];
};

const buildFAQs = () => [
  { question: 'How is the session conducted?', answer: 'Sessions are held over Google Meet or Zoom. You will receive a calendar invite with the call link as soon as your booking is confirmed.' },
  { question: 'What should I prepare in advance?', answer: 'After booking you will get a short prep doc tailored to the service you picked. It usually takes 10–15 minutes to fill out.' },
  { question: 'Can I reschedule or cancel?', answer: 'You can reschedule once for free up to 12 hours before the session. Cancellations made at least 24 hours in advance are eligible for a credit on your next booking.' },
  { question: 'Will I get notes after the session?', answer: 'Yes. You will receive written follow-up notes covering everything we discussed plus action items, usually within 24 hours.' },
];

// ---------- Expert seed data ----------
const expertSeed = [
  { name: 'Aarav Mehta', email: 'aarav.mehta@confer.test', category: 'Career Mentor', company: 'Razorpay', experience: 12, rating: 4.9, bio: 'Director of Talent at Razorpay. Previously led hiring partnerships at Flipkart and Paytm. I help mid-career professionals navigate transitions into leadership roles at India\'s top product companies.', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces', skills: ['Career Strategy', 'Interview Prep', 'Resume Review', 'Leadership'], badges: ['Top Mentor'], featured: true, stats: { sessionsCompleted: 612, repeatClientsPercent: 92, responseTimeHours: 2 } },
  { name: 'Priya Nair', email: 'priya.nair@confer.test', category: 'UI/UX Expert', company: 'CRED', experience: 9, rating: 4.8, bio: 'Senior Product Designer at CRED. Previously at Swiggy and Freshworks. I help designers craft portfolios that get callbacks and prepare for design interviews at top Indian startups.', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces', skills: ['Figma', 'Design Systems', 'Portfolio Review', 'User Research'], badges: ['Featured Expert'], featured: true, stats: { sessionsCompleted: 428, repeatClientsPercent: 88, responseTimeHours: 3 } },
  { name: 'Rohan Kapoor', email: 'rohan.kapoor@confer.test', category: 'Startup Advisor', company: 'Sequoia India alum', experience: 15, rating: 4.9, bio: 'Two-time founder with one acquisition. Now an angel investor and operator-advisor. Previously a VP at a YC-backed B2B SaaS company. I help early-stage founders with fundraising, GTM, and the messy 0-to-1 phase.', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces', skills: ['Fundraising', 'Pitch Decks', 'GTM Strategy', 'Founder Coaching'], badges: ['Top Mentor', 'Featured Expert'], featured: true, stats: { sessionsCompleted: 540, repeatClientsPercent: 94, responseTimeHours: 4 } },
  { name: 'Ananya Sen', email: 'ananya.sen@confer.test', category: 'AI Consultant', company: 'Sarvam AI', experience: 8, rating: 4.7, bio: 'Applied ML engineer turned consultant. Currently advising teams on shipping LLM features that work in production, not just in demos. Previously at Microsoft Research India.', profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces', skills: ['LLMs', 'RAG', 'Evaluation', 'Production ML'], stats: { sessionsCompleted: 215, repeatClientsPercent: 81, responseTimeHours: 5 } },
  { name: 'Arjun Malhotra', email: 'arjun.malhotra@confer.test', category: 'Software Engineer', company: 'Atlassian', experience: 11, rating: 4.8, bio: 'Staff engineer at Atlassian. Previously at Microsoft. Specialising in distributed systems and senior-level interview coaching for FAANG and top Indian product companies.', profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces', skills: ['System Design', 'DSA', 'Interview Prep', 'Mentoring'], badges: ['Top Mentor'], featured: true, stats: { sessionsCompleted: 487, repeatClientsPercent: 90, responseTimeHours: 3 } },
  { name: 'Ishita Verma', email: 'ishita.verma@confer.test', category: 'Fitness Coach', company: 'Independent', experience: 7, rating: 4.9, bio: 'NSCA-certified strength coach working with founders and tech professionals across Bangalore. I build sustainable training plans for busy schedules — no gimmicks, just consistent progress.', profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces', skills: ['Strength Training', 'Programming', 'Nutrition', 'Habit Coaching'], stats: { sessionsCompleted: 320, repeatClientsPercent: 85, responseTimeHours: 6 } },
  { name: 'Vikram Iyer', email: 'vikram.iyer@confer.test', category: 'Software Engineer', company: 'Zomato', experience: 10, rating: 4.6, bio: 'Backend engineer at Zomato with deep experience in Go and Kubernetes. Previously at Hotstar. Available for code reviews, architecture discussions, and SRE topics.', profileImage: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=faces', skills: ['Go', 'Kubernetes', 'Microservices', 'Observability'], stats: { sessionsCompleted: 168, repeatClientsPercent: 78, responseTimeHours: 5 } },
  { name: 'Maya Krishnan', email: 'maya.krishnan@confer.test', category: 'UI/UX Expert', company: 'Meesho', experience: 6, rating: 4.7, bio: 'Product designer at Meesho. Previously freelance, working with seed-stage startups across India and SEA. Strong opinions on motion, micro-interactions, and visual hierarchy.', profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces', skills: ['Motion Design', 'Branding', 'Webflow', 'Prototyping'], stats: { sessionsCompleted: 142, repeatClientsPercent: 80, responseTimeHours: 4 } },
  { name: 'Karan Shetty', email: 'karan.shetty@confer.test', category: 'Career Mentor', company: 'Flipkart', experience: 14, rating: 4.8, bio: 'Senior Director at Flipkart. Previously a VP at a top consulting firm. I help senior managers transition to director and VP roles. My focus is on executive presence and narrative.', profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces', skills: ['Executive Coaching', 'Leadership', 'Negotiation', 'Career Pivots'], badges: ['Featured Expert'], featured: true, stats: { sessionsCompleted: 392, repeatClientsPercent: 89, responseTimeHours: 4 } },
  { name: 'Anika Reddy', email: 'anika.reddy@confer.test', category: 'AI Consultant', company: 'Indian Institute of Science', experience: 6, rating: 4.7, bio: 'Research engineer focused on evaluation and safety of generative models. Happy to discuss applied research, PhD-to-industry transitions, and getting started in ML.', profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=faces', skills: ['Evaluation', 'Fine-tuning', 'Research', 'PhD Transitions'], stats: { sessionsCompleted: 96, repeatClientsPercent: 75, responseTimeHours: 8 } },
  { name: 'Devansh Agarwal', email: 'devansh.agarwal@confer.test', category: 'Startup Advisor', company: 'Independent', experience: 13, rating: 4.6, bio: 'Operator-turned-angel. Built a B2B SaaS to ₹40 crore ARR before exiting. I advise on pricing, sales motion, and the first 10 enterprise customers.', profileImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=faces', skills: ['B2B Sales', 'Pricing', 'Hiring', 'Board Management'], stats: { sessionsCompleted: 234, repeatClientsPercent: 87, responseTimeHours: 4 } },
  { name: 'Nidhi Sharma', email: 'nidhi.sharma@confer.test', category: 'Fitness Coach', company: 'Independent', experience: 5, rating: 4.8, bio: 'Yoga and mobility specialist working with desk workers across NCR. Sessions focus on long-term joint health: assessment, programming, and accountability.', profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces', skills: ['Yoga', 'Mobility', 'Posture', 'Recovery'], stats: { sessionsCompleted: 184, repeatClientsPercent: 82, responseTimeHours: 6 } },
  { name: 'Siddharth Rao', email: 'siddharth.rao@confer.test', category: 'Software Engineer', company: 'Swiggy', experience: 16, rating: 4.9, bio: 'Engineering leader at Swiggy with 16 years across infra and platform teams. I coach engineers preparing for staff and principal-level interviews at top product companies.', profileImage: 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=400&h=400&fit=crop&crop=faces', skills: ['Staff Interviews', 'Tech Leadership', 'Hiring', 'Team Building'], badges: ['Top Mentor'], featured: true, stats: { sessionsCompleted: 720, repeatClientsPercent: 95, responseTimeHours: 2 } },
  { name: 'Tanvi Bhatt', email: 'tanvi.bhatt@confer.test', category: 'Product Manager', company: 'PhonePe', experience: 8, rating: 4.7, bio: 'Senior PM at PhonePe. Previously at Paytm. I help aspiring PMs prepare for interviews and current PMs sharpen their roadmap and prioritisation skills.', profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=faces', skills: ['PM Interviews', 'Roadmaps', 'Prioritisation', 'Stakeholder Management'], stats: { sessionsCompleted: 256, repeatClientsPercent: 86, responseTimeHours: 4 } },
  { name: 'Yashvi Gupta', email: 'yashvi.gupta@confer.test', category: 'Marketing Expert', company: 'CRED', experience: 11, rating: 4.8, bio: 'Growth lead at CRED. Previously led growth at a unicorn marketplace. I work with founders and growth teams on positioning, paid funnels, and lifecycle marketing.', profileImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=faces', skills: ['Growth Strategy', 'Performance Marketing', 'Brand Positioning', 'Lifecycle'], badges: ['Featured Expert'], featured: true, stats: { sessionsCompleted: 312, repeatClientsPercent: 88, responseTimeHours: 3 } },
];

// ---------- Reviews pool ----------
const reviewPool = [
  { reviewerName: 'Arjun Rao', reviewerRole: 'Product Analyst', reviewerCompany: 'Swiggy', rating: 5, text: 'Genuinely the most useful hour I have spent on my career in years. Walked out with a clear plan, a sharper resume, and the confidence to actually go for the roles I had been holding back on.' },
  { reviewerName: 'Sneha Kulkarni', reviewerRole: 'Software Engineer', reviewerCompany: 'Razorpay', rating: 5, text: 'Direct, structured, and zero fluff. The follow-up notes were detailed enough that I am still referring back to them weeks later.' },
  { reviewerName: 'Pranav Joshi', reviewerRole: 'Founder', reviewerCompany: 'Stealth', rating: 4, text: 'Great session. I came in scattered and left with a much sharper sense of what to prioritise next quarter. Would book again.' },
  { reviewerName: 'Riya Khanna', reviewerRole: 'Designer', reviewerCompany: 'Zomato', rating: 5, text: 'Critique was tough but exactly what I needed. My portfolio is meaningfully better after a single session and I have already started getting better callbacks.' },
  { reviewerName: 'Mohit Singh', reviewerRole: 'PM', reviewerCompany: 'Flipkart', rating: 5, text: 'Cracked two interviews within a month after the mock session. The framework I learned for product sense rounds was a game-changer.' },
  { reviewerName: 'Aditi Pillai', reviewerRole: 'Engineer', reviewerCompany: 'CRED', rating: 4, text: 'Very thoughtful feedback on my system design answers. The critique on how I was framing trade-offs was the missing piece.' },
  { reviewerName: 'Kabir Mehta', reviewerRole: 'Founder', reviewerCompany: 'Y Combinator W24', rating: 5, text: 'Helped me reshape our pitch narrative for a fundraise. We closed our pre-seed within six weeks of the session.' },
  { reviewerName: 'Naina Kapoor', reviewerRole: 'Marketing Manager', reviewerCompany: 'Meesho', rating: 5, text: 'I was stuck on positioning for months and we cracked it in 60 minutes. The clarity I left with was worth far more than the price.' },
  { reviewerName: 'Rahul Desai', reviewerRole: 'ML Engineer', reviewerCompany: 'PhonePe', rating: 4, text: 'Genuinely good technical depth. The conversation about evaluation harnesses for our LLM features changed how we are thinking about it.' },
];

const buildReviewsFor = (expertId) => {
  const shuffled = [...reviewPool].sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map((r) => ({ ...r, expertId, verified: false }));
};

// ---------- Run ----------
const seed = async () => {
  try {
    await connectDB();
    console.log('[seed] Clearing collections...');
    await Promise.all([
      User.deleteMany({}),
      Expert.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Conversation.deleteMany({}),
      Notification.deleteMany({}),
      Promotion.deleteMany({}),
      Payment.deleteMany({}),
      ExpertApplication.deleteMany({}),
    ]);

    // Demo customer
    const demoUser = await User.create({
      name: 'Krishnav Agarwal',
      email: 'demo@confer.test',
      password: 'Demo12345',
      timezone: 'Asia/Kolkata',
    });

    // Admin
    const admin = await User.create({
      name: 'Confer Admin',
      email: 'admin@confer.test',
      password: 'Admin12345',
      role: 'admin',
    });

    // Experts: create user + expert profile, link them
    let expertCount = 0;
    let reviewCount = 0;
    for (const e of expertSeed) {
      // Create the user account
      const expertUser = new User({
        name: e.name,
        email: e.email,
        password: 'Expert12345',
        role: 'expert',
        isExpertApproved: true,
        avatar: e.profileImage,
        bio: e.bio.slice(0, 480),
      });
      await expertUser.save();

      const services = buildServicesFor(e.category, e.experience);
      const cheapest = Math.min(...services.map((s) => s.price));

      const expert = await Expert.create({
        userId: expertUser._id,
        name: e.name,
        category: e.category,
        company: e.company,
        experience: e.experience,
        rating: e.rating,
        bio: e.bio,
        profileImage: e.profileImage,
        skills: e.skills,
        badges: e.badges || [],
        featured: !!e.featured,
        linkedinUrl: e.linkedinUrl || `https://linkedin.com/in/${e.email.split('@')[0]}`,
        stats: e.stats,
        price: cheapest,
        services,
        deliverables: buildDeliverables(e.category),
        faqs: buildFAQs(),
        availableSlots: buildSlots(),
        weeklyTemplate: buildWeeklyTemplate(),
      });

      expertUser.expertProfile = expert._id;
      await expertUser.save();
      expertCount += 1;

      const reviews = buildReviewsFor(expert._id);
      await Review.insertMany(reviews);
      reviewCount += reviews.length;
    }

    console.log(`[seed] Inserted ${expertCount} experts (with linked user accounts).`);
    console.log(`[seed] Inserted ${reviewCount} reviews.`);
    console.log('');
    console.log('---- Demo accounts (password for all) ----');
    console.log('Demo customer : demo@confer.test          / Demo12345');
    console.log('Admin         : admin@confer.test         / Admin12345');
    console.log('Any expert    : <firstname.lastname>@confer.test / Expert12345');
    console.log('              e.g. priya.nair@confer.test / Expert12345');
    console.log('-------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[seed] Error:', err);
    process.exit(1);
  }
};

seed();
