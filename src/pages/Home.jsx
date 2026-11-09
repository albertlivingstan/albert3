import { FaGithub as Github, FaLinkedin as Linkedin } from 'react-icons/fa';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ArrowDown, ArrowRight, Download, Code2, Layers, Cpu, Check, Copy, Mail, MapPin, MessageCircle, Play, X } from 'lucide-react';
import { projectsData, certificates } from '../data';
import { Nav, Footer, Reveal, Dialog, resume } from '../components/PortfolioUI';
import { Spotlight } from '../components/ui/Spotlight';
import ProjectModal from '../components/ProjectModal';
const Chatbot = lazy(() => import('../components/Chatbot'));
const categories = ['All work', 'Web applications', 'AI & automation', 'IoT'];
const categoryFor = p => ['robot', 'safefactory'].includes(p.id) ? 'IoT' : ['ChaosOps', 'studyhub', 'SolarAQI', 'smartschedule'].includes(p.id) ? 'AI & automation' : 'Web applications';
const skills = [
  { icon: Code2, title: 'Interface & experience', subtitle: 'Thoughtful interfaces, from layout to interaction.', stack: ['React', 'JavaScript', 'TypeScript', 'HTML & CSS', 'Tailwind CSS'] },
  { icon: Layers, title: 'Systems & backend', subtitle: 'The services and data behind the experience.', stack: ['Node.js', 'Python', 'Java', 'FastAPI', 'Flask', 'Django', 'MongoDB', 'MySQL'] },
  { icon: Cpu, title: 'Intelligence & automation', subtitle: 'Exploring smarter ways to solve everyday problems.', stack: ['PyTorch', 'TensorFlow', 'NLP', 'Gemini API', 'n8n', 'IoT'] },
];
export default function Home() {
  const [filter, setFilter] = useState('All work');
  const [project, setProject] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [chat, setChat] = useState(false);
  const [intro, setIntro] = useState(false);
  const [review, setReview] = useState(false);
  const [note, setNote] = useState('');
  const location = useLocation();
  useEffect(() => {
    const id = location.hash.slice(1) || location.state?.scrollTo;
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, [location]);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 2500); return () => clearTimeout(timer); }, [copied]);
  useEffect(() => { const handler = () => setIntro(true); window.addEventListener('openIntroVideo', handler); return () => window.removeEventListener('openIntroVideo', handler); }, []);

  async function copyEmail() {
    try { await navigator.clipboard.writeText('albertlivingstan73@gmail.com'); setCopied(true); setCopyStatus('Email copied.'); }
    catch { setCopyStatus('Copy unavailable. Email: albertlivingstan73@gmail.com'); }
  }
  async function sendMessage(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const rawData = Object.fromEntries(new FormData(form));
    const name = rawData.name?.trim() || '';
    const email = rawData.email?.trim().toLowerCase() || '';
    const message = rawData.message?.trim() || '';

    // Client-side validations
    if (name.length < 2) {
      setFormStatus({ type: 'error', message: 'Please enter your name (at least 2 characters).' });
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setFormStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (message.length < 10) {
      setFormStatus({ type: 'error', message: 'Please enter a message with at least 10 characters.' });
      return;
    }

    // Check client-side block status
    const localBlockedUntil = Number(localStorage.getItem(`blocked_contact_${email}`) || 0);
    if (localBlockedUntil && Date.now() < localBlockedUntil) {
      const remainingMinutes = Math.ceil((localBlockedUntil - Date.now()) / (1000 * 60));
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} minute(s)`;
      setFormStatus({ type: 'error', message: `Please don't spam! This email is blocked for 12 hours. Please try again in ${timeStr}.` });
      return;
    }

    setFormStatus({ type: 'sending', message: 'Sending your message…' });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
        signal: AbortSignal.timeout(15000)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          localStorage.setItem(`blocked_contact_${email}`, String(Date.now() + 12 * 60 * 60 * 1000));
        }
        setFormStatus({
          type: 'error',
          message: result.error || 'Unable to deliver your message. Please try again later.'
        });
        return;
      }

      setFormStatus({ type: 'success', message: 'Your message was submitted. Thank you for reaching out!' });
      form.reset();
      Promise.all([import('../firebase'), import('firebase/firestore')])
        .then(([{ db }, { addDoc, collection, serverTimestamp }]) => db ? addDoc(collection(db, 'contacts'), { name, email, message, createdAt: serverTimestamp() }) : null)
        .catch(() => {});
    } catch {
      setFormStatus({ type: 'error', message: 'Delivery could not be confirmed. Please email me directly or try again.' });
    }
  }
  const filtered = projectsData.filter(p => filter === 'All work' || categoryFor(p) === filter);
  return <><Nav /><main id="main"><section id="home" className="hero section"><Spotlight fill="#bce5c3" /><div className="hero-grid"><div className="hero-copy"><Reveal><div className="availability"><i /> Open to developer opportunities</div><p className="hero-intro">Hello, I’m Albert Livingstan G.</p><h1>Thoughtful code.<br />Meaningful<br /><span>experiences.</span></h1><p className="hero-description">A computer science student building at the intersection of web development, AI, and the real world.</p><div className="button-row"><a className="button primary" href="#projects">Explore my work <ArrowDown size={17} /></a><a className="button" href={resume} download><Download size={17} /> Download résumé</a></div><div className="hero-socials"><a href="https://github.com/albertlivingstan" target="_blank" rel="noreferrer"><Github size={17} /> GitHub <ArrowUpRight size={13} /></a><a href="https://www.linkedin.com/in/albert-livingstan-g" target="_blank" rel="noreferrer"><Linkedin size={17} /> LinkedIn <ArrowUpRight size={13} /></a><span><MapPin size={15} /> Tamil Nadu, India</span></div></Reveal></div><Reveal className="hero-visual" delay={.15}><div className="portrait-frame"><img src="/portrait.webp" width="800" height="800" fetchPriority="high" alt="Albert Livingstan G wearing a navy blazer" /><div className="portrait-shade" /><div className="portrait-caption"><span>ALBERT LIVINGSTAN G</span><p>Developer. Explorer.<br />Always a student.</p></div><button className="intro-button" aria-label="Watch introduction video" onClick={() => setIntro(true)}><Play size={17} fill="currentColor" /></button></div><div className="floating-note"><span className="note-icon"><Code2 size={21} /></span><div>From curiosity to code.<small>Web · AI · IoT</small></div><span className="note-star">✳</span></div></Reveal></div><div className="hero-bottom"><span>SELECTED WORK & EXPLORATIONS</span><a href="#projects">Scroll to discover <ArrowDown size={14} /></a><span>PORTFOLIO / 2026</span></div></section>
  <section id="projects" className="section projects-section"><Reveal className="section-heading"><div><p className="eyebrow">01 / Selected work</p><h2>Ideas made <em>real.</em></h2></div><p>Hands-on projects across web, automation, and connected systems. Explore the details, demos, and code.</p></Reveal><div className="filter-row" role="group" aria-label="Filter projects">{categories.map(c => <button key={c} aria-pressed={filter === c} className={filter === c ? 'selected' : ''} onClick={() => setFilter(c)}>{c}{c === 'All work' && <span>{projectsData.length.toString().padStart(2,'0')}</span>}</button>)}</div><div className="project-grid">{filtered.map((p, i) => <Reveal key={p.id} className={`project-card ${i === 0 && filter === 'All work' ? 'featured-project' : ''}`}><button className={`project-image project-${p.id}`} onClick={() => setProject(p)} aria-label={`Explore ${p.title}`}><img src={`/${p.mainImg.replace(/\.[^.]+$/, '.webp')}`} alt={`${p.title} interface`} loading="lazy" decoding="async" /><span className="image-open"><ArrowUpRight size={20} /></span><span className="project-number">{String(projectsData.indexOf(p)+1).padStart(2,'0')} / {categoryFor(p)}</span></button><div className="project-text"><div className="tags">{p.tags.map(t => <span key={t}>{t}</span>)}</div><h3><button onClick={() => setProject(p)}>{p.title} <ArrowUpRight size={21} /></button></h3><p>{p.desc}</p><div className="project-links"><button onClick={() => setProject(p)}>Explore project <ArrowRight size={15} /></button><a href={p.github} target="_blank" rel="noreferrer" aria-label={`${p.title} source code`}><Github size={17} /></a>{p.liveDemo && <a href={p.liveDemo} target="_blank" rel="noreferrer">Live demo <ArrowUpRight size={14} /></a>}</div></div></Reveal>)}</div></section>
  <section id="about" className="about-section"><div className="section about-grid"><Reveal><p className="eyebrow">02 / A little about me</p><h2>Curiosity is<br />my starting <em>point.</em></h2><a href={resume} download className="text-link">Get to know me on paper <ArrowUpRight size={18} /></a></Reveal><Reveal className="about-copy"><p className="large-copy">I’m Albert, a Computer Science and Engineering student who enjoys turning practical problems into useful digital experiences.</p><p>My work brings together frontend development, backend systems, and a growing interest in AI and IoT. I learn by building — from an AI-powered learning portal to a human-following robot.</p><p>I’m looking for a team where I can contribute, keep learning, and grow as a developer.</p><div className="about-facts"><div><span>{projectsData.length.toString().padStart(2,'0')}</span><p>Projects to explore</p></div><div><span>{certificates.length}</span><p>Learning credentials</p></div><div><span>03</span><p>Areas of curiosity</p></div></div></Reveal></div></section>
  <section id="skills" className="section"><Reveal className="section-heading"><div><p className="eyebrow">03 / My toolkit</p><h2>Built with <em>purpose.</em></h2></div><p>A practical toolkit for connecting good interfaces with useful functionality.</p></Reveal><div className="skills-grid">{skills.map(({ icon: Icon, title, subtitle, stack },i) => <Reveal className="skill-block" delay={i*.07} key={title}><Icon className="skill-icon" size={29} strokeWidth={1.4} /><span className="skill-index">0{i+1}</span><h3>{title}</h3><p>{subtitle}</p><div className="skill-tags">{stack.map(s => <span key={s}>{s}</span>)}</div></Reveal>)}</div><div className="coding-links"><span>Practising the fundamentals</span>{[['LeetCode','https://leetcode.com/u/Albert_Livingstan/'],['HackerRank','https://www.hackerrank.com/profile/albertlivingstan'],['GeeksforGeeks','https://www.geeksforgeeks.org/profile/albertliv4u7m/']].map(([label,url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={15}/></a>)}</div></section>
  <section id="certificates" className="section credentials-section"><Reveal className="section-heading"><div><p className="eyebrow">04 / Always learning</p><h2>Learning that<br />moves me <em>forward.</em></h2></div><Link className="text-link" to="/certificates">Explore all {certificates.length} credentials <ArrowUpRight size={18} /></Link></Reveal><div className="credential-list">{[certificates[0],certificates[1],certificates[8],certificates[6]].map((c,i) => <Link key={c.title} to="/certificates" state={{ search: c.title }}><span className="credential-index">0{i+1}</span><div><h3>{c.title}</h3><p>{c.date}</p></div><ArrowUpRight size={22}/></Link>)}</div></section>
  <section id="contact" className="section contact-section"><Reveal className="contact-copy"><p className="eyebrow">05 / Start a conversation</p><h2>Good things start<br />with a <em>hello.</em></h2><p>Have an opportunity, a project idea, or just something interesting to share? I’d love to hear from you.</p><div className="email-link"><a href="mailto:albertlivingstan73@gmail.com">albertlivingstan73@gmail.com</a><button className="icon-button" onClick={copyEmail} aria-label="Copy email address">{copied ? <Check size={17} /> : <Copy size={17} />}</button></div><span className="sr-only" role="status">{copyStatus}</span><div className="contact-extra"><a href="https://wa.me/916382357454" target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={15}/></a><button onClick={() => setReview(true)}>Leave a recommendation <ArrowUpRight size={15}/></button></div></Reveal><Reveal><form className="contact-form" onSubmit={sendMessage}><label>Your name<input name="name" required autoComplete="name" placeholder="How should I call you?" maxLength={100} /></label><label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@company.com" maxLength={254} /></label><label>What’s on your mind?<textarea name="message" required rows={4} placeholder="Tell me a little about your opportunity or idea…" maxLength={5000} /></label><button className="button primary" disabled={formStatus.type === 'sending'} type="submit">{formStatus.type === 'sending' ? 'Sending…' : 'Send a message'}<ArrowUpRight size={17}/></button><p className={`form-status ${formStatus.type}`} role="status">{formStatus.message || 'Prefer email? The address on the left works too.'}</p></form></Reveal></section></main><Footer />
  {!chat && <button className="assistant-launch" onClick={() => setChat(true)} aria-label="Open portfolio assistant"><MessageCircle size={19}/><span>Ask about Albert</span></button>}{chat && <><Suspense fallback={<span className="assistant-launch">Loading assistant…</span>}><Chatbot initiallyOpen /></Suspense><button className="assistant-dismiss" onClick={() => setChat(false)} aria-label="Hide portfolio assistant"><X size={15}/></button></>}
  {project && <ProjectModal key={project.id} project={project} onClose={() => setProject(null)} />}{intro && <Dialog title="Meet Albert" onClose={() => setIntro(false)}><p className="eyebrow">A quick introduction</p><h2>Meet Albert.</h2><iframe className="video" src="https://player.vimeo.com/video/1214843180" title="Albert Livingstan introduction" allow="fullscreen; picture-in-picture" allowFullScreen /></Dialog>}{review && <Dialog title="Leave a recommendation" onClose={() => {setReview(false);setNote('');}}><h2>A few kind words.</h2><p>Share a recommendation directly with Albert by email.</p><form className="contact-form" onSubmit={e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); window.location.href = `mailto:albertlivingstan73@gmail.com?subject=${encodeURIComponent(`Recommendation from ${d.name}`)}&body=${encodeURIComponent(d.message)}`; setNote('Your email app will open with your recommendation. Send it there to finish.'); }}><label>Your name<input name="name" required maxLength={100}/></label><label>Recommendation<textarea name="message" required rows={5} maxLength={3000}/></label><button className="button primary">Continue in email <Mail size={16}/></button><p role="status">{note}</p></form></Dialog>}</>;
}
