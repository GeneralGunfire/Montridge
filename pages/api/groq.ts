import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

interface GroqResponse {
  summary: string
  why_it_matters: string
  categories: string[]
  entities: { people: string[]; organizations: string[]; places: string[] }
  key_facts: string[]
  sentiment: string
  signal_score: number
  importance: string
  related_context: string
  bias_indicators: { emotional_language: boolean; one_sided: boolean; has_quotes: boolean; has_data: boolean }
}

const API_KEYS = [
  process.env.GROQ_API_KEY || 'placeholder',
  process.env.GROQ_API_KEY_2 || 'placeholder'
]
let currentKeyIndex = 0

function getCurrentHeaders() {
  const key = API_KEYS[currentKeyIndex]
  if (!key || key === 'placeholder') {
    throw new Error('Groq API keys not configured. Configure them in environment variables.')
  }
  return {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

function switchApiKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
}

export async function callGroqApi(articleTitle: string, articleSummary: string): Promise<GroqResponse | null> {
  const prompt = `Analyze this news article and return a structured JSON response.

Article Title: ${articleTitle}
Article Summary: ${articleSummary || 'No summary available'}

Return ONLY valid JSON with NO markdown formatting, NO code fences, NO explanation text. Just pure JSON.

{
  "summary": "2-3 sentences",
  "why_it_matters": "2-3 sentences",
  "categories": ["Politics", "Business", "Technology"],
  "entities": {
    "people": ["Name1", "Name2"],
    "organizations": ["Org1"],
    "places": ["Place1"]
  },
  "key_facts": ["Fact with number/name/date"],
  "sentiment": "positive OR negative OR neutral",
  "signal_score": 75,
  "importance": "high OR medium OR low",
  "related_context": "1-2 sentences",
  "bias_indicators": {
    "emotional_language": true,
    "one_sided": false,
    "has_quotes": true,
    "has_data": false
  }
}`

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      },
      { headers: getCurrentHeaders(), timeout: 30000 }
    )

    const content = response.data.choices[0].message.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.log('Rate limit hit, switching API key')
      switchApiKey()
      return callGroqApi(articleTitle, articleSummary)
    }
    console.error('Groq API error:', error.message)
    return null
  }
}

export default async function handler(req: any, res: any) {
  res.status(200).json({ status: 'Groq integration ready' })
}
