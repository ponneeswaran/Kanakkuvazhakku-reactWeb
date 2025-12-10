

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { UserContext, ChatMessage } from "../types";

// Initialize Gemini Client
// In a real app, this key should be proxied or handled securely.
// For this demo, we rely on the environment variable as per instructions.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-2.5-flash";

export const generateSpendingInsight = async (context: UserContext): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    const today = new Date().toISOString().split('T')[0];
    const totalExpensesAmount = context.expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncomeAmount = (context.incomes || []).filter(i => i.status === 'Received').reduce((s, i) => s + i.amount, 0);

    const contextString = JSON.stringify({
      currentDate: today,
      totalExpensesAmount,
      totalIncomeAmount,
      cashFlow: totalIncomeAmount - totalExpensesAmount,
      recentExpenses: context.expenses.slice(0, 20),
      budgets: context.budgets,
      pendingIncomes: (context.incomes || []).filter(i => i.status === 'Overdue' || i.status === 'Expected')
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze this financial data. Provide one short, impactful insight (max 2 sentences) focusing on cash flow, overdue income (especially rent), or budget adherence. User Data: ${contextString}`,
      config: {
        systemInstruction: "You are Kanakkuvazhakku, a helpful personal finance assistant. Be friendly but direct.",
        temperature: 0.7,
      }
    });

    return response.text || "Keep tracking your expenses to see insights!";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Could not generate insight at this time.";
  }
};

export const parseExpenseFromText = async (text: string): Promise<any> => {
    if (!apiKey) throw new Error("API Key missing");

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Extract expense details from this text: "${text}". Return JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    amount: { type: Type.NUMBER },
                    category: { type: Type.STRING, enum: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Housing', 'Other'] },
                    description: { type: Type.STRING },
                    date: { type: Type.STRING, description: "YYYY-MM-DD format. Use today if not specified." },
                    paymentMethod: { type: Type.STRING, enum: ['Cash', 'Card', 'UPI', 'Other'] }
                },
                required: ['amount', 'category', 'description']
            }
        }
    });

    return JSON.parse(response.text || "{}");
}

const addExpenseTool: FunctionDeclaration = {
  name: "add_expense",
  description: "Add a new expense transaction to the tracking system.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "Numeric amount of the expense." },
      category: { 
        type: Type.STRING, 
        enum: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Housing', 'Other'],
        description: "Category of the expense." 
      },
      description: { type: Type.STRING, description: "Description of what was purchased." },
      date: { type: Type.STRING, description: "Date of transaction in YYYY-MM-DD format." },
      paymentMethod: { 
        type: Type.STRING, 
        enum: ['Cash', 'Card', 'UPI', 'Other'],
        description: "Method of payment." 
      }
    },
    required: ["amount", "category", "description"]
  }
};

export const chatWithFinancialAssistant = async (
  message: string, 
  history: ChatMessage[], 
  context: UserContext,
  onAddExpense?: (expense: any) => void
): Promise<string> => {
  if (!apiKey) return "Please set your Google Gemini API Key to chat.";

  try {
    // Prepare a summarized context to avoid hitting token limits with large datasets
    const recentExpenses = context.expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);
    
    const recentIncomes = (context.incomes || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const today = new Date().toISOString().split('T')[0];

    const contextData = {
      summary: "User's recent financial data",
      currency: context.currency,
      budgets: context.budgets,
      recentTransactions: recentExpenses,
      recentIncomes: recentIncomes,
      currentDate: today
    };

    const systemInstruction = `You are Kanakkuvazhakku (Accountant), a smart, friendly, and helpful personal finance assistant. 
    You have access to the user's local financial data (context file).
    Today's date is ${today}.
    
    Your goals:
    1. Answer questions about their spending and income habits.
    2. Provide advice on budgeting and rent collection.
    3. Help add expenses using the 'add_expense' tool.
    4. Be concise and mobile-friendly.
    
    Current User Context:
    ${JSON.stringify(contextData, null, 2)}
    `;

    // Convert history to Gemini format
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
        tools: onAddExpense ? [{functionDeclarations: [addExpenseTool]}] : undefined
      },
      history: history.filter(h => !h.isThinking && h.text).map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    let result = await chat.sendMessage({ message });
    
    // Check for function calls
    const functionCalls = result.functionCalls;
    if (functionCalls && functionCalls.length > 0 && onAddExpense) {
        const call = functionCalls[0];
        if (call.name === 'add_expense') {
            try {
                // Execute action on client side
                onAddExpense(call.args);
                
                // Send success response back to model to get final text
                const functionResponsePart = {
                    functionResponse: {
                        name: call.name,
                        response: { result: "Expense added successfully." },
                        id: call.id
                    }
                };
                
                result = await chat.sendMessage({ message: [functionResponsePart] });
            } catch (error) {
                 const functionResponsePart = {
                    functionResponse: {
                        name: call.name,
                        response: { result: "Error adding expense." },
                        id: call.id
                    }
                };
                result = await chat.sendMessage({ message: [functionResponsePart] });
            }
        }
    }
    
    return result.text || "I've processed your request.";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered an error connecting to the AI service.";
  }
};