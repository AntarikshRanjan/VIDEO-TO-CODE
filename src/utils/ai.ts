import { DetectedComponent } from '@/types';

export async function analyzeFramesWithGemini(
  frames: string[],
  apiKey?: string
): Promise<DetectedComponent[]> {
  // Check if API key is provided and not just placeholder
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.warn('Gemini API key not provided or is placeholder, using mock data');
    return generateMockComponents();
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Analyze first few frames (to avoid token limits)
    const framesToAnalyze = frames.slice(0, 5);
    
    const prompt = `You are analyzing website video frames to identify UI components. 
    
    Carefully examine each frame and identify ALL UI components visible. For each component, provide:
    - type: one of [button, input, form, navigation, card, modal, slider, other]
    - label: a descriptive name based on what you see in the frame
    - description: what the component does or its purpose
    - confidence: 0-1 score (be honest about uncertainty)
    
    IMPORTANT: Return ONLY a valid JSON array in this exact format (no markdown, no code blocks):
    [{"id": "unique_id_1", "type": "button", "label": "Submit Button", "description": "Submit form data", "confidence": 0.9}, {"id": "unique_id_2", "type": "input", "label": "Email Field", "description": "Email input for contact form", "confidence": 0.85}]
    
    Be thorough and identify all interactive and visual elements. Base your analysis on what you actually see in the frames.`;

    const parts = framesToAnalyze.map((frame, index) => ({
      inlineData: {
        data: frame.split(',')[1], // Remove data:image/png;base64, prefix
        mimeType: 'image/png',
      },
      text: `Frame ${index + 1} of ${framesToAnalyze.length}`,
    }));

    const result = await model.generateContent([prompt, ...parts]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response - try multiple patterns
    let jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Try to find JSON in code blocks
      jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonMatch[0] = jsonMatch[1];
      }
    }

    if (jsonMatch) {
      try {
        const components = JSON.parse(jsonMatch[0]) as DetectedComponent[];
        if (Array.isArray(components) && components.length > 0) {
          return components.map((comp, index) => ({
            ...comp,
            id: comp.id || `comp_${Date.now()}_${index}`,
            frameIndex: Math.floor((index / framesToAnalyze.length) * frames.length),
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
      }
    }

    // If parsing failed but we have API key, throw error instead of using mock
    throw new Error('Failed to parse component detection response from Gemini API');
  } catch (error: any) {
    console.error('Gemini API error:', error);
    // Only fall back to mock if it's a non-critical error and no API key
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return generateMockComponents();
    }
    // If API key is provided, throw the error so user knows it failed
    throw new Error(`Gemini API error: ${error.message || 'Failed to analyze frames'}`);
  }
}

export async function generateCodeWithHuggingFace(
  components: DetectedComponent[],
  responses: Record<string, string>,
  token?: string
): Promise<{ code: string; files: Array<{ path: string; content: string; type: string }> }> {
  // Check if token is provided and not just placeholder
  if (!token || token === 'your_huggingface_token_here' || token.trim() === '') {
    console.warn('Hugging Face token not provided or is placeholder, using mock data');
    return generateMockCode(components, responses);
  }

  try {
    const axios = (await import('axios')).default;
    
    // Build detailed component descriptions
    const componentDescriptions = components.map((comp, idx) => {
      const userResponse = Object.entries(responses).find(([key]) => key.includes(comp.id));
      return `${idx + 1}. ${comp.label} (${comp.type}): ${comp.description}${userResponse ? ` - User specified: ${userResponse[1]}` : ''}`;
    }).join('\n');

    // Build user requirements
    const userRequirements = Object.entries(responses).map(([key, value]) => {
      const compId = key.split('_')[1];
      const component = components.find(c => c.id === compId);
      return `- ${component?.label || 'Component'}: ${value}`;
    }).join('\n');

    const prompt = `You are a web developer generating a complete, functional website based on video frame analysis.

DETECTED COMPONENTS:
${componentDescriptions}

USER REQUIREMENTS:
${userRequirements || 'No specific requirements provided'}

INSTRUCTIONS:
1. Create a complete, modern, responsive website with separate HTML, CSS, and JavaScript files
2. Include ALL detected components with the functionality specified by the user
3. Use the user's answers to customize component behavior
4. Make the website visually appealing and functional
5. Use modern CSS (flexbox/grid) and vanilla JavaScript
6. Ensure all components are interactive and work as described

Return the code in this format:
===HTML===
[HTML code here]
===CSS===
[CSS code here]
===JS===
[JavaScript code here]

Generate code that matches the detected components and user requirements exactly.`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/codellama/CodeLlama-7b-Instruct-hf',
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 3000,
          temperature: 0.5,
          return_full_text: false,
          top_p: 0.95,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const generatedText = response.data[0]?.generated_text || '';
    
    if (!generatedText || generatedText.trim() === '') {
      throw new Error('Empty response from Hugging Face API');
    }
    
    // Extract HTML, CSS, and JS from the response
    const parsed = parseGeneratedCode(generatedText, components, responses);
    
    // Validate that we got actual generated code, not mock
    if (parsed.files[0].content.includes('My Website') && parsed.files[0].content.includes('Generated Website')) {
      throw new Error('Received generic template instead of generated code');
    }
    
    return parsed;
  } catch (error: any) {
    console.error('Hugging Face API error:', error);
    // Only fall back to mock if it's a non-critical error and no token
    if (!token || token === 'your_huggingface_token_here') {
      return generateMockCode(components, responses);
    }
    // If token is provided, throw the error so user knows it failed
    throw new Error(`Hugging Face API error: ${error.message || 'Failed to generate code'}`);
  }
}

function generateMockComponents(): DetectedComponent[] {
  return [
    {
      id: 'comp_1',
      type: 'button',
      label: 'Submit Button',
      description: 'Primary action button for form submission',
      confidence: 0.95,
      frameIndex: 0,
    },
    {
      id: 'comp_2',
      type: 'input',
      label: 'Email Input',
      description: 'Text input field for email address',
      confidence: 0.88,
      frameIndex: 0,
    },
    {
      id: 'comp_3',
      type: 'navigation',
      label: 'Main Navigation',
      description: 'Top navigation bar with menu items',
      confidence: 0.92,
      frameIndex: 0,
    },
  ];
}

function generateMockCode(
  components: DetectedComponent[],
  responses: Record<string, string>
): { code: string; files: Array<{ path: string; content: string; type: string }> } {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <h1 class="logo">My Website</h1>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <main class="container">
        <section class="hero">
            <h2>Welcome to Our Website</h2>
            <p>Transform your ideas into reality</p>
        </section>

        <form class="contact-form" id="contactForm">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" class="input-field" required>
            </div>
            <button type="submit" class="btn-primary">Submit</button>
        </form>
    </main>

    <script src="script.js"></script>
</body>
</html>`;

  const cssContent = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f5f5f5;
}

.navbar {
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1rem 0;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    color: #0ea5e9;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #0ea5e9;
}

.container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 2rem;
}

.hero {
    text-align: center;
    padding: 4rem 0;
    background: white;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #0ea5e9;
}

.contact-form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.input-field {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.input-field:focus {
    outline: none;
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.btn-primary {
    background: #0ea5e9;
    color: white;
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.btn-primary:hover {
    background: #0284c7;
}

@media (max-width: 768px) {
    .nav-container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .hero h2 {
        font-size: 2rem;
    }
}`;

  const jsContent = `document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            alert('Thank you! Your email ' + email + ' has been received.');
            form.reset();
        });
    }
});`;

  return {
    code: htmlContent,
    files: [
      { path: 'index.html', content: htmlContent, type: 'html' },
      { path: 'styles.css', content: cssContent, type: 'css' },
      { path: 'script.js', content: jsContent, type: 'js' },
    ],
  };
}

function parseGeneratedCode(
  text: string,
  components: DetectedComponent[],
  responses: Record<string, string>
): { code: string; files: Array<{ path: string; content: string; type: string }> } {
  let htmlContent = '';
  let cssContent = '';
  let jsContent = '';

  // Try multiple parsing strategies
  // Strategy 1: Look for ===HTML=== markers
  const htmlMarkerMatch = text.match(/===HTML===\s*([\s\S]*?)(?:===CSS===|===JS===|$)/i);
  const cssMarkerMatch = text.match(/===CSS===\s*([\s\S]*?)(?:===JS===|$)/i);
  const jsMarkerMatch = text.match(/===JS===\s*([\s\S]*?)$/i);

  if (htmlMarkerMatch) htmlContent = htmlMarkerMatch[1].trim();
  if (cssMarkerMatch) cssContent = cssMarkerMatch[1].trim();
  if (jsMarkerMatch) jsContent = jsMarkerMatch[1].trim();

  // Strategy 2: Look for code blocks
  if (!htmlContent) {
    const htmlCodeBlock = text.match(/```(?:html)?\s*([\s\S]*?)```/i) || text.match(/<html[\s\S]*?<\/html>/i);
    if (htmlCodeBlock) htmlContent = htmlCodeBlock[1]?.trim() || htmlCodeBlock[0];
  }

  if (!cssContent) {
    const cssCodeBlock = text.match(/```css\s*([\s\S]*?)```/i) || text.match(/<style>[\s\S]*?<\/style>/i);
    if (cssCodeBlock) cssCodeBlock[1] ? cssContent = cssCodeBlock[1].trim() : cssContent = cssCodeBlock[0];
  }

  if (!jsContent) {
    const jsCodeBlock = text.match(/```(?:javascript|js)\s*([\s\S]*?)```/i) || text.match(/<script>[\s\S]*?<\/script>/i);
    if (jsCodeBlock) jsCodeBlock[1] ? jsContent = jsCodeBlock[1].trim() : jsContent = jsCodeBlock[0];
  }

  // Strategy 3: Extract HTML from full document
  if (!htmlContent) {
    const fullHtmlMatch = text.match(/<!DOCTYPE[\s\S]*?<\/html>/i) || text.match(/<html[\s\S]*?<\/html>/i);
    if (fullHtmlMatch) {
      htmlContent = fullHtmlMatch[0];
      // Try to extract CSS and JS from the HTML
      const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/i);
      if (styleMatch) cssContent = styleMatch[1];
      const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/i);
      if (scriptMatch) jsContent = scriptMatch[1];
    }
  }

  // Strategy 4: Look for separate file sections
  if (!htmlContent && !cssContent && !jsContent) {
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent = '';
    
    for (const line of lines) {
      if (line.match(/html|HTML/)) {
        if (currentSection && currentContent) {
          if (currentSection === 'html') htmlContent = currentContent.trim();
          if (currentSection === 'css') cssContent = currentContent.trim();
          if (currentSection === 'js') jsContent = currentContent.trim();
        }
        currentSection = 'html';
        currentContent = '';
      } else if (line.match(/css|CSS/)) {
        if (currentSection && currentContent) {
          if (currentSection === 'html') htmlContent = currentContent.trim();
          if (currentSection === 'css') cssContent = currentContent.trim();
        }
        currentSection = 'css';
        currentContent = '';
      } else if (line.match(/javascript|js|JS/)) {
        if (currentSection && currentContent) {
          if (currentSection === 'html') htmlContent = currentContent.trim();
          if (currentSection === 'css') cssContent = currentContent.trim();
        }
        currentSection = 'js';
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    }
    
    // Save last section
    if (currentSection && currentContent) {
      if (currentSection === 'html') htmlContent = currentContent.trim();
      if (currentSection === 'css') cssContent = currentContent.trim();
      if (currentSection === 'js') jsContent = currentContent.trim();
    }
  }

  // Clean up extracted content
  htmlContent = htmlContent.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
  cssContent = cssContent.replace(/^```css\s*/i, '').replace(/\s*```$/i, '').trim();
  jsContent = jsContent.replace(/^```(?:javascript|js)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Validate we got actual content
  if (!htmlContent || htmlContent.length < 50) {
    throw new Error('Failed to extract valid HTML from generated code');
  }

  // If CSS or JS is missing, use minimal defaults but don't use mock
  if (!cssContent) {
    cssContent = '/* CSS will be generated based on your components */';
  }
  if (!jsContent) {
    jsContent = '// JavaScript will be generated based on your components';
  }

  return {
    code: htmlContent,
    files: [
      { path: 'index.html', content: htmlContent, type: 'html' },
      { path: 'styles.css', content: cssContent, type: 'css' },
      { path: 'script.js', content: jsContent, type: 'js' },
    ],
  };
}

