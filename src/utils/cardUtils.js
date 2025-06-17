import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a template for a new category card
 */
export const createCategoryTemplate = (title, position) => {
  return {
    id: uuidv4(),
    type: 'category',
    title: title || 'New Category',
    content: null,
    position,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Creates a template for a new answer card
 */
export const createAnswerTemplate = (title, content, position) => {
  return {
    id: uuidv4(),
    type: 'answer',
    title: title || 'New Answer',
    content: content || '',
    position,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Creates a connection template between two cards
 */
export const createConnectionTemplate = (sourceId, targetId) => {
  return {
    id: uuidv4(),
    sourceId,
    targetId,
    createdAt: new Date().toISOString()
  };
};

/**
 * Builds a tree structure from flat cards and connections
 */
export const buildCardTree = (cards, connections) => {
  // Create a map for quick card lookup
  const cardMap = cards.reduce((map, card) => {
    map[card.id] = { ...card, children: [] };
    return map;
  }, {});
  
  // Add children references
  connections.forEach(conn => {
    if (cardMap[conn.sourceId] && cardMap[conn.targetId]) {
      cardMap[conn.sourceId].children.push(cardMap[conn.targetId]);
    }
  });
  
  // Find root nodes (those without parents)
  const hasParent = new Set(connections.map(conn => conn.targetId));
  
  const rootNodes = cards
    .filter(card => !hasParent.has(card.id))
    .map(card => cardMap[card.id]);
  
  return rootNodes;
};

/**
 * Extracts all child card IDs recursively
 */
export const getAllChildrenIds = (cardId, connections) => {
  const directChildren = connections
    .filter(conn => conn.sourceId === cardId)
    .map(conn => conn.targetId);
  
  const allChildren = [...directChildren];
  
  directChildren.forEach(childId => {
    const childrenOfChild = getAllChildrenIds(childId, connections);
    allChildren.push(...childrenOfChild);
  });
  
  return [...new Set(allChildren)]; // Remove duplicates
};

/**
 * Gets all related cards (both parents and children)
 */
export const getRelatedCardIds = (cardId, connections) => {
  // Get all children
  const childrenIds = getAllChildrenIds(cardId, connections);
  
  // Get all parents
  const parentIds = connections
    .filter(conn => conn.targetId === cardId)
    .map(conn => conn.sourceId);
  
  // Get parents of parents (ancestors)
  const ancestorIds = [];
  parentIds.forEach(parentId => {
    const parentsOfParent = connections
      .filter(conn => conn.targetId === parentId)
      .map(conn => conn.sourceId);
    ancestorIds.push(...parentsOfParent);
  });
  
  return [...new Set([...childrenIds, ...parentIds, ...ancestorIds])];
};

/**
 * Sanitizes HTML content to prevent XSS
 */
export const sanitizeContent = (content) => {
  if (!content) return '';
  
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};