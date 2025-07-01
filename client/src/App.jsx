import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set());
  const [userReactions, setUserReactions] = useState(new Map());
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const messageForm = document.querySelector('.message-form');
      if (messageForm) {
        const rect = messageForm.getBoundingClientRect();
        const isFormVisible = rect.bottom > 0 && rect.top < window.innerHeight;
        setShowScrollToTop(!isFormVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/messages`);
      const data = await response.json();
      console.log('Fetched messages:', data);
      // Sort messages by created_at in descending order (newest first)
      const sortedMessages = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      console.log('Sorted messages:', sortedMessages);
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        const newMessageData = await response.json();
        setNewMessage('');
        
        // Add the new message ID to newly added set
        setNewlyAddedIds(prev => new Set([...prev, newMessageData.id]));
        
        // Remove the glow after 3 seconds
        setTimeout(() => {
          setNewlyAddedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(newMessageData.id);
            return newSet;
          });
        }, 3000);
        
        fetchMessages();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error posting message:', error);
      alert('Failed to post message');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleReaction = async (messageId, reactionType) => {
    const reactionKey = `${messageId}-${reactionType}`;
    
    // Check if user already reacted to this message with this reaction type
    if (userReactions.has(reactionKey)) {
      return; // Don't allow duplicate reactions
    }

    console.log('Adding reaction:', { messageId, reactionType });
    try {
      const response = await fetch(`${API_URL}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction: reactionType }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        // Mark this reaction as used by the user
        setUserReactions(prev => new Map(prev).set(reactionKey, true));
        
        // Update the message reactions in state
        setMessages(prevMessages => {
          const updated = prevMessages.map(message => 
            message.id === messageId 
              ? { ...message, reactions: data.reactions }
              : message
          );
          console.log('Updated messages:', updated);
          return updated;
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to add reaction:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const getReactionEmoji = (type) => {
    const emojis = {
      heart: '❤️',
      star: '⭐',
      plus: '➕',
      blessed: '🙏'
    };
    return emojis[type];
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🪐 The Cheer Board</h1>
        <p>Share a message to brighten someone's day!</p>
      </header>

      <div className="content">
        <main className="main">
          <form onSubmit={handleSubmit} className="message-form">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write something uplifting..."
            maxLength={280}
            rows={3}
            disabled={loading}
          />
          <div className="form-footer">
            <span className="char-count">{newMessage.length}/280</span>
            <button type="submit" disabled={loading || !newMessage.trim()}>
              {loading ? 'Posting...' : 'Post Message'}
            </button>
          </div>
        </form>

        <div className="messages">
          {messages.length === 0 ? (
            <p className="no-messages">No messages yet. Be the first to spread some cheer!</p>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`message message-${message.color || 'yellow'} ${newlyAddedIds.has(message.id) ? 'message-new' : ''}`}
              >
                <p className="message-content">{message.content}</p>
                <div className="reactions">
                  {['heart', 'star', 'plus', 'blessed'].map((reactionType) => {
                    const reactionKey = `${message.id}-${reactionType}`;
                    const hasReacted = userReactions.has(reactionKey);
                    
                    return (
                      <button
                        key={reactionType}
                        className={`reaction-button ${hasReacted ? 'reaction-used' : ''}`}
                        onClick={() => handleReaction(message.id, reactionType)}
                        disabled={hasReacted}
                      >
                        <span className="reaction-emoji">{getReactionEmoji(reactionType)}</span>
                        <span className="reaction-count">
                          {message.reactions?.[reactionType] || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <small className="message-date">{formatDate(message.created_at)}</small>
              </div>
            ))
          )}
        </div>
        </main>
      </div>
      
      {showScrollToTop && (
        <button 
          className="scroll-to-top-button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App
