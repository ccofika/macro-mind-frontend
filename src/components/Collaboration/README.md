# Real-Time Collaboration Features

This directory contains components for the real-time collaboration system in MacroMind. These components enable multiple users to work together on the same canvas in real-time.

## Components

### 1. ActiveUsers
Displays a list of users currently active in the collaborative space. Shows user avatars, names, and online status.

### 2. CardLock
Indicates when a card is being edited by a user. Prevents multiple users from editing the same card simultaneously to avoid conflicts.

### 3. CursorTrail
Shows the cursor positions of other users in real-time, making it easier to see what others are focusing on.

### 4. SpacesSidebar
Manages collaborative spaces. Users can create, join, edit, and leave spaces. Spaces can be public or private.

## Implementation Details

The collaboration system is built on WebSockets for real-time communication. The key features include:

- **User Presence**: See who's currently viewing and working on the canvas
- **Cursor Tracking**: View other users' cursor positions in real-time
- **Card Locking**: Prevent editing conflicts by locking cards when they're being edited
- **Collaborative Spaces**: Create and join different collaborative workspaces
- **Real-time Updates**: Changes made by one user are immediately visible to others

## Usage

The collaboration features are integrated into the Canvas component and managed through the CollaborationContext. The system automatically connects to the WebSocket server when a user logs in and joins a space.

To use these features:

1. Ensure the user is logged in
2. Create or join a collaborative space
3. Start collaborating - cursor movements and card edits will be synchronized in real-time

## Architecture

- **Client-side**: React components and context for managing collaboration state
- **Server-side**: WebSocket server for real-time communication
- **Data Model**: MongoDB collections for spaces, users, and connections

## Dependencies

- WebSocket service for real-time communication
- Authentication system for user identification
- Canvas and Card contexts for integration with the main application 