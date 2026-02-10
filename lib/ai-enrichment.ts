
import OpenAI from 'openai';

export interface EnrichedData {
  summary: string;
  valueProp: string;
  techStack: string[];
  hiring: boolean;
  icebreaker: string;
}

export class AIEnrichmentService {
  private openai: OpenAI | null = null;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    if (this.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
      });
    }
  }

  /**
   * Analyze website content and generate enrichment data
   */
  async enrichLead(businessName: string, websiteContent: string): Promise<EnrichedData> {
    if (!this.openai) {
      throw new Error('OpenAI API key is missing. Please add OPENAI_API_KEY to your env or settings.');
    }

    const prompt = `You are a B2B Sales Expert. Analyze the following website content for a company called "${businessName}".
      
      Extract the following information:
      1. Summary: A 1-sentence description of what they do.
      2. Value Proposition: Their main selling point.
      3. Tech Stack: Any technologies mentioned (e.g. Shopify, React, AWS, HubSpot). If none found, return empty array.
      4. Hiring: specific boolean if they mention "careers", "hiring", "jobs", "join our team".
      5. Icebreaker: A casual, 1-sentence personalized opening line for a cold email. It should reference something specific from their site (a case study, a specific value prop, a recent achievement) to prove we read it. Do NOT be generic. Start with "I saw..." or "I noticed...".

      Website Content:
      "${websiteContent.slice(0, 4000)}"

      Return ONLY a JSON object with keys: summary, valueProp, techStack (array of strings), hiring (boolean), icebreaker.`;

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful JSON-speaking sales assistant.' },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-3.5-turbo-0125',
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error('Empty response from AI');

      const data = JSON.parse(content);

      return {
        summary: data.summary || '',
        valueProp: data.valueProp || '',
        techStack: data.techStack || [],
        hiring: data.hiring || false,
        icebreaker: data.icebreaker || '',
      };

    } catch (error: any) {
      console.error('AI Enrichment Error:', error);
      throw new Error('Failed to analyze content with AI');
    }
  }
}
