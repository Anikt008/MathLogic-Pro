import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MathResponse, ParsedProblem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schema Definitions ---

const parsedProblemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    given: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING } 
    },
    to_prove: { type: Type.STRING },
    variables: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING } 
    },
    domain_constraints: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING } 
    },
    problem_tags: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING } 
    },
    difficulty_estimate: { 
      type: Type.STRING,
      enum: ["easy", "medium", "hard", "IMO"]
    },
    suggested_lemmas: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING } 
    }
  },
  required: ["id", "given", "to_prove", "variables", "domain_constraints", "problem_tags", "difficulty_estimate"]
};

const mathResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    human_readable_proof: {
      type: Type.STRING,
      description: "A formal, step-by-step mathematical proof in Markdown format. Use LaTeX style formatting for math equations where possible (e.g., $E=mc^2$).",
    },
    machine_readable_json: {
      type: Type.OBJECT,
      description: "Strict logical breakdown of the proof steps.",
      properties: {
        proof_id: { type: Type.STRING },
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step_no: { type: Type.INTEGER },
              statement: { type: Type.STRING, description: "The mathematical statement derived at this step." },
              justification: { type: Type.STRING, description: "The formal axiom, theorem, or previous step used to justify this statement." },
              checkable_assertions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Short expressions executable in SymPy/Python (e.g., 'expand((x+1)**2) == x**2+2*x+1')."
              },
              confidence: {
                type: Type.STRING,
                description: "Confidence level 0.0 to 1.0"
              }
            },
            required: ["step_no", "statement", "justification", "checkable_assertions", "confidence"]
          }
        },
        final_answer: { 
          type: Type.STRING, 
          description: "The final answer or QED statement." 
        },
        machine_checks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of SymPy expressions to verify the final result."
        }
      },
      required: ["proof_id", "steps", "final_answer", "machine_checks"]
    },
    python_verification: {
      type: Type.STRING,
      description: "A short, executable Python/SymPy script to numerically or symbolically verify the result.",
    },
    certainty: {
      type: Type.STRING,
      enum: ["CERTAIN", "UNSURE"],
      description: "Whether the model is certain of the mathematical validity."
    },
    uncertainty_reason: {
      type: Type.STRING,
      description: "If UNSURE, explain why.",
    }
  },
  required: ["human_readable_proof", "machine_readable_json", "python_verification", "certainty"]
};

// --- Helper Functions ---

async function parseProblem(query: string): Promise<ParsedProblem> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Fast model for parsing
        contents: [
            {
                role: 'user',
                parts: [{ 
                    text: `Task: Parse the following math problem and return structured JSON.

Input: <<${query}>>

Output Format (JSON):
{
  "id": "<unique id>",
  "given": ["<bullet statements>"],
  "to_prove": "<single sentence>",
  "variables": ["x","n",...],
  "domain_constraints": ["positive integers","real",...],
  "problem_tags": ["algebra","number-theory",...],
  "difficulty_estimate": "easy|medium|hard|IMO",
  "suggested_lemmas": ["lemma1","lemma2"]
}

Keep output minimal and valid JSON.`
                }]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: parsedProblemSchema,
            temperature: 0.2
        }
    });

    if (!response.text) throw new Error("Failed to parse problem");
    return JSON.parse(response.text) as ParsedProblem;
}

async function generateProof(parsedProblem: ParsedProblem): Promise<MathResponse> {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Reasoning model for proof
        contents: [
            {
                role: 'user',
                parts: [{ 
                    text: `Input JSON = <<${JSON.stringify(parsedProblem)}>>.

Produce three outputs (wrapped in the response JSON structure):

1) Machine-Readable Logic (JSON):
{
  "proof_id": "<id>",
  "steps": [
    {"step_no":1, "statement":"...", "justification":"<theorem/lemma/reference>", "checkable_assertions":["expr1","expr2"], "confidence":"0-1"}
  ],
  "final_answer":"...",
  "machine_checks": ["sympy_expressions_or_assertions"]
}

2) Human-Readable Proof (Markdown):
- Formal, step-by-step mathematical proof.
- Labeled steps must correspond to the JSON logic steps.
- Use LaTeX formatting for equations (e.g., $x^2 + y^2 = z^2$).

3) Python Verification:
- A standalone Python/SymPy script to verify the result.

Rules:
- Each step must be minimal and logically follow previous steps.
- Justification must cite known theorems (e.g., "Euclid's lemma", "modular arithmetic"), or say "calculation".
- checkable_assertions should be short expressions executable in SymPy/Python (e.g., "expand((x+1)**2) == x**2+2*x+1").
- Confidence 0-1 (0.0 low, 1.0 certain).` 
                }]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: mathResponseSchema,
            thinkingConfig: {
                thinkingBudget: 4096
            }
        }
    });

    if (!response.text) throw new Error("Failed to generate proof");
    return JSON.parse(response.text) as MathResponse;
}

export const solveMathProblem = async (query: string): Promise<MathResponse> => {
  try {
    // Step 1: Parse
    const parsedProblem = await parseProblem(query);
    
    // Step 2: Solve
    const result = await generateProof(parsedProblem);
    
    // Attach parsed problem to result for UI if needed
    result.parsed_problem = parsedProblem;
    
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
