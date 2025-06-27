import React, { useState, useEffect } from 'react';
import './InvitationNotifications.css';
import invitationService from '../../services/invitationService';
import { useAuth } from '../../context/AuthContext';
import { useCollaboration } from '../../context/CollaborationContext';

const InvitationNotifications = () => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const { loadSpaces } = useCollaboration();

  useEffect(() => {
    if (currentUser) {
      loadInvitations();
    }
  }, [currentUser]);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading invitations for user:', currentUser?.email);
      const data = await invitationService.getInvitations();
      console.log('Raw invitations response:', data);
      
      // Handle both array and object responses
      const receivedInvitations = Array.isArray(data) ? data : (data.received || []);
      console.log('Processed invitations:', receivedInvitations);
      
      setInvitations(receivedInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      setError(error.message || 'Failed to load invitations');
      setInvitations([]); // Fallback to empty array
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    if (processingIds.has(invitationId)) return;

    setProcessingIds(prev => new Set(prev).add(invitationId));

    try {
      console.log('Accepting invitation:', invitationId);
      await invitationService.acceptInvitation(invitationId);
      console.log('Invitation accepted successfully');
      
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      // Reload spaces to show the new space
      if (loadSpaces) {
        await loadSpaces();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    if (processingIds.has(invitationId)) return;

    setProcessingIds(prev => new Set(prev).add(invitationId));

    try {
      console.log('Rejecting invitation:', invitationId);
      await invitationService.rejectInvitation(invitationId);
      console.log('Invitation rejected successfully');
      
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      setError('Failed to reject invitation');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Always show the container to ensure visibility for debugging
  if (isLoading) {
    return (
      <div className="invitation-notifications-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading invitations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invitation-notifications-container">
        <div className="error-state">
          <div className="error-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <span className="error-text">Error: {error}</span>
          <button className="retry-button" onClick={loadInvitations}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state for debugging (instead of returning null)
  if (invitations.length === 0) {
    return (
      <div className="invitation-notifications-container">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <span className="empty-text">No pending invitations</span>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-notifications-container">
      <div className="notifications-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h3 className="header-title">Space Invitations</h3>
          <div className="invitations-badge">{invitations.length}</div>
        </div>
      </div>

      <div className="invitations-list">
        {invitations.map((invitation) => {
          console.log('Rendering invitation:', invitation._id, invitation);
          const isProcessing = processingIds.has(invitation._id);
          
          return (
            <div key={invitation._id} className="invitation-item">
              <div className="invitation-card">
                {/* Space Info Header */}
                <div className="space-header">
                  <div className="space-info">
                    <div className="space-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                    </div>
                    <div className="space-details">
                      <span className="space-name">{invitation.space?.name || 'Unknown Space'}</span>
                      <span className={`visibility-badge ${invitation.space?.isPublic ? 'public' : 'private'}`}>
                        {invitation.space?.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                  <div className="invitation-time">
                    {formatTimeAgo(invitation.createdAt)}
                  </div>
                </div>

                {/* Invitation Content */}
                <div className="invitation-content">
                  <div className="inviter-section">
                    <div className="inviter-avatar">
                      {invitation.inviter?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="invitation-text">
                      <p>
                        <span className="inviter-name">{invitation.inviter?.name || 'Someone'}</span> invited you to join as{' '}
                        <span className="role-badge">{invitation.role}</span>
                      </p>
                      {invitation.message && (
                        <div className="custom-message">
                          "{invitation.message}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="invitation-actions">
                  <button
                    className="decline-button glass-button"
                    onClick={() => handleRejectInvitation(invitation._id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="button-spinner"></div>
                        <span>Declining...</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        <span>Decline</span>
                      </>
                    )}
                  </button>

                  <button
                    className="accept-button glass-button"
                    onClick={() => handleAcceptInvitation(invitation._id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="button-spinner"></div>
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvitationNotifications; 