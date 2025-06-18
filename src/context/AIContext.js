import React, { createContext, useContext, useState, useCallback } from 'react';
import { useCards } from './CardContext';
import { aiService } from '../services/aiService';
// Uvozimo sažetak smernica umesto celog dokumenta
import { AGENT_GUIDELINES } from '../data/agentGuidelines';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  
  const { cards, updateCard, createAnswerCard } = useCards();

  const improveResponse = useCallback(async (cardId, improvements) => {
    console.log('AIContext: Starting improveResponse for card:', cardId);
    setLoading(true);
    setError(null);
    setAiResponse(null);
    setActiveCardId(cardId);
    
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        throw new Error('Card not found');
      }
      
      console.log(`AIContext: Found card ${cardId}, content length: ${(card.content || '').length}`);
      console.log(`AIContext: Improvements requested: ${improvements}`);
      
      try {
        // Koristimo sažetak smernica
        const systemPrompt = `
          You are improving customer service macro responses according to these agent guidelines:
          
          ${AGENT_GUIDELINES}
          
          Always ensure paragraphs are properly separated with double line breaks (\\n\\n).
          Address the specific improvements requested without adding meta-commentary.
          Always respond in English only, regardless of the input language.
        `;

        const userPrompt = `
          ORIGINAL TEXT:
          ${card.content || ''}

          REQUESTED IMPROVEMENTS:
          ${improvements}

          Please improve the text based on these requirements and our agent guidelines.
          Use double line breaks between paragraphs and logical sections.
        `;
        
        console.log('AIContext: Calling aiService.improveResponse...');
        
        const improvedText = await aiService.improveResponse(
          card.content || '', 
          improvements,
          systemPrompt, 
          userPrompt
        );
        
        if (!improvedText) {
          throw new Error('Empty response from AI service');
        }
        
        console.log(`AIContext: AI service returned response, length: ${improvedText.length}`);
        
        // Obrada odgovora za pravilno formatiranje
        const processedResponse = processAIResponse(improvedText);
        console.log(`AIContext: Processed response, final length: ${processedResponse.length}`);
        setAiResponse(processedResponse);
      } catch (serviceError) {
        console.error('AIContext: AI service error:', serviceError);
        setError(`AI service error: ${serviceError.message}`);
        
        const fallbackText = `
          I couldn't properly improve this text due to a service error: ${serviceError.message}
          
          Original text:
          ${card.content || ''}
          
          [Note: The AI service encountered an error. Please try again later.]
        `;
        setAiResponse(fallbackText);
      }
    } catch (err) {
      console.error('AIContext: Error in improveResponse:', err);
      setError(err.message || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  }, [cards]);

  // Funkcija za obradu AI odgovora i osiguranje pravilnog formatiranja
  const processAIResponse = (text) => {
    if (!text) return '';
    
    // Osiguravamo da su logički odvojeni delovi pravilno formatirani sa dva nova reda
    let processed = text
      // Standardizuj nove redove
      .replace(/\r\n/g, '\n')
      // Zameni jednostruke nove redove sa dvostrukim (ako već nisu dvostruki)
      .replace(/([^\n])\n([^\n])/g, '$1\n\n$2')
      // Ukloni trostruke ili više novih redova
      .replace(/\n{3,}/g, '\n\n')
      // Obezbedi da nema više od dva uzastopna nova reda
      .trim();
    
    return processed;
  };

  const createCardFromAIResponse = useCallback((mousePosition) => {
    if (!aiResponse || !activeCardId) {
      console.warn('AIContext: Cannot create card - no AI response or active card ID');
      return;
    }
    
    const sourceCard = cards.find(c => c.id === activeCardId);
    if (!sourceCard) {
      console.warn('AIContext: Cannot create card - source card not found');
      return;
    }
    
    // Čišćenje AI odgovora od meta-oznaka
    let cleanedResponse = aiResponse
      .replace(/\[Note: The AI service is currently unavailable.*?\]/g, '')
      .replace(/\[This is a fallback response.*?\]/g, '')
      .replace(/\[Note: The AI service encountered an error.*?\]/g, '')
      .replace(/IMPROVED VERSION:\s*/g, '')
      .trim();
    
    console.log(`AIContext: Creating new card from AI response, cleaned length: ${cleanedResponse.length}`);
    
    // Kreiramo naslov koji ukazuje na poboljšanu verziju
    const title = `AI: ${sourceCard.title}`;
    const newCardId = createAnswerCard(title, cleanedResponse, mousePosition);
    
    // Clear AI response after creating card
    setAiResponse(null);
    setActiveCardId(null);
    
    return newCardId;
  }, [aiResponse, activeCardId, cards, createAnswerCard]);

  const clearAIResponse = useCallback(() => {
    console.log('AIContext: Clearing AI response');
    setAiResponse(null);
    setActiveCardId(null);
    setError(null);
  }, []);

  const value = {
    loading,
    error,
    aiResponse,
    activeCardId,
    improveResponse,
    createCardFromAIResponse,
    clearAIResponse
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};