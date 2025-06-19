/**
 * WebSocket Service for Real-time Collaboration
 * Handles connection, authentication, and message handling for collaborative features
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.eventListeners = new Map();
    this.isAuthenticated = false;
    this.currentSpaceId = null;
    this.messageQueue = [];
    this.token = null;
    this.userId = null;
    this.userColor = null;
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.emit = this.emit.bind(this);
  }
  
  /**
   * Connect to the WebSocket server
   * @returns {Promise} - Resolves when connected and authenticated
   */
  connect() {
    if (this.isConnected || this.isConnecting) {
      console.log('WebSocket: Already connected or connecting');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        console.log('WebSocket: Starting connection...');
        
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
        console.log('WebSocket: Connecting to', wsUrl);
        
        this.socket = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            console.log('WebSocket: Connection timeout');
            this.socket.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket: Connection opened');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connected');
          
          // Authenticate immediately after connection opens
          const token = localStorage.getItem('token');
          console.log('WebSocket: Checking token for authentication', { 
            hasToken: !!token, 
            tokenLength: token?.length,
            socketReady: this.socket?.readyState === WebSocket.OPEN 
          });
          
          if (!token) {
            console.error('WebSocket: No authentication token found in localStorage');
            this.emit('authError', 'No authentication token available');
            reject(new Error('No authentication token found'));
            return;
          }
          
          if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket: Socket not ready for authentication');
            this.emit('authError', 'Socket not ready');
            reject(new Error('Socket not ready for authentication'));
            return;
          }
          
          console.log('WebSocket: Sending authentication with token...');
          try {
            this.socket.send(JSON.stringify({
              type: 'auth',
              token: token
            }));
            console.log('WebSocket: Authentication message sent successfully');
          } catch (error) {
            console.error('WebSocket: Error sending authentication:', error);
            this.emit('authError', 'Failed to send authentication');
            reject(new Error('Failed to send authentication: ' + error.message));
            return;
          }
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket: Received message:', data.type);
            this.handleMessage(data);
          } catch (error) {
            console.error('WebSocket: Error parsing message:', error);
          }
        };

        this.socket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket: Connection error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log(`WebSocket: Connection closed (${event.code}) - ${event.reason || 'No reason'}`);
          this.isConnected = false;
          this.isConnecting = false;
          this.isAuthenticated = false;
          this.emit('disconnected');
          
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

      } catch (error) {
        this.isConnecting = false;
        console.error('WebSocket: Connection setup error:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    console.log('WebSocket: Disconnecting...');
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close(1000, 'Client disconnect');
    }
    
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentSpaceId = null;
  }
  
  /**
   * Send a message through the WebSocket
   * @param {Object} data - Message data to send
   */
  send(data) {
    if (!this.socket) {
      console.warn('WebSocket: Cannot send message - socket is null');
      this.messageQueue.push(data);
      return false;
    }
    
    if (this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket: Cannot send message - socket not open (state:', this.socket.readyState, ')');
      this.messageQueue.push(data);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('WebSocket: Error sending message:', error);
      this.messageQueue.push(data);
      return false;
    }
  }
  
  /**
   * Handle incoming messages
   * @param {Object} data - Incoming message data
   */
  handleMessage(data) {
    switch (data.type) {
      case 'auth:success':
        console.log('WebSocket: Authentication successful');
        this.isAuthenticated = true;
        this.emit('authenticated');
        
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const queuedMessage = this.messageQueue.shift();
          this.send(queuedMessage);
        }
        break;
        
      case 'auth:error':
        console.error('WebSocket: Authentication failed:', data.message);
        this.emit('authError', data.message);
        break;
        
      case 'space:joined':
        console.log('WebSocket: Successfully joined space:', data.spaceId);
        console.log('WebSocket: Full space:joined data:', data);
        this.emit('spaceJoined', data);
        break;
        
      case 'users:list':
        this.emit('usersList', data.users);
        break;
        
      case 'locks:list':
        this.emit('locksList', data.locks);
        break;
        
      case 'selections:list':
        this.emit('selectionsList', data.selections);
        break;
        
      case 'user:joined':
        this.emit('userJoined', data.user);
        break;
        
      case 'user:left':
        this.emit('userLeft', data.userId);
        break;
        
      case 'user:join':
        this.emit('userJoined', data);
        break;
        
      case 'user:leave':
        this.emit('userLeft', data);
        break;
        
      case 'cursor:move':
        this.emit('cursorMove', data);
        break;
        
      case 'card:locked':
        this.emit('cardLocked', data);
        break;
        
      case 'card:unlocked':
        this.emit('cardUnlocked', data);
        break;
        
      case 'card:selected':
        this.emit('cardSelected', data);
        break;
        
      case 'card:deselected':
        this.emit('cardDeselected', data);
        break;
        
      case 'card:created':
        this.emit('card:created', data);
        break;
        
      case 'card:updated':
        this.emit('card:updated', data);
        break;
        
      case 'card:deleted':
        this.emit('card:deleted', data);
        break;
        
      case 'connection:created':
        this.emit('connection:created', data);
        break;
        
      case 'connection:deleted':
        this.emit('connection:deleted', data);
        break;
        
      case 'error':
        console.error('WebSocket: Server error:', data.message);
        this.emit('error', data.message);
        break;
        
      default:
        console.log('WebSocket: Unknown message type:', data.type);
    }
  }
  
  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`WebSocket: Reconnecting in ${delay/1000}s (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch(error => {
          console.error('WebSocket: Reconnection failed:', error);
        });
      }
    }, delay);
  }
  
  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    console.log(`WebSocket: Emitting event '${event}' with data:`, data);
    console.log(`WebSocket: Has listeners for '${event}':`, this.eventListeners.has(event));
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      console.log(`WebSocket: Number of listeners for '${event}':`, listeners.length);
      listeners.forEach((callback, index) => {
        try {
          console.log(`WebSocket: Calling listener ${index} for '${event}'`);
          callback(data);
        } catch (error) {
          console.error(`WebSocket: Error in event listener for ${event}:`, error);
        }
      });
    } else {
      console.warn(`WebSocket: No listeners registered for event '${event}'`);
    }
  }
  
  /**
   * Join a space
   * @param {string} spaceId - Space ID to join
   */
  joinSpace(spaceId) {
    if (!this.isAuthenticated) {
      console.warn('WebSocket: Cannot join space - not authenticated');
      return false;
    }

    if (!this.isConnected) {
      console.warn('WebSocket: Cannot join space - not connected');
      return false;
    }

    console.log('WebSocket: Joining space:', spaceId);
    this.currentSpaceId = spaceId;
    
    const success = this.send({
      type: 'space:join',
      spaceId: spaceId
    });
    
    if (!success) {
      console.error('WebSocket: Failed to send space join message');
      return false;
    }
    
    return true;
  }
  
  /**
   * Leave the current space
   */
  leaveSpace() {
    if (!this.isAuthenticated) {
      return;
    }

    console.log('WebSocket: Leaving current space');
    this.send({
      type: 'space:leave'
    });
    this.currentSpaceId = null;
  }
  
  /**
   * Send cursor position update
   * @param {number} x - Cursor X position
   * @param {number} y - Cursor Y position
   */
  updateCursor(x, y) {
    if (!this.isAuthenticated || !this.currentSpaceId) {
      return;
    }

    // Only send if socket is connected to avoid null errors
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'cursor:move',
        x: x,
        y: y
      });
    }
  }
  
  /**
   * Lock a card for editing
   * @param {string} cardId - Card ID to lock
   */
  lockCard(cardId) {
    if (!this.isAuthenticated) {
      return;
    }

    this.send({
      type: 'card:lock',
      cardId: cardId
    });
  }
  
  /**
   * Unlock a card
   * @param {string} cardId - Card ID to unlock
   */
  unlockCard(cardId) {
    if (!this.isAuthenticated) {
      return false;
    }

    return this.send({
      type: 'card:unlock',
      cardId: cardId
    });
  }
  
  /**
   * Select a card
   * @param {string} cardId - Card ID to select
   */
  selectCard(cardId) {
    if (!this.isAuthenticated) {
      return false;
    }

    return this.send({
      type: 'card:select',
      cardId: cardId
    });
  }
  
  /**
   * Deselect a card
   * @param {string} cardId - Card ID to deselect
   */
  deselectCard(cardId) {
    if (!this.isAuthenticated) {
      return false;
    }

    return this.send({
      type: 'card:deselect',
      cardId: cardId
    });
  }
  
  /**
   * Notify that a card was created
   * @param {Object} card - Card data
   */
  notifyCardCreated(card) {
    if (!this.isAuthenticated) {
      return;
    }

    this.send({
      type: 'card:created',
      card: card
    });
  }

  /**
   * Notify that a card was updated
   * @param {Object} card - Updated card data
   */
  notifyCardUpdated(card) {
    if (!this.isAuthenticated) {
      console.warn('WebSocketService: Cannot notify card updated - not authenticated');
      return;
    }

    console.log('WebSocketService: Notifying card updated:', {
      cardId: card.id,
      cardTitle: card.title,
      cardPosition: card.position,
      currentSpaceId: this.currentSpaceId
    });

    const success = this.send({
      type: 'card:updated',
      card: card
    });
    
    if (!success) {
      console.error('WebSocketService: Failed to send card updated notification');
    } else {
      console.log('WebSocketService: Card updated notification sent successfully');
    }
  }

  /**
   * Notify that a card was deleted
   * @param {string} cardId - ID of deleted card
   */
  notifyCardDeleted(cardId) {
    if (!this.isAuthenticated) {
      return;
    }

    this.send({
      type: 'card:deleted',
      cardId: cardId
    });
  }

  /**
   * Notify that a connection was created
   * @param {Object} connection - Connection data
   */
  notifyConnectionCreated(connection) {
    if (!this.isAuthenticated) {
      return;
    }

    this.send({
      type: 'connection:created',
      connection: connection
    });
  }

  /**
   * Notify that a connection was deleted
   * @param {string} connectionId - ID of deleted connection
   */
  notifyConnectionDeleted(connectionId) {
    if (!this.isAuthenticated) {
      return;
    }

    this.send({
      type: 'connection:deleted',
      connectionId: connectionId
    });
  }
  
  /**
   * Clear all selections (when clicking on canvas)
   */
  clearAllSelections() {
    if (!this.isAuthenticated) {
      return;
    }

    this.send({
      type: 'canvas:clearSelection'
    });
  }
  
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      currentSpaceId: this.currentSpaceId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService; 