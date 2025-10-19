const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  // Analyze medical report image/PDF
  async analyzeMedicalReport(filePath, fileType, reportType) {
    try {
      const startTime = Date.now();
      
      // Read file
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');
      
      // Determine MIME type
      const mimeType = this.getMimeType(fileType);
      
      // Create prompt based on report type
      const prompt = this.createAnalysisPrompt(reportType);
      
      // Prepare the request
      const request = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // Generate response
      console.log('🤖 Gemini AI - Starting medical report analysis...');
      const result = await this.model.generateContent(request);
      const response = await result.response;
      const text = response.text();
      console.log('🤖 Gemini AI - Analysis completed successfully');
      console.log('🤖 Gemini AI - Response length:', text.length, 'characters');
      
      const processingTime = Date.now() - startTime;
      
      // Parse the response
      const parsedResponse = this.parseGeminiResponse(text);
      parsedResponse.processingTime = processingTime;
      
      // Log the full AI analysis result
      console.log('🤖 AI ANALYSIS RESULT:');
      console.log('=====================================');
      console.log(JSON.stringify(parsedResponse, null, 2));
      console.log('=====================================');
      
      return parsedResponse;
      
    } catch (error) {
      console.error('🤖 Gemini AI - Error analyzing medical report:', error);
      console.error('🤖 Gemini AI - Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      throw new Error(`Failed to analyze medical report: ${error.message}`);
    }
  }

  // Create analysis prompt based on report type
  createAnalysisPrompt(reportType) {
    const basePrompt = `
You are a medical AI assistant helping patients understand their medical reports. Analyze the provided medical document and provide a comprehensive, bilingual (English + Roman Urdu) analysis.

IMPORTANT GUIDELINES:
1. Always provide disclaimers that this is for informational purposes only
2. Never provide specific medical advice or diagnosis
3. Always recommend consulting a healthcare professional
4. Be empathetic and use simple, understandable language
5. Provide both English and Roman Urdu explanations

Please analyze the medical report and provide the following information in a structured JSON format:

{
  "summary": {
    "english": "Clear, simple English summary of the report",
    "urdu": "Clear, simple Roman Urdu summary of the report"
  },
  "keyFindings": [
    {
      "parameter": "Parameter name (e.g., Hemoglobin, Blood Sugar)",
      "value": "Actual value from report",
      "unit": "Unit of measurement",
      "normalRange": "Normal range for this parameter",
      "status": "normal/abnormal/critical/borderline",
      "explanation": {
        "english": "Simple English explanation of what this means",
        "urdu": "Simple Roman Urdu explanation of what this means"
      }
    }
  ],
  "abnormalValues": [
    {
      "parameter": "Parameter name",
      "value": "Actual value",
      "unit": "Unit",
      "severity": "low/medium/high/critical",
      "explanation": {
        "english": "Explanation of why this is abnormal",
        "urdu": "Roman Urdu explanation of why this is abnormal"
      },
      "recommendation": {
        "english": "General recommendation (not medical advice)",
        "urdu": "General recommendation in Roman Urdu"
      }
    }
  ],
  "doctorQuestions": [
    {
      "question": {
        "english": "Question to ask the doctor",
        "urdu": "Question in Roman Urdu"
      },
      "category": "general/medication/lifestyle/follow_up/symptoms",
      "priority": "low/medium/high"
    }
  ],
  "recommendations": {
    "lifestyle": [
      {
        "type": "diet/exercise/sleep/stress/hydration/other",
        "suggestion": {
          "english": "Lifestyle suggestion",
          "urdu": "Lifestyle suggestion in Roman Urdu"
        },
        "priority": "low/medium/high"
      }
    ],
    "medical": [
      {
        "suggestion": {
          "english": "General medical suggestion (not advice)",
          "urdu": "General medical suggestion in Roman Urdu"
        },
        "urgency": "routine/soon/urgent/emergency"
      }
    ]
  },
  "riskFactors": [
    {
      "factor": {
        "english": "Risk factor description",
        "urdu": "Risk factor in Roman Urdu"
      },
      "level": "low/medium/high",
      "description": {
        "english": "Description of the risk factor",
        "urdu": "Description in Roman Urdu"
      }
    }
  ],
  "followUpSuggestions": [
    {
      "type": "test/consultation/medication_review/lifestyle_check",
      "timeframe": "When to follow up (e.g., 1 week, 1 month)",
      "description": {
        "english": "What to do for follow up",
        "urdu": "Follow up description in Roman Urdu"
      },
      "priority": "low/medium/high"
    }
  ],
  "confidence": 85,
  "disclaimers": {
    "aiDisclaimer": {
      "english": "This analysis is generated by AI and is for informational purposes only. Always consult with a qualified healthcare professional for medical advice.",
      "urdu": "Yeh analysis AI ke zariye generate hui hai aur sirf information ke liye hai. Medical advice ke liye hamesha qualified doctor se consult karein."
    },
    "medicalDisclaimer": {
      "english": "This information should not replace professional medical advice, diagnosis, or treatment. Seek immediate medical attention for emergencies.",
      "urdu": "Yeh information professional medical advice, diagnosis ya treatment ka replacement nahi hai. Emergency cases mein immediately doctor se contact karein."
    }
  }
}

SPECIFIC INSTRUCTIONS FOR ${reportType.toUpperCase()}:
${this.getReportTypeSpecificInstructions(reportType)}

Please ensure all responses are medically accurate, empathetic, and helpful while maintaining appropriate disclaimers.
`;

    return basePrompt;
  }

  // Get report type specific instructions
  getReportTypeSpecificInstructions(reportType) {
    const instructions = {
      'blood_test': `
- Focus on blood parameters like hemoglobin, WBC, RBC, platelets, glucose, cholesterol, etc.
- Explain what each parameter means for overall health
- Highlight any values outside normal ranges
- Suggest lifestyle changes for improving blood health
`,
      'urine_test': `
- Focus on urine parameters like protein, glucose, ketones, specific gravity, etc.
- Explain what abnormal values might indicate
- Suggest hydration and dietary considerations
`,
      'x_ray': `
- Describe what the X-ray shows in simple terms
- Explain any abnormalities or concerns
- Suggest follow-up imaging if needed
`,
      'ct_scan': `
- Explain the CT scan findings in layman's terms
- Highlight any areas of concern
- Suggest appropriate follow-up care
`,
      'mri': `
- Describe MRI findings in simple language
- Explain any abnormalities
- Suggest next steps for care
`,
      'ultrasound': `
- Explain ultrasound findings
- Describe any abnormalities or concerns
- Suggest follow-up care
`,
      'ecg': `
- Explain heart rhythm and electrical activity
- Describe any abnormalities
- Suggest cardiac care recommendations
`,
      'prescription': `
- Explain prescribed medications
- Describe dosage and timing
- Highlight important side effects and interactions
`,
      'discharge_summary': `
- Summarize the hospital stay
- Explain diagnosis and treatment
- Provide follow-up care instructions
`,
      'consultation': `
- Summarize the consultation notes
- Explain doctor's recommendations
- Highlight important follow-up points
`
    };

    return instructions[reportType] || `
- Provide a general analysis of the medical document
- Explain key findings in simple terms
- Suggest appropriate follow-up care
`;
  }

  // Parse Gemini response into structured format
  parseGeminiResponse(text) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        // If no JSON found, create a structured response from the text
        return this.createFallbackResponse(text);
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return this.createFallbackResponse(text);
    }
  }

  // Create fallback response if JSON parsing fails
  createFallbackResponse(text) {
    return {
      summary: {
        english: text.substring(0, 500) + "...",
        urdu: "AI analysis complete. Please consult your doctor for detailed explanation."
      },
      keyFindings: [],
      abnormalValues: [],
      doctorQuestions: [
        {
          question: {
            english: "Can you explain the key findings in my report?",
            urdu: "Kya aap mere report ke main findings explain kar sakte hain?"
          },
          category: "general",
          priority: "high"
        }
      ],
      recommendations: {
        lifestyle: [],
        medical: []
      },
      riskFactors: [],
      followUpSuggestions: [],
      confidence: 70,
      disclaimers: {
        aiDisclaimer: {
          english: "This analysis is generated by AI and is for informational purposes only. Always consult with a qualified healthcare professional for medical advice.",
          urdu: "Yeh analysis AI ke zariye generate hui hai aur sirf information ke liye hai. Medical advice ke liye hamesha qualified doctor se consult karein."
        },
        medicalDisclaimer: {
          english: "This information should not replace professional medical advice, diagnosis, or treatment. Seek immediate medical attention for emergencies.",
          urdu: "Yeh information professional medical advice, diagnosis ya treatment ka replacement nahi hai. Emergency cases mein immediately doctor se contact karein."
        }
      }
    };
  }

  // Get MIME type based on file extension or MIME type
  getMimeType(fileType) {
    // If it's already a MIME type, return it
    if (fileType.includes('/')) {
      return fileType;
    }
    
    // Otherwise, map file extensions to MIME types
    const mimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'image': 'image/jpeg'
    };
    
    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
  }

  // Generate health tips based on user data
  async generateHealthTips(userProfile, recentVitals) {
    try {
      const prompt = `
Based on the following user profile and recent vitals, generate personalized health tips in both English and Roman Urdu:

User Profile:
- Age: ${userProfile.age || 'Not specified'}
- Gender: ${userProfile.gender || 'Not specified'}
- Last Login: ${userProfile.lastLogin}

Recent Vitals:
${JSON.stringify(recentVitals, null, 2)}

Please provide 5-7 personalized health tips in the following JSON format:
{
  "tips": [
    {
      "category": "diet/exercise/sleep/stress/hydration/general",
      "tip": {
        "english": "Health tip in English",
        "urdu": "Health tip in Roman Urdu"
      },
      "priority": "low/medium/high",
      "reason": {
        "english": "Why this tip is relevant",
        "urdu": "Why this tip is relevant in Roman Urdu"
      }
    }
  ],
  "disclaimer": {
    "english": "These tips are general recommendations. Consult your healthcare provider for personalized advice.",
    "urdu": "Yeh tips general recommendations hain. Personalized advice ke liye apne doctor se consult karein."
  }
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseGeminiResponse(text);
      
    } catch (error) {
      console.error('Error generating health tips:', error);
      throw new Error(`Failed to generate health tips: ${error.message}`);
    }
  }

  // Generate medication reminders
  async generateMedicationReminders(medications) {
    try {
      const prompt = `
Based on the following medications, generate helpful reminders and information in both English and Roman Urdu:

Medications:
${JSON.stringify(medications, null, 2)}

Please provide medication information in the following JSON format:
{
  "medications": [
    {
      "name": "Medication name",
      "reminders": {
        "english": "Reminder text in English",
        "urdu": "Reminder text in Roman Urdu"
      },
      "sideEffects": {
        "english": "Common side effects in English",
        "urdu": "Common side effects in Roman Urdu"
      },
      "interactions": {
        "english": "Important interactions in English",
        "urdu": "Important interactions in Roman Urdu"
      },
      "tips": {
        "english": "Taking tips in English",
        "urdu": "Taking tips in Roman Urdu"
      }
    }
  ],
  "generalReminders": [
    {
      "reminder": {
        "english": "General reminder in English",
        "urdu": "General reminder in Roman Urdu"
      },
      "priority": "low/medium/high"
    }
  ],
  "disclaimer": {
    "english": "Always follow your doctor's instructions and consult them about any concerns.",
    "urdu": "Hamesha apne doctor ke instructions follow karein aur koi bhi concern ho to unse consult karein."
  }
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseGeminiResponse(text);
      
    } catch (error) {
      console.error('Error generating medication reminders:', error);
      throw new Error(`Failed to generate medication reminders: ${error.message}`);
    }
  }

  // Analyze medical report from URL (for Cloudinary URLs)
  async analyzeMedicalReportFromUrl(fileUrl, fileType, reportType) {
    try {
      const startTime = Date.now();
      console.log('🤖 Gemini AI - Starting analysis from URL:', fileUrl);
      console.log('🤖 Gemini AI - File type:', fileType, 'Report type:', reportType);
      
      // Download file from URL
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const fileData = await new Promise((resolve, reject) => {
        const protocol = fileUrl.startsWith('https') ? https : http;
        protocol.get(fileUrl, (response) => {
          console.log('🤖 Gemini AI - File download response status:', response.statusCode);
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            console.log('🤖 Gemini AI - File downloaded, size:', Buffer.concat(chunks).length, 'bytes');
            resolve(Buffer.concat(chunks));
          });
          response.on('error', reject);
        }).on('error', reject);
      });
      
      const base64Data = fileData.toString('base64');
      console.log('🤖 Gemini AI - File converted to base64, length:', base64Data.length);
      
      // Determine MIME type
      const mimeType = this.getMimeType(fileType);
      console.log('🤖 Gemini AI - Detected MIME type:', mimeType, 'from fileType:', fileType);
      
      // Create prompt based on report type
      const prompt = this.createAnalysisPrompt(reportType);
      
      // Prepare the request
      const request = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }]
      };
      
      // Generate content using Gemini
      console.log('🤖 Gemini AI - Sending request to Gemini API...');
      const result = await this.model.generateContent(request);
      const response = await result.response;
      const text = response.text();
      console.log('🤖 Gemini AI - Received response from Gemini, length:', text.length);
      
      // Parse the response
      const analysis = this.parseGeminiResponse(text);
      console.log('🤖 Gemini AI - Parsed analysis:', JSON.stringify(analysis, null, 2));
      
      // Log the full AI analysis result
      console.log('🤖 AI ANALYSIS RESULT (URL):');
      console.log('=====================================');
      console.log(JSON.stringify(analysis, null, 2));
      console.log('=====================================');
      
      const endTime = Date.now();
      console.log(`AI analysis completed in ${endTime - startTime}ms`);
      
      return {
        ...analysis,
        processingTime: endTime - startTime,
        fileUrl: fileUrl,
        reportType: reportType
      };
      
    } catch (error) {
      console.error('Error analyzing medical report from URL:', error);
      throw new Error(`Failed to analyze medical report: ${error.message}`);
    }
  }
}

module.exports = new GeminiService();
