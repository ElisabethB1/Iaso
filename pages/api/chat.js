// pages/api/chat.js
// This runs on the server — the API key is never sent to the browser

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const apiKey   = process.env.MISTRAL_API_KEY;
  const agentId  = process.env.MISTRAL_AGENT_ID;

  if (!apiKey || !agentId) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const mistralRes = await fetch('https://api.mistral.ai/v1/agents/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        agent_id: agentId,
        messages,
        max_tokens: 600,
      }),
    });

    if (!mistralRes.ok) {
      const error = await mistralRes.json();
      console.error('Mistral API error:', error);
      return res.status(mistralRes.status).json({ error: 'Failed to reach AI service' });
    }

    const data = await mistralRes.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: 'Empty response from AI service' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
