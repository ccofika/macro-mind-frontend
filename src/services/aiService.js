// Fallback funkcija za lokalno poboljšanje teksta
const fallbackImprovement = (originalText, improvements) => {
  if (!originalText) return 'Please provide original text to improve.';
  
  // Početni tekst za transformaciju
  let transformedText = originalText;
  
  // Dodaj prefix za jasnu indikaciju da je ovo fallback odgovor
  transformedText = "IMPROVED VERSION:\n\n" + transformedText;
  
  // Jednostavne transformacije bazirane na tipu poboljšanja
  const lowerImprovements = improvements.toLowerCase();
  
  if (lowerImprovements.includes('formal')) {
    transformedText = transformedText
      .replace(/hi|hey|hello/gi, 'Greetings,')
      .replace(/thanks/gi, 'Thank you')
      .replace(/bye/gi, 'Best regards')
      .replace(/guys/gi, 'everyone')
      .replace(/wanna|want to/gi, 'would like to');
      
    // Dodaj formalni uvod i zaključak sa dvostrukim razmakom
    if (!transformedText.toLowerCase().includes('dear')) {
      transformedText = "Dear Valued Customer,\n\n" + transformedText;
    }
    
    if (!transformedText.toLowerCase().includes('regards') && 
        !transformedText.toLowerCase().includes('sincerely')) {
      transformedText += "\n\nBest Regards,\nSupport Team";
    }
  }
  
  if (lowerImprovements.includes('friendly')) {
    transformedText = transformedText
      .replace(/greetings/gi, 'Hey there!')
      .replace(/thank you/gi, 'Thanks a lot!')
      .replace(/regards/gi, 'Cheers!')
      .replace(/sincerely/gi, 'All the best')
      .replace(/dear valued customer/gi, 'Hi there!')
      .replace(/please be informed/gi, 'Just to let you know');
      
    // Dodaj prijateljski uvod i zaključak sa dvostrukim razmakom
    if (!transformedText.toLowerCase().includes('hey') && 
        !transformedText.toLowerCase().includes('hi there')) {
      transformedText = "Hey there!\n\n" + transformedText;
    }
    
    if (!transformedText.toLowerCase().includes('cheers') && 
        !transformedText.toLowerCase().includes('all the best')) {
      transformedText += "\n\nCheers,\nThe Support Team";
    }
  }
  
  if (lowerImprovements.includes('detail') || lowerImprovements.includes('detailed')) {
    // Dodaj više detalja i podeli tekst u više paragrafa
    const sentences = transformedText.match(/[^.!?]+[.!?]+/g) || [];
    
    if (sentences.length > 2) {
      // Grupiši rečenice u paragrafe
      let paragraphs = [];
      for (let i = 0; i < sentences.length; i += 2) {
        const paragraph = sentences.slice(i, i + 2).join(' ');
        paragraphs.push(paragraph);
      }
      
      transformedText = paragraphs.join('\n\n');
      
      // Dodaj dodatne detalje na kraj
      transformedText += "\n\nFor additional information, please don't hesitate to contact our support team. We're available 24/7 to assist you with any questions or concerns you may have regarding this matter.";
    }
  }
  
  if (lowerImprovements.includes('concise') || lowerImprovements.includes('short')) {
    // Ukloni ponavljanja i skrati tekst
    transformedText = transformedText
      .replace(/,\s+and/gi, ' and')
      .replace(/\s+/g, ' ')
      .replace(/\s+\./g, '.')
      .replace(/that is to say|in other words/gi, 'i.e.')
      .replace(/for example|for instance/gi, 'e.g.');
      
    // Zadrži samo prve 2-3 rečenice za sažetak
    const sentences = transformedText.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 3) {
      transformedText = sentences.slice(0, 3).join(' ');
      transformedText += "\n\nThis covers the key information you requested.";
    }
  }
  
  // Osiguraj da su paragrafi odvojeni sa dvostrukim novim redom
  transformedText = transformedText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([^\n])\n([^\n])/g, '$1\n\n$2')
    .trim();
  
  // Dodaj napomenu
  return `${transformedText}\n\n[This is a fallback response as the AI service is currently unavailable.]`;
};