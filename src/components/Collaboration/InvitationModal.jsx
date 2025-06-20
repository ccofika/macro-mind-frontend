import React, { useState } from 'react';
import './InvitationModal.css';
import invitationService from '../../services/invitationService';

const InvitationModal = ({ isOpen, onClose, space, onInvitationSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const invitation = await invitationService.sendInvitation(
        space._id || space.id,
        email.trim(),
        role,
        message.trim()
      );

      console.log('Invitation sent successfully:', invitation);
      
      if (onInvitationSent) {
        onInvitationSent(invitation);
      }

      // Reset form
      setEmail('');
      setRole('viewer');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setRole('viewer');
      setMessage('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="invitation-modal-overlay" onClick={handleClose}>
      <div className="invitation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invitation-modal-header">
          <h3>Invite User to Space</h3>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isLoading}
            title="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="invitation-modal-content">
          <div className="space-info">
            <div className="space-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <div className="space-details">
              <span className="space-name">{space?.name}</span>
              <span className={`space-badge ${space?.isPublic ? 'public' : 'private'}`}>
                {space?.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="invitation-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Enter user's email address"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                disabled={isLoading}
              >
                <option value="viewer">Viewer - Can view and comment</option>
                <option value="editor">Editor - Can view, edit, and add content</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Personal Message (Optional)</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Add a personal message to the invitation..."
                rows="3"
                maxLength="500"
                disabled={isLoading}
              />
              <div className="character-count">
                {message.length}/500 characters
              </div>
            </div>

            {error && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="send-button"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvitationModal; 