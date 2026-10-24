import { useEffect, useRef, useState } from 'react';
import { publicApi } from '../api';
import { errorMessage } from '../api/client';

/**
 * Port of chat.js. AI replies are rendered as text with simple **bold** support built from
 * React elements (the old version used innerHTML, which allowed HTML injection).
 */
function renderRich(text) {
  return String(text || '').split('\n').map((line, i) => {
    const isBullet = /^\s*[*-]\s+/.test(line);
    const clean = line.replace(/^\s*[*-]\s+/, '');
    const parts = clean.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith('**') && p.endsWith('**') ? <b key={j}>{p.slice(2, -2)}</b> : <span key={j}>{p}</span>);
    return <div key={i} style={isBullet ? { paddingLeft: 12 } : undefined}>{isBullet ? '• ' : ''}{parts}</div>;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState([{ from: 'ai', text: 'Hello! I am **Disha**. Ask me about trains, PNR status, or travel tips!' }]);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, typing]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setMsgs((m) => [...m, { from: 'user', text }]);
    setInput('');
    setTyping(true);
    try {
      const { reply } = await publicApi.chat(text);
      setMsgs((m) => [...m, { from: 'ai', text: reply }]);
    } catch (e) {
      setMsgs((m) => [...m, { from: 'ai', text: `⚠️ ${errorMessage(e, 'Connection failed.')}` }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      <button type="button" className="chat-btn" aria-label={open ? 'Close assistant' : 'Open AI assistant'}
              onClick={() => setOpen((o) => !o)}>
        <i className="bi bi-chat-dots-fill" />
      </button>
      <div className={`chat-window${open ? ' open' : ''}`} role="dialog" aria-label="Disha AI assistant">
        <div className="chat-header">
          <span><i className="bi bi-robot me-2" /> Disha - AI Assistant</span>
          <button type="button" className="btn btn-link text-white p-0" aria-label="Close" onClick={() => setOpen(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="chat-body" ref={bodyRef} aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.from === 'user' ? 'msg-user' : 'msg-ai'}`}>
              {m.from === 'user' ? m.text : renderRich(m.text)}
            </div>
          ))}
          {typing && <div className="msg-typing"><div className="dot" /><div className="dot" /><div className="dot" /></div>}
        </div>
        <div className="chat-footer">
          <input ref={inputRef} type="text" placeholder="Ask me anything..." autoComplete="off" value={input}
                 maxLength={1000} onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') send(); }} aria-label="Message" />
          <button type="button" onClick={send} aria-label="Send"><i className="bi bi-send-fill" /></button>
        </div>
      </div>
    </>
  );
}
