import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { checkMessage } from '../lib/emergencyIntercept';
import styles from '../styles/Chat.module.css';

const SUGGESTIONS = [
  { emoji: '💗', text: 'I woke up with my heart racing at 3am. Should I be worried?' },
  { emoji: '💊', text: 'How often can I take ibuprofen safely?' },
  { emoji: '🧪', text: 'My TSH came back at 6.2 — what does that mean?' },
];

export default function Home() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [isFirst, setIsFirst]     = useState(true);
  const history                   = useRef([]);
  const messagesEnd               = useRef(null);
  const textareaRef               = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: msg }]);

    // Emergency intercept
    const intercept = checkMessage(msg);
    if (intercept) {
      setMessages(prev => [...prev, { type: 'emergency', data: intercept.response }]);
      setLoading(false);
      return;
    }

    // Add typing indicator
    setMessages(prev => [...prev, { type: 'typing' }]);

    // Build history
    const apiMessages = [
      ...history.current,
      { role: 'user', content: msg },
    ];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      // Remove typing, add reply
      setMessages(prev => {
        const without = prev.filter(m => m.type !== 'typing');
        if (!res.ok || !data.reply) {
          return [...without, { type: 'ai', text: "I'm having trouble connecting right now. Please try again in a moment.", disclaimer: false }];
        }
        return [...without, { type: 'ai', text: data.reply, disclaimer: isFirst }];
      });

      if (res.ok && data.reply) {
        history.current = [
          ...history.current,
          { role: 'user', content: msg },
          { role: 'assistant', content: data.reply },
        ].slice(-20);

        if (isFirst) setIsFirst(false);
      }

    } catch (err) {
      setMessages(prev => {
        const without = prev.filter(m => m.type !== 'typing');
        return [...without, { type: 'ai', text: "I'm having trouble connecting. Please check your connection and try again.", disclaimer: false }];
      });
    }

    setLoading(false);
  }

  function prefill(text) {
    setInput(text);
    textareaRef.current?.focus();
  }

  const showWelcome = messages.length === 0;

  return (
    <>
      <Head>
        <title>Iaso — Health Information Assistant</title>
        <meta name="description" content="Ask health questions, understand symptoms, medications, and medical results. Available 24/7." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.layout}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Iaso" style={{width:36,height:36,borderRadius:12}} />
          </div>
          <div className={styles.headerText}>
            <h1>Iaso</h1>
            <p>Health information assistant</p>
          </div>
          <div className={styles.statusDot} title="Online" />
        </header>

        {/* Messages */}
        <main className={styles.messages}>

          {showWelcome && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}><HeartIcon size={26} color="#7A9E87" /></div>
              <h2>Hi, I&apos;m Iaso</h2>
              <p>Ask me anything about symptoms, medications, or medical results. I&apos;m here to help you understand — day or night.</p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className={styles.suggestion} onClick={() => prefill(s.text)}>
                    <span>{s.emoji}</span> {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.type === 'user') return (
              <div key={i} className={`${styles.msgRow} ${styles.user}`}>
                <div className={`${styles.avatar} ${styles.avatarUser}`}>You</div>
                <div className={`${styles.bubble} ${styles.bubbleUser}`}>{msg.text}</div>
              </div>
            );

            if (msg.type === 'typing') return (
              <div key={i} className={styles.msgRow}>
                <div className={`${styles.avatar} ${styles.avatarAi}`}>I</div>
                <div className={`${styles.bubble} ${styles.bubbleAi}`}>
                  <div className={styles.typing}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            );

            if (msg.type === 'ai') return (
              <div key={i} className={styles.msgRow}>
                <div className={`${styles.avatar} ${styles.avatarAi}`}>I</div>
                <div>
                  <div className={`${styles.bubble} ${styles.bubbleAi}`}>
                    {msg.text.split('\n\n').map((p, j) => (
                      <p key={j} style={{ marginTop: j > 0 ? 8 : 0 }}>
                        {p.split('\n').map((line, k) => (
                          <span key={k}>{line}{k < p.split('\n').length - 1 && <br />}</span>
                        ))}
                      </p>
                    ))}
                  </div>
                  {msg.disclaimer && (
                    <p className={styles.disclaimer}>
                      Not medical advice · Always consult a healthcare provider for diagnosis and treatment
                    </p>
                  )}
                </div>
              </div>
            );

            if (msg.type === 'emergency') {
              const r = msg.data;
              return (
                <div key={i} className={`${styles.emergencyCard} ${r.level === 'crisis' ? styles.crisis : styles.critical}`}>
                  <div className={styles.emergencyLabel}>{r.level === 'crisis' ? '💙' : '🚨'} {r.label}</div>
                  <div className={styles.emergencyText}>{r.message}</div>
                  <div className={styles.emergencyBtns}>
                    <a href={r.cta.action} className={`${styles.eBtn} ${r.level === 'crisis' ? styles.eBtnCrisis : styles.eBtnCritical}`}>
                      {r.cta.label}
                    </a>
                    {r.secondary && (
                      <a href={r.secondary.action} className={`${styles.eBtn} ${styles.eBtnSecondary}`}>
                        {r.secondary.label}
                      </a>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}

          <div ref={messagesEnd} />
        </main>

        {/* Input */}
        <footer className={styles.inputArea}>
          <div className={styles.inputRow}>
            <div className={styles.inputWrap}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKey}
                placeholder="Ask a health question…"
                rows={1}
                disabled={loading}
              />
            </div>
            <button
              className={styles.sendBtn}
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <p className={styles.inputNote}>
            Not a substitute for medical advice · Always see a doctor for urgent concerns
          </p>
        </footer>

      </div>
    </>
  );
}

function HeartIcon({ size = 18, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
