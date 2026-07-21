export const generateAIResponse = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment variables.');
  }

  // Fallback chain of modern, active models
  const models = [
    'gemini-3.1-flash-lite'  ];

  let lastError;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({}));
        throw new Error(
          errorDetails.error?.message || `Gemini API error (Status: ${response.status})`
        );
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        console.log(`Successfully generated AI response using model: ${model}`);
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn(`Model ${model} failed: ${err.message}. Attempting fallback...`);
      lastError = err;
    }
  }

  throw new Error(`All models in fallback chain failed. Last error: ${lastError?.message}`);
};
