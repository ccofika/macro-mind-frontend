import api from './api';

class InvitationService {
  // Get all invitations for the current user
  async getInvitations() {
    const response = await api.get('/invitations');
    return response.data;
  }

  // Send an invitation to join a space
  async sendInvitation(spaceId, inviteeEmail, role, message = '') {
    const response = await api.post('/invitations', {
      spaceId,
      inviteeEmail,
      role,
      message
    });
    return response.data;
  }

  // Accept an invitation
  async acceptInvitation(invitationId) {
    const response = await api.post(`/invitations/${invitationId}/accept`);
    return response.data;
  }

  // Reject an invitation
  async rejectInvitation(invitationId) {
    const response = await api.post(`/invitations/${invitationId}/reject`);
    return response.data;
  }

  // Cancel an invitation (for space owners)
  async cancelInvitation(invitationId) {
    const response = await api.delete(`/invitations/${invitationId}`);
    return response.data;
  }

  // Get invitations for a specific space
  async getSpaceInvitations(spaceId) {
    const response = await api.get(`/invitations/space/${spaceId}`);
    return response.data;
  }

  // Invite user via space endpoint (legacy support)
  async inviteToSpace(spaceId, memberEmail, role, message = '') {
    const response = await api.post(`/spaces/${spaceId}/invite`, {
      memberEmail,
      role,
      message
    });
    return response.data;
  }
}

export default new InvitationService(); 