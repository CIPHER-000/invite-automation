import OpenAI from 'openai';

interface ClassificationResult {
  status: 'confirmed' | 'rejected' | 'grey_area';
  confidence: number; // 1-100
  competitors: string[];
  reasoning: string;
  rawResponse: any;
}

interface ClassificationInput {
  companyName: string;
  companyDescription: string;
  targetIndustry: string;
  industryKeywords?: string[];
}

export class OpenAIClassifier {
  private static instance: OpenAIClassifier;
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  static getInstance(): OpenAIClassifier {
    if (!OpenAIClassifier.instance) {
      OpenAIClassifier.instance = new OpenAIClassifier();
    }
    return OpenAIClassifier.instance;
  }

  /**
   * Classify company and find competitors using GPT-4
   */
  async classifyCompany(input: ClassificationInput): Promise<ClassificationResult> {
    const prompt = this.buildClassificationPrompt(input);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // Using latest GPT-4o model
        messages: [
          {
            role: "system",
            content: "You are an expert business analyst specializing in industry classification and competitive analysis. Provide accurate, data-driven assessments."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsedResponse = JSON.parse(response);
      
      return {
        status: parsedResponse.status || 'grey_area',
        confidence: Math.min(100, Math.max(1, parsedResponse.confidence || 50)),
        competitors: Array.isArray(parsedResponse.competitors) ? parsedResponse.competitors.slice(0, 5) : [],
        reasoning: parsedResponse.reasoning || 'No reasoning provided',
        rawResponse: parsedResponse
      };

    } catch (error) {
      console.error('OpenAI classification error:', error);
      throw new Error(`Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build structured prompt for classification
   */
  private buildClassificationPrompt(input: ClassificationInput): string {
    const keywordsSection = input.industryKeywords && input.industryKeywords.length > 0
      ? `Industry Keywords: ${input.industryKeywords.join(', ')}`
      : '';

    return `
Analyze the following company and determine if it belongs to the target industry:

**Company Name:** ${input.companyName}
**Company Description:** ${input.companyDescription}
**Target Industry:** ${input.targetIndustry}
${keywordsSection}

**Task:**
1. Determine if this company belongs to the target industry
2. Provide a confidence level (1-100)
3. Identify 2-3 closest competitors in the same space
4. Explain your reasoning

**Classification Options:**
- "confirmed": Clear match with target industry
- "rejected": Clearly not in target industry  
- "grey_area": Uncertain, borderline case, or insufficient information

**Response Format (JSON only):**
{
  "status": "confirmed|rejected|grey_area",
  "confidence": 85,
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "reasoning": "Detailed explanation of why this company fits/doesn't fit the target industry, including specific evidence from the description."
}

**Guidelines:**
- Be conservative: when uncertain, use "grey_area"
- Competitors should be real, well-known companies in the same specific niche
- Confidence should reflect certainty level (confirmed: 70-100, grey_area: 30-70, rejected: 1-30)
- Reasoning should cite specific evidence from the company description
- If description is too vague or generic, lean towards "grey_area"
`.trim();
  }

  /**
   * Build industry template with reusable prompt
   */
  buildIndustryTemplate(industry: string, keywords: string[], description?: string): {
    classificationPrompt: string;
    competitorPrompt: string;
  } {
    const classificationPrompt = `
You are analyzing companies to determine if they belong to the "${industry}" industry.

Key characteristics of ${industry} companies:
${keywords.map(k => `- ${k}`).join('\n')}

${description ? `Additional context: ${description}` : ''}

Classify each company as:
- "confirmed": Clear ${industry} company with strong indicators
- "rejected": Clearly not ${industry} related
- "grey_area": Uncertain or borderline case

Focus on core business activities, not just technology used or services offered.
`.trim();

    const competitorPrompt = `
When identifying competitors for ${industry} companies, focus on:
- Companies with similar target markets
- Similar service/product offerings
- Similar business models
- Direct competitive relationships

Provide 2-3 well-known, relevant competitors when possible.
`.trim();

    return { classificationPrompt, competitorPrompt };
  }

  /**
   * Test OpenAI connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Test connection. Respond with 'OK'." }],
        max_tokens: 10
      });

      return { success: !!completion.choices[0]?.message?.content };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const openaiClassifier = OpenAIClassifier.getInstance();