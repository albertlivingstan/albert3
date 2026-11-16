import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane, FaWhatsapp, FaFileDownload } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { askGemini } from '../services/geminiService';
import './Chatbot.css';

/* ─────────────────────────────────────────────
   Knowledge base – every intent + its keywords
───────────────────────────────────────────── */
const KB = [
  // ── Greetings ──
  {
    keys: ['hi', 'hello', 'hey', 'howdy', 'greetings', 'sup', 'what\'s up', 'whatsup', 'good morning', 'good evening', 'good afternoon'],
    reply: "Hey there! 👋 I'm Albert's portfolio assistant. Ask me anything about his skills, projects, certifications, education, or how to get in touch!"
  },
  // ── About / Who ──
  {
    keys: ['about', 'who is', 'who are', 'introduce', 'tell me about', 'yourself', 'bio', 'background', 'profile'],
    reply: "Albert Livingstan G is a passionate B.Tech CSE student specializing in AI, Web Development, and IoT. He loves building real-world solutions that blend cutting-edge technology with great user experience. 🚀 "
  },
  // ── Education ──
  {
    keys: ['education', 'college', 'university', 'degree', 'btech', 'b.tech', 'study', 'student', 'academic', 'course', 'gpa', 'cgpa', 'graduation', 'school'],
    reply: "Albert is pursuing a B.Tech in Computer Science & Engineering (CSE). He is dedicated to both academic excellence and hands-on project building throughout his studies. 🎓"
  },
  // ── Skills ──
  {
    keys: ['skill', 'skills', 'technology', 'tech', 'stack', 'know', 'expertise', 'proficiency', 'good at', 'technologies', 'tools', 'programming'],
    reply: "Albert's tech stack spans multiple domains:\n\n AI/ML: Python, PyTorch, TensorFlow, NLP\n Frontend: React, JavaScript, TypeScript, Tailwind CSS\n⚙️ Backend: Node.js, FastAPI, Flask, Django\n🗄️ Database: MongoDB, MySQL\n☕ Language: Java\n🔧 Automation: n8n\n\nHe's always learning new things!"
  },
  // ── Python ──
  {
    keys: ['python'],
    reply: "Python is one of Albert's strongest languages. He uses it for AI/ML (PyTorch, TensorFlow), backend development (FastAPI, Flask, Django), and automation scripts. 🐍"
  },
  // ── React ──
  {
    keys: ['react', 'reactjs', 'react.js'],
    reply: "React is Albert's go-to frontend framework! He has built several full-stack applications including StudyHub and FitTrack using React with Firebase and Tailwind CSS. ⚛️"
  },
  // ── AI / ML ──
  {
    keys: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'nlp', 'neural', 'pytorch', 'tensorflow', 'data science'],
    reply: "Albert is deeply passionate about AI & ML. He has hands-on experience with:\n\n• PyTorch & TensorFlow for deep learning\n• Natural Language Processing (NLP)\n• Machine Learning models in Python\n• AI integration in web apps (Gemini API)\n\nHe has certifications in AI, ML with Python, and more! 🤖"
  },
  // ── IoT ──
  {
    keys: ['iot', 'internet of things', 'hardware', 'robot', 'sensor', 'embedded', 'arduino', 'raspberry'],
    reply: "IoT is one of Albert's exciting interests! He built a Human Following Robot that uses sensors and autonomous navigation — combining hardware engineering with software logic. Check it out in the Projects section! 🤖⚙️"
  },
  // ── Projects ──
  {
    keys: ['project', 'projects', 'work', 'portfolio', 'built', 'build', 'created', 'developed', 'application', 'app'],
    reply: "Albert has built some amazing projects! 🛠️\n\n🏭 SafeFactory 3D – Industrial digital twin & safety Android app\n🗓️ SmartSchedule AI 3.0 – RPA & AI scheduling orchestration\n📚 StudyHub – AI-powered LMS with Gemini AI\n💪 FitTrack – Health & fitness tracking app\n🤖 Human Following Robot – IoT autonomous robot\n🎬 MVRbookme – Movie ticket + cab booking\n♟️ MINDKRAFT'26 – Chess tournament manager\n⚙️ ChaosOps – DevOps CI/CD automation\n🌞 SolarAQI – Air quality + solar energy insights\n\nClick any project card for a detailed view!"
  },
  // ── SafeFactory 3D ──
  {
    keys: ['safefactory', 'safe factory', 'digital twin', 'industrial', 'safety', 'android', 'factory'],
    reply: "SafeFactory 3D is Albert's interactive 3D digital twin and industrial safety Android app! Features include:\n\n• 48 IoT sensor nodes synchronized in real time (temp, smoke, VOC, acoustic, vibration)\n• Dynamic hazard detection (fires, chemical leaks)\n• Automated 3D escape route rerouting & evacuation modeling\n• Android on-screen controls & desktop interactive 3D navigation\n\n🔗 Live: https://safefactoryandroid.vercel.app"
  },
  // ── SmartSchedule AI ──
  {
    keys: ['smartschedule', 'schedule', 'smart schedule', 'uipath', 'rpa', 'orchestration'],
    reply: "SmartSchedule AI 3.0 is Albert's enterprise RPA & AI scheduling orchestration platform! Features include:\n\n• Deterministic constraint scheduling & optimal slot ranking\n• Predictive ML no-show risk classification\n• Automated cancellation recovery with zero dead capacity\n• UiPath Studio Web workflow automation and telemetry\n\n🔗 Live: https://smartschedule-frontend.vercel.app"
  },
  // ── StudyHub ──
  {
    keys: ['studyhub', 'study hub', 'lms', 'learning management', 'gemini'],
    reply: "StudyHub is Albert's flagship project — an AI-powered LMS built with React, Firebase, and Gemini AI. Features include:\n\n Real-time collaborative multimedia chat\n✅ Gamified progress tracking\n✅ Instant AI Tutor powered by Gemini API\n✅ Engineering-focused curriculum support\n\n🔗 Live: https://gcp-dusky.vercel.app"
  },
  // ── FitTrack ──
  {
    keys: ['fittrack', 'fitness', 'health', 'workout', 'tracker'],
    reply: "FitTrack is a health & fitness tracking platform built with the MERN stack. It includes reminders, full user authentication, and activity tracking. Great blend of backend and frontend! 💪"
  },
  // ── ChaosOps ──
  {
    keys: ['chaosops', 'devops', 'ci/cd', 'automation', 'infrastructure'],
    reply: "ChaosOps is Albert's DevOps automation project! It provides streamlined CI/CD processes and infrastructure tooling. 🔧 Live at https://chaos-ops.vercel.app"
  },
  // ── SolarAQI ──
  {
    keys: ['solar', 'aqi', 'air quality', 'environment'],
    reply: "SolarAQI combines real-time air quality monitoring with solar energy insights using interactive geospatial data. 🌞🌍 Live at https://aqi-jet.vercel.app"
  },
  // ── Certifications ──
  {
    keys: ['certificate', 'certification', 'certified', 'course', 'badge', 'credential'],
    reply: "Albert has earned 40+ certifications from top institutions! 🏆\n\n💼 Wipro – Java Full Stack (TalentNext, Oct 2026)\n🤖 IBM / CognitiveClass – Voice Assistant with OpenAI GPT-3 & Watson (Oct 2026)\n🏛️ NPTEL / IIT – Technical English (Elite, IIT Madras), Soft Computing (IIT Kharagpur), Privacy & Security in Social Media (IIIT Hyderabad)\n🔷 Microsoft – Azure Data Fundamentals & Azure Fundamentals\n🟠 AWS – Cloud Practitioner Essentials\n🔴 Google – Digital Marketing & E-commerce, Prompt Engineering\n🔶 Cisco – HTML, CSS, Networking, Cybersecurity Essentials\n\nVisit the Certificates page to view them all!"
  },
  // ── Wipro ──
  {
    keys: ['wipro', 'jfs', 'java full stack', 'talentnext'],
    reply: "Albert completed the prestigious Wipro TalentNext Digital Skills Readiness Program on Java Full Stack (July–Oct 2026), mastering enterprise Java, object-oriented software engineering, and modern full-stack web architectures! 💼✨"
  },
  // ── Voice Assistant / Watson / GPT-3 ──
  {
    keys: ['voice assistant', 'watson', 'gpt-3', 'gpt', 'openai voice'],
    reply: "Albert is certified by IBM Skills Network and CognitiveClass.ai in 'Create a Voice Assistant with OpenAI's GPT-3 and IBM Watson' (Oct 2026), building conversational voice bots powered by LLMs and speech synthesis! 🎙️🤖"
  },
  // ── NPTEL / IIT ──
  {
    keys: ['nptel', 'swayam', 'iit', 'soft computing'],
    reply: "Albert has earned multiple NPTEL / IIT certifications:\n\n1️⃣ Technical English for Engineers (Elite - IIT Madras)\n2️⃣ Introduction To Soft Computing (IIT Kharagpur)\n3️⃣ Privacy and Security in Online Social Media (IIIT Hyderabad)\n\nDemonstrating strong theoretical and research-backed foundations! 🏛️📚"
  },
  // ── Microsoft ──
  {
    keys: ['microsoft', 'azure', 'cloud'],
    reply: "Albert is certified in Microsoft Azure Data Fundamentals (DP-900) — covering core data concepts and Azure data services. "
  },
  // ── AWS ──
  {
    keys: ['aws', 'amazon web services'],
    reply: "Albert completed the AWS Cloud Practitioner Essentials course (March 2026), gaining knowledge of core AWS services, security, architecture, pricing, and support. "
  },
  // ── IBM ──
  {
    keys: ['ibm'],
    reply: "Albert has two IBM certifications:\n\n1️⃣ User Experience Design Fundamentals (Aug 2025)\n Enterprise Security in Practice (Aug 2025)\n\nSolid foundation in both design thinking and cybersecurity! 🔷"
  },
  // ── Google ──
  {
    keys: ['google', 'digital marketing', 'marketing'],
    reply: "Albert completed Google's Foundations of Digital Marketing & E-commerce certification (Feb 2026) — covering SEO, SEM, analytics, and e-commerce fundamentals. Download resume"
  },
  // ── Contact ──
  {
    keys: ['contact', 'reach', 'email', 'mail', 'message', 'get in touch', 'hire', 'hiring', 'available', 'connect'],
    reply: "Want to reach Albert? Here are the best ways:\n\n📧 Email: albertlivingstan73@gmail.com\n💼 LinkedIn: linkedin.com/in/albert-livingstan-g\n GitHub: github.com/albertlivingstan\n💬 WhatsApp: +91 6382357454\n\nOr just scroll down to the Contact form! 👇"
  },
  // ── LinkedIn ──
  {
    keys: ['linkedin'],
    reply: "Connect with Albert on LinkedIn! 💼\n🔗 https://www.linkedin.com/in/albert-livingstan-g\n\nHe shares updates on projects, certifications, and tech insights."
  },
  // ── GitHub ──
  {
    keys: ['github', 'git', 'repo', 'repository', 'code', 'source code', 'open source'],
    reply: "Check out Albert's GitHub profile for all his projects and code:\n https://github.com/albertlivingstan\n\nHe actively contributes and maintains several public repos!"
  },
  // ── LeetCode ──
  {
    keys: ['leetcode', 'dsa', 'data structure', 'algorithm', 'competitive', 'coding'],
    reply: "Albert has solved 150+ problems on LeetCode 💻 and 120+ on GeeksforGeeks. He also has a 3★ rating in C and 1★ in Python on HackerRank. Strong DSA foundation!"
  },
  // ── Resume ──
  {
    keys: ['resume', 'cv', 'curriculum vitae', 'download resume', 'download cv'],
    reply: "Sure! Downloading Albert's resume now... 📄",
    action: () => {
      const link = document.createElement('a');
      link.href = '/Albert_Livingstan_G-2.pdf';
      link.download = 'Albert_Livingstan_G-2.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
  // ── WhatsApp ──
  {
    keys: ['whatsapp', 'phone', 'call', 'number', 'mobile'],
    reply: "You can reach Albert on WhatsApp at +91 6382357454 📱",
    extra: { text: "Open WhatsApp Chat", isLink: true, url: "https://wa.me/916382357454" }
  },
  // ── Experience / internship ──
  {
    keys: ['experience', 'internship', 'intern', 'work experience', 'job', 'company'],
    reply: "Albert has worked on real-world projects that simulate professional experience, including:\n\n🌐 Full-stack web development (MERN, React+Firebase)\n🤖 AI/ML model development\n🔧 DevOps tooling with ChaosOps\n🏆 Hackathon participation (Google Hackathon, Smart India Hackathon)\n\nHe is actively seeking internship and full-time opportunities!"
  },
  // ── Hackathon ──
  {
    keys: ['hackathon', 'hack', 'competition', 'sih', 'smart india'],
    reply: "Albert has participated in prestigious hackathons! 🏆\n\n🔴 Google Hackathon (GK HACKS) – Oct 2025\n🇮🇳 Smart India Hackathon (SIH) – National level\n\nHe thrives under pressure and loves building innovative solutions fast!"
  },
  // ── Location ──
  {
    keys: ['location', 'where', 'city', 'india', 'state', 'based', 'from'],
    reply: "Albert is based in India 🇮🇳. He's open to remote opportunities worldwide and on-site roles within India!"
  },
  // ── Java ──
  {
    keys: ['java'],
    reply: "Albert has completed the Java Programming Fundamentals certification from Infosys (Oct 2024) and applies Java in object-oriented programming and algorithmic problem solving. ☕"
  },
  // ── Web dev ──
  {
    keys: ['web', 'website', 'frontend', 'backend', 'fullstack', 'full stack', 'mern', 'html', 'css'],
    reply: "Albert is a full-stack web developer! He builds end-to-end applications using:\n\n🎨 Frontend: React, TypeScript, Tailwind CSS\n⚙️ Backend: Node.js, FastAPI, Flask, Django\n🗄️ Database: MongoDB, MySQL\n☁️ Deployment: Vercel, Firebase\n\nHe has built 8+ production-ready projects!"
  },
  // ── Hobbies / interests ──
  {
    keys: ['hobby', 'hobbies', 'interest', 'passion', 'free time', 'fun', 'like', 'enjoy'],
    reply: "Besides coding, Albert is passionate about:\n\n♟️ Chess (even organized a chess tournament!)\n🤖 Building IoT gadgets\n📚 Reading tech research papers\n🌐 Exploring new AI models and tools\n\nHe's always curious and loves learning! 🚀"
  },
  // ── Goals / future ──
  {
    keys: ['goal', 'future', 'plan', 'aspiration', 'dream', 'ambition', 'career'],
    reply: "Albert's career goals include:\n\n🚀 Building impactful AI-powered products\n🌍 Working on large-scale distributed systems\n💡 Contributing to open-source projects\n🎓 Continuously growing as a full-stack + AI engineer\n\nHe's driven, focused, and always hungry to learn!"
  },
  // ── Linux ──
  {
    keys: ['linux', 'unix', 'operating system', 'os'],
    reply: "Albert completed the Introduction to Linux (LFS101) certification from The Linux Foundation (Feb 2026) and is comfortable working in Unix/Linux environments. 🐧"
  },
  // ── Deloitte ──
  {
    keys: ['deloitte', 'job simulation', 'forage', 'consulting', 'data analytics job'],
    reply: "Albert completed the **Deloitte Data Analytics Job Simulation** (July 2026) — a hands-on virtual experience program covering real-world data analytics tasks used by Deloitte consultants. 🟢\n\nThis included data interpretation, business problem analysis, and presenting insights — all core Deloitte consulting skills!"
  },
  // ── Thank you ──
  {
    keys: ['thank', 'thanks', 'thank you', 'thx', 'appreciate', 'helpful', 'great', 'awesome', 'nice'],
    reply: "You're welcome! 😊 Feel free to ask me anything else about Albert. I'm here to help!"
  },
  // ── Bye ──
  {
    keys: ['bye', 'goodbye', 'see you', 'cya', 'take care', 'later', 'exit'],
    reply: "Goodbye! 👋 It was great chatting. Feel free to come back anytime. Have a wonderful day! ✨"
  },
  // ── Prompt engineering ──
  {
    keys: ['prompt', 'prompt engineering', 'chatgpt', 'llm', 'language model', 'generative ai', 'genai'],
    reply: "Albert recently completed the 'Foundations of Prompt Engineering' certification (July 2026) and has hands-on experience integrating LLMs like Gemini AI into production applications! 🧠✨"
  },
  // ── Cybersecurity ──
  {
    keys: ['security', 'cyber', 'cybersecurity', 'network security', 'hacking', 'ethical'],
    reply: "Albert has certifications in:\n\n🔐 Enterprise Security in Practice (IBM)\n🛡️ Cybersecurity Essentials (Cisco – March 2026)\n\nHe understands security fundamentals for building safe applications!"
  },
];

/* ─────────────────────────────────────────────
   Match user input against knowledge base
───────────────────────────────────────────── */
const getBotResponse = (text) => {
  const lower = text.toLowerCase().trim();
  for (const item of KB) {
    if (item.keys.some(k => lower.includes(k))) {
      return item;
    }
  }
  return null; // fallback → WhatsApp
};

const formatMessageText = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIdx} style={{ color: '#bae6fd' }}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
};

