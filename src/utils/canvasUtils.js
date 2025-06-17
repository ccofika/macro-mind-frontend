/**
 * Calculates the position of an element within the viewport
 */
export const getElementPosition = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

/**
 * Calculates distance between two points
 */
export const getDistance = (point1, point2) => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculates angle between two points in degrees
 */
export const getAngle = (point1, point2) => {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180 / Math.PI;
};

/**
 * Automatically arranges child cards below a parent card
 */
export const arrangeChildCards = (parentCard, childCards, gap = 120) => {
  if (!childCards || childCards.length === 0) return [];
  
  const childWidth = 200; // Assumed width of card
  const totalWidth = childCards.length * childWidth + (childCards.length - 1) * gap;
  const startX = parentCard.position.x - totalWidth / 2 + childWidth / 2;
  
  return childCards.map((card, index) => {
    return {
      ...card,
      position: {
        x: startX + index * (childWidth + gap),
        y: parentCard.position.y + 150 // Position below parent
      }
    };
  });
};

/**
 * Finds the nearest card to a point within a threshold distance
 */
export const findNearestCard = (point, cards, threshold = 50) => {
  let nearest = null;
  let minDistance = threshold;
  
  cards.forEach(card => {
    const distance = getDistance(point, card.position);
    if (distance < minDistance) {
      nearest = card;
      minDistance = distance;
    }
  });
  
  return nearest;
};