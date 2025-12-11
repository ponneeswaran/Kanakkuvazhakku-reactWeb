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
    
    const today = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Extract expense details from this text: "${text}". Today's date is ${today}. Return JSON.`,
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

export const parseIncomeFromText = async (text: string): Promise<any> => {
    if (!apiKey) throw new Error("API Key missing");

    const today = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Extract income details from this text: "${text}". Today's date is ${today}. Return JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    amount: { type: Type.NUMBER },
                    category: { type: Type.STRING, enum: ['Salary', 'Rent', 'Interest', 'Business', 'Gift', 'Other'] },
                    source: { type: Type.STRING },
                    date: { type: Type.STRING, description: "YYYY-MM-DD format. Use today if not specified." }
                },
                required: ['amount', 'category', 'source']
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

const addIncomeTool: FunctionDeclaration = {
  name: "add_income",
  description: "Add a new income source or scheduled income (like Salary, Rent) to the tracking system.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "Numeric amount of the income." },
      category: { 
        type: Type.STRING, 
        enum: ['Salary', 'Rent', 'Interest', 'Business', 'Gift', 'Other'],
        description: "Category of the income." 
      },
      source: { type: Type.STRING, description: "Source of the income (e.g., Employer Name, Tenant Name)." },
      date: { type: Type.STRING, description: "Date of income receipt or due date in YYYY-MM-DD format." },
      recurrence: {
          type: Type.STRING,
          enum: ['None', 'Monthly', 'Yearly'],
          description: "How often this income repeats."
      }
    },
    required: ["amount", "category", "source"]
  }
};

const deleteTransactionTool: FunctionDeclaration = {
  name: "delete_transaction",
  description: "Delete a specific expense or income transaction. Always confirm with the user (e.g. 'Are you sure you want to delete the expense for Coffee?') before calling this tool, unless the user's request is an explicit command like 'Yes, delete it'.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ['expense', 'income'],
        description: "The type of transaction to delete."
      },
      id: {
        type: Type.STRING,
        description: "The ID of the transaction to delete. If the user says 'last expense' or 'last income', leave this blank or try to find the ID from context."
      }
    },
    required: ["type"]
  }
};

export const chatWithFinancialAssistant = async (
  message: string, 
  history: ChatMessage[], 
  context: UserContext,
  onAddExpense?: (expense: any) => void,
  onAddIncome?: (income: any) => void,
  onDeleteTransaction?: (type: 'expense' | 'income', id?: string) => Promise<string>
): Promise<string> => {
  if (!apiKey) return "Please set your Google Gemini API Key to chat.";

  try {
    // Prepare a summarized context to avoid hitting token limits with large datasets
    // Sort by createdAt desc to effectively get "last added"
    const recentExpenses = context.expenses
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30);
    
    const recentIncomes = (context.incomes || [])
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const today = new Date().toISOString().split('T')[0];

    const contextData = {
      summary: "User's recent financial data",
      currency: context.currency,
      budgets: context.budgets,
      recentTransactions: recentExpenses.map(e => ({ id: e.id, description: e.description, amount: e.amount, date: e.date, category: e.category })),
      recentIncomes: recentIncomes.map(i => ({ id: i.id, source: i.source, amount: i.amount, date: i.date, category: i.category })),
      currentDate: today
    };

    const systemInstruction = `You are Kanakkuvazhakku (Accountant), a smart, friendly, and helpful personal finance assistant. 
    You have access to the user's local financial data (context file).
    Today's date is ${today}.
    
    Your goals:
    1. Answer questions about their spending and income habits.
    2. Provide advice on budgeting and rent collection.
    3. Help add expenses using the 'add_expense' tool.
    4. Help add income or scheduled earnings (salary, rent) using the 'add_income' tool.
    5. Help delete transactions using 'delete_transaction' tool.
       CRITICAL: Before deleting, you MUST verify with the user.
       Example: User: "Delete the coffee expense." -> You: "I found an expense for Coffee for $5 on 2024-10-20. Are you sure you want to delete it?"
       Only call 'delete_transaction' after the user confirms.
       
       If user says "Delete last expense", look at 'recentTransactions' (index 0 is the latest).
       
    6. Be concise and mobile-friendly.
    
    Current User Context:
    ${JSON.stringify(contextData, null, 2)}
    `;

    // Construct tools array based on available callbacks
    const functionDeclarations: FunctionDeclaration[] = [];
    if (onAddExpense) functionDeclarations.push(addExpenseTool);
    if (onAddIncome) functionDeclarations.push(addIncomeTool);
    if (onDeleteTransaction) functionDeclarations.push(deleteTransactionTool);

    // Convert history to Gemini format
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
        tools: functionDeclarations.length > 0 ? [{functionDeclarations}] : undefined
      },
      history: history.filter(h => !h.isThinking && h.text).map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    let result = await chat.sendMessage({ message });
    
    // Check for function calls
    const functionCalls = result.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        let functionResult = "";
        
        try {
            if (call.name === 'add_expense' && onAddExpense) {
                // Execute action on client side
                onAddExpense(call.args);
                functionResult = "Expense added successfully.";
            } else if (call.name === 'add_income' && onAddIncome) {
                // Execute action on client side
                onAddIncome(call.args);
                functionResult = "Income added successfully.";
            } else if (call.name === 'delete_transaction' && onDeleteTransaction) {
                functionResult = await onDeleteTransaction(call.args.type as any, call.args.id as any);
            } else {
                functionResult = "Tool not available.";
            }

            // Send success response back to model to get final text
            const functionResponsePart = {
                functionResponse: {
                    name: call.name,
                    response: { result: functionResult },
                    id: call.id
                }
            };
            
            result = await chat.sendMessage({ message: [functionResponsePart] });
        } catch (error) {
             const functionResponsePart = {
                functionResponse: {
                    name: call.name,
                    response: { result: "Error executing operation." },
                    id: call.id
                }
            };
            result = await chat.sendMessage({ message: [functionResponsePart] });
        }
    }
    
    return result.text || "I've processed your request.";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered an error connecting to the AI service.";
  }
};