/* ─────────────────────────────────────────────
   Chatbot Component
───────────────────────────────────────────── */
const Chatbot = ({ initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Albert's Portfolio Assistant 🤖\nAsk me about his skills, projects, certifications, education, or how to contact him!", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const saveToFirebase = async (msgText, isBotMsg) => {
    try {
      if (sessionId && db) {
        await addDoc(collection(db, "chatLogs"), {
          sessionId,
          text: msgText,
          isBot: isBotMsg,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMsg = { text, isBot: false };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    saveToFirebase(text, false);

    // Show typing indicator
    setIsTyping(true);

    const localMatch = getBotResponse(text);
    if (localMatch && localMatch.action) {
      localMatch.action();
    }

    try {
      const reply = await askGemini(text, newMessages.slice(-6));
      if (!reply) throw new Error('No reply generated by Gemini');

      setIsTyping(false);
      const botMsg = { text: reply, isBot: true };
      setMessages([...newMessages, botMsg]);
      saveToFirebase(reply, true);
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local KB:", err);
      setIsTyping(false);

      if (localMatch) {
        const botMsgs = [{ text: localMatch.reply, isBot: true }];
        if (localMatch.extra) botMsgs.push({ ...localMatch.extra, isBot: true });
        setMessages([...newMessages, ...botMsgs]);
        saveToFirebase(localMatch.reply, true);
      } else {
        const fallback = "I'm not sure about that specific topic 🤔 But Albert would love to answer! You can reach him directly:";
        setMessages([
          ...newMessages,
          { text: fallback, isBot: true },
          { text: "Chat with Albert on WhatsApp 💬", isBot: true, isLink: true, url: "https://wa.me/916382357454" }
        ]);
        saveToFirebase(fallback, true);
      }
    }
  };

  const quickReplies = ["About Me", "Skills", "Projects", "Certificates", "Contact", "Download Resume"];

  return (
    <div className="chatbot-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="chatbot-window"
          >
            {/* Header */}
            <div className="chatbot-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <FaRobot size={24} color="#38bdf8" />
                </motion.div>
                <div>
                  <h4 style={{ margin: 0 }}>Albert's Portfolio Assistant</h4>
                  <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>● Online · Gemini AI</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="close-btn"><FaTimes /></button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.isBot ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`message-wrapper ${msg.isBot ? 'bot' : 'user'}`}
                >
                  <div className={`message-bubble ${msg.isBot ? 'bot' : 'user'}`}>
                    {msg.isLink ? (
                      <a href={msg.url} target="_blank" rel="noreferrer" className="whatsapp-link">
                        <FaWhatsapp size={18} /> {msg.text}
                      </a>
                    ) : (
                      formatMessageText(msg.text)
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="message-wrapper bot"
                  >
                    <div className="message-bubble bot typing-indicator">
                      <span /><span /><span />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="quick-replies">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  className="quick-reply-btn"
                  onClick={() => handleSend(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="chatbot-input-area">
              <input
                type="text"
                placeholder="Ask me anything about Albert..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
              />
              <button onClick={() => handleSend(input)} className="send-btn">
                <FaPaperPlane />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="chatbot-fab"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <FaRobot size={30} />
      </motion.button>
    </div>
  );
};

export default Chatbot;
