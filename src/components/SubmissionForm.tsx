import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { checkContent } from '../services/moderation';
import { useAuth } from '../services/useAuth';

export function SubmissionForm() {
  const { user, profile, login } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return login();
    if (!text.trim()) return;

    setLoading(true);
    setMessage('Analyzing content...');

    try {
      const moderationResult = await checkContent(text);
      
      const newDoc = {
        text,
        authorId: user.uid,
        authorEmail: user.email || '',
        flagged: moderationResult.isFlagged,
        flagReason: moderationResult.reason || '',
        status: moderationResult.isFlagged ? 'pending' : 'approved',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'messages'), newDoc);
      setText('');
      
      if (moderationResult.isFlagged) {
        setMessage('Your message has been flagged for review by a moderator.');
      } else {
        setMessage('Message submitted successfully!');
      }
      
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-8">
      <h3 className="text-xl font-serif text-[#C5A059] mb-4">Submit an Inquiry</h3>
      {!user ? (
        <button 
          onClick={login}
          className="group flex items-center gap-4 bg-transparent border border-[#C5A059] px-8 py-4 hover:bg-[#C5A059] hover:text-[#0A0A0A] transition-all cursor-pointer"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] transition-colors">Sign in to Enquire</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message here..."
            className="w-full bg-[#141414] border border-white/20 p-4 text-sm font-sans focus:outline-none focus:border-[#C5A059] transition-colors resize-none placeholder:text-white/30"
            rows={4}
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <button 
              type="submit"
              disabled={loading}
              className="group flex items-center gap-4 bg-transparent border border-white/20 px-8 py-3 hover:border-[#C5A059] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-[10px] uppercase tracking-[0.3em] text-white group-hover:text-[#C5A059] transition-colors">
                {loading ? 'Processing...' : 'Submit'}
              </span>
            </button>
            {message && <span className="text-xs text-white/50">{message}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
