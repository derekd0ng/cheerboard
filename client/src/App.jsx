import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set());
  const [userReactions, setUserReactions] = useState(new Map());
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [activeTab, setActiveTab] = useState('cheer'); // 'cheer' or 'vent'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [ventingMessage, setVentingMessage] = useState('');
  const [isVenting, setIsVenting] = useState(false);

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

  useEffect(() => {
    // Change body class based on active tab
    if (activeTab === 'vent') {
      document.body.classList.add('vent-mode');
    } else {
      document.body.classList.remove('vent-mode');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('vent-mode');
    };
  }, [activeTab]);

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

  const handleTabSwitch = (newTab) => {
    if (newTab === activeTab || isTransitioning) return;
    
    // Determine slide direction based on current and target tab
    if (activeTab === 'cheer' && newTab === 'vent') {
      setSlideDirection('cheer-to-vent'); // Current slides left, new comes from right
    } else if (activeTab === 'vent' && newTab === 'cheer') {
      setSlideDirection('vent-to-cheer'); // Current slides right, new comes from left
    }
    
    setIsTransitioning(true);
    
    // Wait for slide-out animation to complete
    setTimeout(() => {
      setActiveTab(newTab);
      setSlideDirection('slide-in');
      
      // Longer delay to ensure new content is positioned off-screen right
      setTimeout(() => {
        setSlideDirection('slide-in-animate');
        
        // End transition after slide-in completes
        setTimeout(() => {
          setIsTransitioning(false);
          setSlideDirection('');
        }, 400);
      }, 100);
    }, 400);
  };

  const handleVentSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    
    // Show the message disappearing animation
    try {
      // Store the message for the disappearing animation
      setVentingMessage(newMessage);
      setIsVenting(true);
      
      // Clear the input immediately
      setNewMessage('');
      
      // Start the disappearing animation
      setTimeout(() => {
        // Message starts fading
        setIsVenting(false);
        
        // Complete cleanup after animation
        setTimeout(() => {
          setVentingMessage('');
          setLoading(false);
        }, 1500); // Match CSS animation duration
      }, 500); // Brief pause before disappearing
      
    } catch (error) {
      console.error('Error venting:', error);
      setLoading(false);
      setIsVenting(false);
      setVentingMessage('');
    }
  };

  return (
    <div className="app">
      {activeTab === 'cheer' ? (
        <>
          <header className="header">
            <h1>🪐 The Cheer Board</h1>
            <p>Share a message to brighten someone's day!</p>
          </header>

          <button 
            className="tab-switch"
            onClick={() => handleTabSwitch('vent')}
            aria-label="Switch to vent tab"
          >
            💀
          </button>
        </>
      ) : (
        <>
          <header className="header">
            <h1>💀 The Vent Board</h1>
            <p>Let it all out... this message will disappear after posting</p>
          </header>

          <button 
            className="tab-switch"
            onClick={() => handleTabSwitch('cheer')}
            aria-label="Switch to cheer tab"
          >
            🪐
          </button>
        </>
      )}

      <div className={`content ${activeTab === 'vent' ? 'content-vent' : ''} ${isTransitioning ? 'content-transitioning' : ''} ${slideDirection ? `slide-${slideDirection}` : ''}`}>
        <main className="main">
          {activeTab === 'cheer' ? (
            <>
              <form onSubmit={handleSubmit} className="message-form">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Поделись радостью, поддержи или поблагодари коллег!"
                  maxLength={280}
                  rows={3}
                  disabled={loading}
                />
                <div className="form-footer">
                  <span className="char-count">{newMessage.length}/280</span>
                  <button type="submit" disabled={loading || !newMessage.trim()}>
                    {loading ? 'Posting...' : 'Запостить'}
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
            </>
          ) : (
            <>
              <form onSubmit={handleVentSubmit} className="message-form vent-form">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Выпусти пар - что тебя достало?"
                  maxLength={280}
                  rows={3}
                  disabled={loading}
                />
                <div className="form-footer">
                  <span className="char-count">{newMessage.length}/280</span>
                  <button type="submit" disabled={loading || !newMessage.trim()}>
                    {loading ? 'Отпускаю...' : 'Отпустить'}
                  </button>
                </div>
              </form>

              <div className="vent-area">
                <p className="vent-message">Пусть твои переживания растворятся в темноте 🌌</p>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Disappearing message area - completely separate from main content */}
      {activeTab === 'vent' && ventingMessage && (
        <div className={`disappearing-message ${isVenting ? 'appearing' : 'disappearing'}`}>
          {ventingMessage}
        </div>
      )}
      
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
