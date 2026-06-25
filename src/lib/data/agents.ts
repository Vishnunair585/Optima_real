export type AgentCategory =
  | "Customer Support"
  | "Research"
  | "Coding"
  | "Automation"
  | "Sales"
  | "Marketing"
  | "Data Analysis"
  | "Voice & Audio"
  | "Productivity"
  | "Finance"
  | "Legal"
  | "Healthcare"
  | "Education"
  | "DevOps"
  | "Security"
  | "Creative"
  | "E-commerce"
  | "HR & Recruiting";

export interface AgentEntry {
  name: string;
  cat: AgentCategory;
  desc: string;
  score: number;
  color: string;
  vendor?: string;
  pricing?: string;
  url?: string;
}

export const AGENT_CATEGORIES: AgentCategory[] = [
  "Customer Support",
  "Research",
  "Coding",
  "Automation",
  "Sales",
  "Marketing",
  "Data Analysis",
  "Voice & Audio",
  "Productivity",
  "Finance",
  "Legal",
  "Healthcare",
  "Education",
  "DevOps",
  "Security",
  "Creative",
  "E-commerce",
  "HR & Recruiting",
];

export const AI_AGENTS: AgentEntry[] = [
  // Frameworks & Orchestration
  { name: "CrewAI", cat: "Automation", desc: "Open-source multi-agent collaboration framework for orchestrating role-based AI teams.", score: 94, color: "oklch(0.72 0.2 295)", vendor: "CrewAI", pricing: "Free / Enterprise", url: "https://crewai.com" },
  { name: "LangChain", cat: "Coding", desc: "The most extensible toolkit for building LLM-powered agents, chains, and RAG pipelines.", score: 92, color: "oklch(0.78 0.16 155)", vendor: "LangChain", pricing: "Free / LangSmith", url: "https://langchain.com" },
  { name: "LangGraph", cat: "Coding", desc: "Stateful, graph-based agent orchestration built on LangChain for complex workflows.", score: 91, color: "oklch(0.76 0.17 160)", vendor: "LangChain", pricing: "Free", url: "https://langchain-ai.github.io/langgraph" },
  { name: "AutoGen", cat: "Research", desc: "Microsoft's multi-agent conversation framework for collaborative AI problem-solving.", score: 90, color: "oklch(0.74 0.18 220)", vendor: "Microsoft", pricing: "Free", url: "https://microsoft.github.io/autogen" },
  { name: "Semantic Kernel", cat: "Coding", desc: "Microsoft SDK for integrating AI agents into enterprise .NET, Python, and Java apps.", score: 88, color: "oklch(0.7 0.14 240)", vendor: "Microsoft", pricing: "Free", url: "https://learn.microsoft.com/semantic-kernel" },
  { name: "LlamaIndex", cat: "Research", desc: "Data framework for building RAG agents over private documents and knowledge bases.", score: 89, color: "oklch(0.8 0.14 80)", vendor: "LlamaIndex", pricing: "Free / Cloud", url: "https://llamaindex.ai" },
  { name: "Haystack", cat: "Research", desc: "Deepset's open-source framework for production NLP and retrieval-augmented agents.", score: 87, color: "oklch(0.75 0.16 200)", vendor: "Deepset", pricing: "Free", url: "https://haystack.deepset.ai" },
  { name: "Agno", cat: "Coding", desc: "Lightweight Python framework for building multimodal AI agents with memory and tools.", score: 86, color: "oklch(0.72 0.18 280)", vendor: "Agno", pricing: "Free", url: "https://agno.com" },
  { name: "Swarm", cat: "Coding", desc: "OpenAI's experimental lightweight multi-agent orchestration library.", score: 85, color: "oklch(0.78 0.16 155)", vendor: "OpenAI", pricing: "Free", url: "https://github.com/openai/swarm" },
  { name: "Phidata", cat: "Automation", desc: "Build AI agents with memory, knowledge, and tool use in Python.", score: 87, color: "oklch(0.74 0.16 195)", vendor: "Phidata", pricing: "Free", url: "https://phidata.com" },
  { name: "Superagent", cat: "Automation", desc: "Open-source framework and cloud platform for deploying AI assistants and agents.", score: 86, color: "oklch(0.7 0.15 220)", vendor: "Superagent", pricing: "Free / Cloud", url: "https://superagent.sh" },
  { name: "AgentOps", cat: "DevOps", desc: "Observability and debugging platform for monitoring AI agent sessions.", score: 84, color: "oklch(0.68 0.14 300)", vendor: "AgentOps", pricing: "Free tier", url: "https://agentops.ai" },

  // Customer Support
  { name: "Intercom Fin", cat: "Customer Support", desc: "AI-first customer service agent that resolves support tickets autonomously.", score: 93, color: "oklch(0.78 0.18 340)", vendor: "Intercom", pricing: "$0.99/resolution", url: "https://intercom.com/fin" },
  { name: "Ada", cat: "Customer Support", desc: "Enterprise AI agent platform for automated customer experience at scale.", score: 91, color: "oklch(0.74 0.18 220)", vendor: "Ada", pricing: "Enterprise", url: "https://ada.cx" },
  { name: "Forethought", cat: "Customer Support", desc: "AI agent that triages, resolves, and assists support teams across channels.", score: 89, color: "oklch(0.72 0.16 260)", vendor: "Forethought", pricing: "Enterprise", url: "https://forethought.ai" },
  { name: "Decagon", cat: "Customer Support", desc: "Generative AI agents for enterprise customer support with deep integrations.", score: 88, color: "oklch(0.76 0.16 180)", vendor: "Decagon", pricing: "Enterprise", url: "https://decagon.ai" },
  { name: "Sierra", cat: "Customer Support", desc: "Conversational AI agents built by former Google/Square leaders for brands.", score: 90, color: "oklch(0.8 0.14 80)", vendor: "Sierra", pricing: "Enterprise", url: "https://sierra.ai" },
  { name: "Vapi", cat: "Voice & Audio", desc: "Build and deploy voice AI agents for phone support in minutes.", score: 89, color: "oklch(0.78 0.18 340)", vendor: "Vapi", pricing: "Usage-based", url: "https://vapi.ai" },
  { name: "Bland AI", cat: "Voice & Audio", desc: "Phone-call AI agents for outbound and inbound voice automation.", score: 87, color: "oklch(0.74 0.16 195)", vendor: "Bland AI", pricing: "Usage-based", url: "https://bland.ai" },
  { name: "Retell AI", cat: "Voice & Audio", desc: "Real-time voice agents with low latency for customer service calls.", score: 88, color: "oklch(0.72 0.18 280)", vendor: "Retell", pricing: "Usage-based", url: "https://retellai.com" },
  { name: "PolyAI", cat: "Voice & Audio", desc: "Enterprise voice assistants for contact centers with natural conversations.", score: 90, color: "oklch(0.7 0.14 240)", vendor: "PolyAI", pricing: "Enterprise", url: "https://poly.ai" },
  { name: "Zendesk AI Agents", cat: "Customer Support", desc: "Autonomous support agents integrated into the Zendesk customer service suite.", score: 87, color: "oklch(0.82 0.16 80)", vendor: "Zendesk", pricing: "Add-on", url: "https://zendesk.com" },
  { name: "Freshworks Freddy", cat: "Customer Support", desc: "AI copilot and autonomous agents for Freshdesk and Freshservice.", score: 85, color: "oklch(0.78 0.16 40)", vendor: "Freshworks", pricing: "Add-on", url: "https://freshworks.com" },
  { name: "Kore.ai", cat: "Customer Support", desc: "Enterprise conversational AI platform for contact center automation.", score: 88, color: "oklch(0.74 0.18 220)", vendor: "Kore.ai", pricing: "Enterprise", url: "https://kore.ai" },

  // Sales & Marketing
  { name: "Relevance AI", cat: "Sales", desc: "No-code platform to build an AI workforce for sales, ops, and research.", score: 88, color: "oklch(0.82 0.16 80)", vendor: "Relevance AI", pricing: "Free tier", url: "https://relevanceai.com" },
  { name: "11x", cat: "Sales", desc: "Digital workers — Alice for outbound sales and Jordan for inbound SDR.", score: 89, color: "oklch(0.76 0.16 180)", vendor: "11x", pricing: "Enterprise", url: "https://11x.ai" },
  { name: "Artisan", cat: "Sales", desc: "AI BDR agent Ava that automates outbound prospecting and follow-ups.", score: 87, color: "oklch(0.72 0.2 295)", vendor: "Artisan", pricing: "Subscription", url: "https://artisan.co" },
  { name: "Claygent", cat: "Sales", desc: "AI research agent inside Clay for enriching leads and personalizing outreach.", score: 86, color: "oklch(0.78 0.16 155)", vendor: "Clay", pricing: "Clay add-on", url: "https://clay.com" },
  { name: "Regie.ai", cat: "Sales", desc: "AI agents for sales engagement, content generation, and pipeline automation.", score: 85, color: "oklch(0.74 0.16 195)", vendor: "Regie.ai", pricing: "Team plans", url: "https://regie.ai" },
  { name: "Lindy", cat: "Marketing", desc: "Personal AI employees that automate marketing ops, email, and scheduling.", score: 86, color: "oklch(0.74 0.16 195)", vendor: "Lindy", pricing: "$20/mo", url: "https://lindy.ai" },
  { name: "Jasper Agents", cat: "Marketing", desc: "Marketing-focused AI agents for campaign creation, SEO, and brand content.", score: 87, color: "oklch(0.75 0.18 280)", vendor: "Jasper", pricing: "Business plan", url: "https://jasper.ai" },
  { name: "Copy.ai GTM Agents", cat: "Marketing", desc: "Go-to-market AI agents for content, prospecting, and workflow automation.", score: 85, color: "oklch(0.78 0.18 140)", vendor: "Copy.ai", pricing: "Team plans", url: "https://copy.ai" },
  { name: "Mutiny", cat: "Marketing", desc: "AI-powered website personalization agent for B2B conversion optimization.", score: 84, color: "oklch(0.72 0.16 260)", vendor: "Mutiny", pricing: "Enterprise", url: "https://mutiny.com" },
  { name: "Persado", cat: "Marketing", desc: "AI agent that generates and optimizes marketing language for maximum engagement.", score: 86, color: "oklch(0.8 0.14 120)", vendor: "Persado", pricing: "Enterprise", url: "https://persado.com" },

  // Research
  { name: "Perplexity Pro Search", cat: "Research", desc: "Multi-step research agent that searches, reads, and synthesizes sources.", score: 93, color: "oklch(0.78 0.14 195)", vendor: "Perplexity", pricing: "$20/mo", url: "https://perplexity.ai" },
  { name: "Elicit", cat: "Research", desc: "AI research assistant that automates literature review and paper analysis.", score: 89, color: "oklch(0.65 0.14 270)", vendor: "Elicit", pricing: "$12/mo", url: "https://elicit.com" },
  { name: "Consensus", cat: "Research", desc: "AI-powered search engine for scientific research papers and evidence.", score: 90, color: "oklch(0.7 0.12 240)", vendor: "Consensus", pricing: "$8/mo", url: "https://consensus.app" },
  { name: "Cognosys", cat: "Research", desc: "Autonomous web research agent that plans and executes multi-step investigations.", score: 85, color: "oklch(0.72 0.2 295)", vendor: "Cognosys", pricing: "Free", url: "https://cognosys.ai" },
  { name: "GPT Researcher", cat: "Research", desc: "Open-source autonomous research agent that produces detailed reports.", score: 87, color: "oklch(0.76 0.16 180)", vendor: "Community", pricing: "Free", url: "https://github.com/assafelovic/gpt-researcher" },
  { name: "Storm (Stanford)", cat: "Research", desc: "LLM system that researches topics and generates Wikipedia-style articles.", score: 86, color: "oklch(0.8 0.12 60)", vendor: "Stanford", pricing: "Free", url: "https://storm.genie.stanford.edu" },
  { name: "Scite Assistant", cat: "Research", desc: "AI research agent with Smart Citations for verifying scientific claims.", score: 84, color: "oklch(0.74 0.16 195)", vendor: "Scite", pricing: "Subscription", url: "https://scite.ai" },
  { name: "Semantic Scholar", cat: "Research", desc: "AI-powered academic search with TLDR summaries and citation analysis.", score: 88, color: "oklch(0.7 0.14 240)", vendor: "Allen AI", pricing: "Free", url: "https://semanticscholar.org" },
  { name: "NotebookLM", cat: "Research", desc: "Google's AI notebook that analyzes your documents and generates insights.", score: 93, color: "oklch(0.74 0.18 220)", vendor: "Google", pricing: "Free", url: "https://notebooklm.google.com" },

  // Coding & Dev
  { name: "Devin", cat: "Coding", desc: "Autonomous AI software engineer that plans, codes, and deploys full projects.", score: 92, color: "oklch(0.6 0.18 100)", vendor: "Cognition", pricing: "Enterprise", url: "https://cognition.ai" },
  { name: "Cursor Agent", cat: "Coding", desc: "Agentic coding mode in Cursor that autonomously edits multi-file codebases.", score: 95, color: "oklch(0.85 0.15 80)", vendor: "Anysphere", pricing: "$20/mo", url: "https://cursor.com" },
  { name: "Replit Agent", cat: "Coding", desc: "AI agent that builds full-stack apps from natural language descriptions.", score: 89, color: "oklch(0.78 0.16 40)", vendor: "Replit", pricing: "$25/mo", url: "https://replit.com" },
  { name: "GitHub Copilot Workspace", cat: "Coding", desc: "Agentic development environment for planning and implementing features.", score: 91, color: "oklch(0.6 0.15 250)", vendor: "GitHub", pricing: "Copilot+", url: "https://github.com/features/copilot" },
  { name: "OpenHands", cat: "Coding", desc: "Open-source AI software developer agent (formerly OpenDevin).", score: 88, color: "oklch(0.72 0.18 280)", vendor: "All Hands AI", pricing: "Free", url: "https://all-hands.dev" },
  { name: "Sweep AI", cat: "Coding", desc: "AI junior developer that handles GitHub issues and generates pull requests.", score: 86, color: "oklch(0.74 0.16 195)", vendor: "Sweep", pricing: "Free tier", url: "https://sweep.dev" },
  { name: "Codegen", cat: "Coding", desc: "AI agent that autonomously resolves Jira tickets and creates PRs.", score: 85, color: "oklch(0.76 0.16 180)", vendor: "Codegen", pricing: "Team plans", url: "https://codegen.com" },
  { name: "Factory", cat: "Coding", desc: "Droids — specialized AI agents for coding, testing, and DevOps tasks.", score: 87, color: "oklch(0.7 0.14 240)", vendor: "Factory", pricing: "Enterprise", url: "https://factory.ai" },
  { name: "Aider", cat: "Coding", desc: "Open-source terminal pair programmer that edits code in your local repo.", score: 88, color: "oklch(0.78 0.16 155)", vendor: "Community", pricing: "Free", url: "https://aider.chat" },
  { name: "Continue Dev", cat: "Coding", desc: "Open-source AI coding assistant with custom agent configurations.", score: 86, color: "oklch(0.74 0.18 220)", vendor: "Continue", pricing: "Free", url: "https://continue.dev" },
  { name: "Cline", cat: "Coding", desc: "VS Code extension with autonomous agent that can use terminal and browser.", score: 87, color: "oklch(0.72 0.2 295)", vendor: "Cline", pricing: "Free", url: "https://cline.bot" },
  { name: "Windsurf Cascade", cat: "Coding", desc: "Agentic IDE flow that autonomously navigates and edits your codebase.", score: 93, color: "oklch(0.74 0.16 195)", vendor: "Codeium", pricing: "$15/mo", url: "https://codeium.com/windsurf" },
  { name: "Bolt.new", cat: "Coding", desc: "StackBlitz agent that builds and deploys full-stack web apps in browser.", score: 92, color: "oklch(0.82 0.16 80)", vendor: "StackBlitz", pricing: "$20/mo", url: "https://bolt.new" },
  { name: "Lovable", cat: "Coding", desc: "AI full-stack engineer that builds production apps from prompts.", score: 97, color: "oklch(0.78 0.18 340)", vendor: "Lovable", pricing: "$25/mo", url: "https://lovable.dev" },

  // Automation & Workflow
  { name: "n8n", cat: "Automation", desc: "Self-hosted workflow automation with 400+ integrations and AI agent nodes.", score: 90, color: "oklch(0.78 0.16 20)", vendor: "n8n", pricing: "Free / Cloud", url: "https://n8n.io" },
  { name: "Zapier Central", cat: "Automation", desc: "AI-powered automation bots that work across 7,000+ app integrations.", score: 90, color: "oklch(0.82 0.18 100)", vendor: "Zapier", pricing: "$20/mo", url: "https://zapier.com/central" },
  { name: "Make AI Agents", cat: "Automation", desc: "Visual automation platform with AI modules for intelligent workflows.", score: 89, color: "oklch(0.74 0.18 220)", vendor: "Make", pricing: "$9/mo", url: "https://make.com" },
  { name: "Flowise", cat: "Automation", desc: "Low-code drag-and-drop tool for building LLM agents and chatflows.", score: 86, color: "oklch(0.7 0.1 140)", vendor: "Flowise", pricing: "Free", url: "https://flowiseai.com" },
  { name: "Langflow", cat: "Automation", desc: "Visual IDE for building and deploying LangChain-powered AI agents.", score: 87, color: "oklch(0.72 0.12 280)", vendor: "Langflow", pricing: "Free", url: "https://langflow.org" },
  { name: "Dify", cat: "Automation", desc: "Open-source LLM app development platform with agent and workflow builder.", score: 88, color: "oklch(0.76 0.16 180)", vendor: "Dify", pricing: "Free / Cloud", url: "https://dify.ai" },
  { name: "Stack AI", cat: "Automation", desc: "No-code platform for deploying AI agents to automate business workflows.", score: 85, color: "oklch(0.74 0.16 195)", vendor: "Stack AI", pricing: "Team plans", url: "https://stack-ai.com" },
  { name: "Beam AI", cat: "Automation", desc: "Self-learning AI agents for back-office automation and process optimization.", score: 86, color: "oklch(0.72 0.18 280)", vendor: "Beam", pricing: "Enterprise", url: "https://beam.ai" },
  { name: "Bardeen", cat: "Automation", desc: "AI automation agent for browser-based workflows and data scraping.", score: 84, color: "oklch(0.8 0.14 80)", vendor: "Bardeen", pricing: "Free tier", url: "https://bardeen.ai" },
  { name: "Induced AI", cat: "Automation", desc: "Browser-native AI agents that automate web-based business processes.", score: 85, color: "oklch(0.76 0.16 180)", vendor: "Induced", pricing: "Enterprise", url: "https://induced.ai" },
  { name: "MultiOn", cat: "Automation", desc: "AI web agent that browses and interacts with websites on your behalf.", score: 84, color: "oklch(0.78 0.16 155)", vendor: "MultiOn", pricing: "Free tier", url: "https://multion.ai" },
  { name: "Adept ACT-1", cat: "Automation", desc: "AI agent that uses software tools like a human — click, type, and navigate.", score: 87, color: "oklch(0.72 0.2 295)", vendor: "Adept", pricing: "Enterprise", url: "https://adept.ai" },

  // Data Analysis
  { name: "Julius AI", cat: "Data Analysis", desc: "AI data analyst agent that cleans, analyzes, and visualizes datasets.", score: 94, color: "oklch(0.78 0.16 150)", vendor: "Julius", pricing: "$20/mo", url: "https://julius.ai" },
  { name: "Akkio", cat: "Data Analysis", desc: "No-code AI platform for predictive analytics and data agent workflows.", score: 88, color: "oklch(0.7 0.15 220)", vendor: "Akkio", pricing: "$49/mo", url: "https://akkio.com" },
  { name: "Obviously AI", cat: "Data Analysis", desc: "AutoML agent that builds predictive models without coding.", score: 85, color: "oklch(0.74 0.16 195)", vendor: "Obviously AI", pricing: "Team plans", url: "https://obviously.ai" },
  { name: "Hex Magic", cat: "Data Analysis", desc: "AI agent inside Hex notebooks for SQL, Python, and data exploration.", score: 87, color: "oklch(0.72 0.18 280)", vendor: "Hex", pricing: "Team plans", url: "https://hex.tech" },
  { name: "Tableau Pulse", cat: "Data Analysis", desc: "AI agent that proactively surfaces insights from your business data.", score: 86, color: "oklch(0.78 0.16 40)", vendor: "Salesforce", pricing: "Tableau add-on", url: "https://tableau.com" },
  { name: "ThoughtSpot Sage", cat: "Data Analysis", desc: "Natural language AI analyst for querying and visualizing business data.", score: 88, color: "oklch(0.76 0.16 180)", vendor: "ThoughtSpot", pricing: "Enterprise", url: "https://thoughtspot.com" },
  { name: "Rows AI", cat: "Data Analysis", desc: "Spreadsheet with built-in AI agents for data enrichment and analysis.", score: 89, color: "oklch(0.75 0.18 100)", vendor: "Rows", pricing: "Free", url: "https://rows.com" },

  // Productivity
  { name: "Microsoft Copilot", cat: "Productivity", desc: "AI agent across Microsoft 365 — Word, Excel, Teams, and Outlook.", score: 91, color: "oklch(0.6 0.15 250)", vendor: "Microsoft", pricing: "$30/mo", url: "https://copilot.microsoft.com" },
  { name: "Google Gemini Advanced", cat: "Productivity", desc: "Google's most capable AI agent with Deep Research and Workspace integration.", score: 92, color: "oklch(0.74 0.18 220)", vendor: "Google", pricing: "$20/mo", url: "https://gemini.google.com" },
  { name: "ChatGPT Agent", cat: "Productivity", desc: "OpenAI's agent mode that browses the web and executes multi-step tasks.", score: 94, color: "oklch(0.78 0.16 155)", vendor: "OpenAI", pricing: "Pro plan", url: "https://chatgpt.com" },
  { name: "Claude Computer Use", cat: "Productivity", desc: "Anthropic's agent that can view and interact with computer interfaces.", score: 91, color: "oklch(0.78 0.14 40)", vendor: "Anthropic", pricing: "API / Pro", url: "https://anthropic.com" },
  { name: "Notion AI", cat: "Productivity", desc: "AI agent embedded in Notion for writing, summarizing, and Q&A over workspace.", score: 87, color: "oklch(0.82 0.005 270)", vendor: "Notion", pricing: "$10/mo add-on", url: "https://notion.so/product/ai" },
  { name: "Motion", cat: "Productivity", desc: "AI scheduling agent that auto-plans your day and manages tasks.", score: 86, color: "oklch(0.74 0.16 195)", vendor: "Motion", pricing: "$19/mo", url: "https://usemotion.com" },
  { name: "Reclaim.ai", cat: "Productivity", desc: "AI calendar agent that defends focus time and schedules meetings.", score: 85, color: "oklch(0.72 0.18 280)", vendor: "Reclaim", pricing: "Free tier", url: "https://reclaim.ai" },
  { name: "Taskade AI Agents", cat: "Productivity", desc: "Custom AI agents for project management, writing, and team workflows.", score: 84, color: "oklch(0.76 0.16 180)", vendor: "Taskade", pricing: "Free tier", url: "https://taskade.com" },

  // Finance
  { name: "Kensho", cat: "Finance", desc: "S&P Global's AI agent for financial research, analytics, and document analysis.", score: 90, color: "oklch(0.74 0.18 220)", vendor: "S&P Global", pricing: "Enterprise", url: "https://kensho.com" },
  { name: "AlphaSense", cat: "Finance", desc: "AI market intelligence agent for investment research and earnings analysis.", score: 91, color: "oklch(0.78 0.16 40)", vendor: "AlphaSense", pricing: "Enterprise", url: "https://alpha-sense.com" },
  { name: "Hebbia", cat: "Finance", desc: "AI agent for analyzing complex financial documents and due diligence.", score: 89, color: "oklch(0.72 0.2 295)", vendor: "Hebbia", pricing: "Enterprise", url: "https://hebbia.ai" },
  { name: "Bloomberg GPT", cat: "Finance", desc: "Finance-tuned LLM agent for market data analysis and financial NLP.", score: 88, color: "oklch(0.82 0.16 80)", vendor: "Bloomberg", pricing: "Terminal", url: "https://bloomberg.com" },
  { name: "Trullion", cat: "Finance", desc: "AI agent for accounting automation, lease accounting, and audit prep.", score: 85, color: "oklch(0.76 0.16 180)", vendor: "Trullion", pricing: "Enterprise", url: "https://trullion.com" },
  { name: "Pilot AI", cat: "Finance", desc: "AI-powered bookkeeping agent for startups and small businesses.", score: 84, color: "oklch(0.74 0.16 195)", vendor: "Pilot", pricing: "Subscription", url: "https://pilot.com" },

  // Legal
  { name: "Harvey", cat: "Legal", desc: "AI legal agent for contract analysis, due diligence, and legal research.", score: 91, color: "oklch(0.72 0.2 295)", vendor: "Harvey", pricing: "Enterprise", url: "https://harvey.ai" },
  { name: "CoCounsel", cat: "Legal", desc: "Thomson Reuters AI legal assistant for research and document review.", score: 90, color: "oklch(0.74 0.18 220)", vendor: "Thomson Reuters", pricing: "Enterprise", url: "https://casetext.com/cocounsel" },
  { name: "Robin AI", cat: "Legal", desc: "AI agent that drafts, reviews, and negotiates contracts autonomously.", score: 87, color: "oklch(0.78 0.18 340)", vendor: "Robin AI", pricing: "Enterprise", url: "https://robinai.com" },
  { name: "Luminance", cat: "Legal", desc: "AI for legal due diligence, contract analysis, and compliance review.", score: 86, color: "oklch(0.76 0.16 180)", vendor: "Luminance", pricing: "Enterprise", url: "https://luminance.com" },
  { name: "Spellbook", cat: "Legal", desc: "AI contract drafting agent integrated into Microsoft Word.", score: 85, color: "oklch(0.8 0.14 80)", vendor: "Spellbook", pricing: "Subscription", url: "https://spellbook.legal" },

  // Healthcare
  { name: "Abridge", cat: "Healthcare", desc: "AI agent that listens to clinical conversations and generates medical notes.", score: 91, color: "oklch(0.74 0.18 220)", vendor: "Abridge", pricing: "Enterprise", url: "https://abridge.com" },
  { name: "Ambience Healthcare", cat: "Healthcare", desc: "AI medical scribe agent for ambient clinical documentation.", score: 90, color: "oklch(0.72 0.16 260)", vendor: "Ambience", pricing: "Enterprise", url: "https://ambiencehealthcare.com" },
  { name: "Hippocratic AI", cat: "Healthcare", desc: "Safety-focused healthcare LLM agent for patient-facing non-diagnostic tasks.", score: 88, color: "oklch(0.76 0.16 180)", vendor: "Hippocratic AI", pricing: "Enterprise", url: "https://hippocraticai.com" },
  { name: "Nabla Copilot", cat: "Healthcare", desc: "AI clinical assistant that generates structured notes from consultations.", score: 87, color: "oklch(0.78 0.16 155)", vendor: "Nabla", pricing: "Enterprise", url: "https://nabla.com" },
  { name: "Glass Health", cat: "Healthcare", desc: "AI diagnostic reasoning agent for clinicians and medical students.", score: 85, color: "oklch(0.74 0.16 195)", vendor: "Glass Health", pricing: "Free tier", url: "https://glass.health" },

  // Education
  { name: "Khanmigo", cat: "Education", desc: "Khan Academy's AI tutor agent powered by GPT for personalized learning.", score: 89, color: "oklch(0.82 0.16 80)", vendor: "Khan Academy", pricing: "$4/mo", url: "https://khanacademy.org/khanmigo" },
  { name: "Duolingo Max", cat: "Education", desc: "AI conversation agent for language learning with real-time feedback.", score: 88, color: "oklch(0.78 0.18 140)", vendor: "Duolingo", pricing: "Max plan", url: "https://duolingo.com" },
  { name: "Synthesis Tutor", cat: "Education", desc: "AI math tutor agent that adapts to each student's learning pace.", score: 86, color: "oklch(0.74 0.18 220)", vendor: "Synthesis", pricing: "Subscription", url: "https://synthesis.com" },
  { name: "Quizlet Q-Chat", cat: "Education", desc: "AI study coach agent that uses Socratic method for test preparation.", score: 84, color: "oklch(0.72 0.2 295)", vendor: "Quizlet", pricing: "Plus plan", url: "https://quizlet.com" },
  { name: "Gradescope AI", cat: "Education", desc: "AI grading agent that assists instructors with assessment and feedback.", score: 85, color: "oklch(0.76 0.16 180)", vendor: "Turnitin", pricing: "Institutional", url: "https://gradescope.com" },

  // DevOps & Security
  { name: "Devin (Security)", cat: "Security", desc: "AI agent for automated security code review and vulnerability patching.", score: 87, color: "oklch(0.68 0.14 300)", vendor: "Various", pricing: "Varies", url: "https://snyk.io" },
  { name: "Snyk AI", cat: "Security", desc: "AI-powered agent for finding and fixing vulnerabilities in code and dependencies.", score: 88, color: "oklch(0.72 0.18 280)", vendor: "Snyk", pricing: "Free tier", url: "https://snyk.io" },
  { name: "Wiz AI", cat: "Security", desc: "Cloud security agent that identifies and prioritizes risks across cloud infra.", score: 90, color: "oklch(0.74 0.18 220)", vendor: "Wiz", pricing: "Enterprise", url: "https://wiz.io" },
  { name: "PagerDuty AIOps", cat: "DevOps", desc: "AI agent for incident detection, triage, and automated remediation.", score: 87, color: "oklch(0.78 0.16 40)", vendor: "PagerDuty", pricing: "Enterprise", url: "https://pagerduty.com" },
  { name: "Datadog Bits AI", cat: "DevOps", desc: "AI SRE agent for monitoring, root cause analysis, and incident response.", score: 89, color: "oklch(0.76 0.16 180)", vendor: "Datadog", pricing: "Enterprise", url: "https://datadoghq.com" },
  { name: "Harness AI DevOps", cat: "DevOps", desc: "AI agents for CI/CD pipeline optimization and deployment automation.", score: 86, color: "oklch(0.72 0.16 260)", vendor: "Harness", pricing: "Enterprise", url: "https://harness.io" },

  // Creative
  { name: "Midjourney", cat: "Creative", desc: "AI creative agent for generating photorealistic and artistic images.", score: 95, color: "oklch(0.72 0.2 295)", vendor: "Midjourney", pricing: "$10/mo", url: "https://midjourney.com" },
  { name: "Runway Gen-3", cat: "Creative", desc: "AI video generation agent for creative production and editing.", score: 92, color: "oklch(0.78 0.18 340)", vendor: "Runway", pricing: "$15/mo", url: "https://runwayml.com" },
  { name: "Sora", cat: "Creative", desc: "OpenAI's text-to-video agent for cinematic content generation.", score: 94, color: "oklch(0.78 0.16 155)", vendor: "OpenAI", pricing: "Enterprise", url: "https://openai.com/sora" },
  { name: "Pika", cat: "Creative", desc: "AI video agent for short-form content creation and animation.", score: 88, color: "oklch(0.8 0.14 120)", vendor: "Pika Labs", pricing: "$10/mo", url: "https://pika.art" },
  { name: "Suno", cat: "Creative", desc: "AI music agent that generates full songs from text descriptions.", score: 94, color: "oklch(0.8 0.14 80)", vendor: "Suno", pricing: "$8/mo", url: "https://suno.com" },
  { name: "ElevenLabs Agents", cat: "Creative", desc: "Conversational AI voice agents with ultra-realistic speech synthesis.", score: 96, color: "oklch(0.74 0.18 220)", vendor: "ElevenLabs", pricing: "$5/mo", url: "https://elevenlabs.io" },
  { name: "Canva Magic Studio", cat: "Creative", desc: "AI design agents for graphics, presentations, and brand content.", score: 87, color: "oklch(0.78 0.18 340)", vendor: "Canva", pricing: "Pro plan", url: "https://canva.com" },

  // E-commerce
  { name: "Shopify Sidekick", cat: "E-commerce", desc: "AI commerce agent for store management, analytics, and marketing.", score: 88, color: "oklch(0.78 0.16 155)", vendor: "Shopify", pricing: "Shopify plan", url: "https://shopify.com" },
  { name: "Gorgias AI Agent", cat: "E-commerce", desc: "AI support agent purpose-built for e-commerce customer service.", score: 87, color: "oklch(0.74 0.16 195)", vendor: "Gorgias", pricing: "Add-on", url: "https://gorgias.com" },
  { name: "Tidio Lyro", cat: "E-commerce", desc: "AI chatbot agent that resolves up to 70% of customer inquiries automatically.", score: 85, color: "oklch(0.76 0.16 180)", vendor: "Tidio", pricing: "Add-on", url: "https://tidio.com" },
  { name: "Octane AI", cat: "E-commerce", desc: "AI quiz and personalization agent for Shopify product recommendations.", score: 84, color: "oklch(0.72 0.18 280)", vendor: "Octane AI", pricing: "Shopify app", url: "https://octaneai.com" },

  // HR & Recruiting
  { name: "Paradox Olivia", cat: "HR & Recruiting", desc: "AI recruiting assistant that screens, schedules, and engages candidates.", score: 89, color: "oklch(0.74 0.18 220)", vendor: "Paradox", pricing: "Enterprise", url: "https://paradox.ai" },
  { name: "Eightfold AI", cat: "HR & Recruiting", desc: "Talent intelligence agent for hiring, retention, and workforce planning.", score: 90, color: "oklch(0.72 0.2 295)", vendor: "Eightfold", pricing: "Enterprise", url: "https://eightfold.ai" },
  { name: "HireVue AI", cat: "HR & Recruiting", desc: "AI interviewing agent for structured candidate assessment at scale.", score: 86, color: "oklch(0.78 0.16 40)", vendor: "HireVue", pricing: "Enterprise", url: "https://hirevue.com" },
  { name: "Fetcher", cat: "HR & Recruiting", desc: "AI sourcing agent that finds and engages passive candidates automatically.", score: 85, color: "oklch(0.76 0.16 180)", vendor: "Fetcher", pricing: "Subscription", url: "https://fetcher.ai" },
  { name: "Textio", cat: "HR & Recruiting", desc: "AI writing agent that optimizes job descriptions for inclusive hiring.", score: 84, color: "oklch(0.8 0.14 80)", vendor: "Textio", pricing: "Team plans", url: "https://textio.com" },
  { name: "Beamery AI", cat: "HR & Recruiting", desc: "Talent lifecycle agent for CRM, sourcing, and workforce analytics.", score: 87, color: "oklch(0.74 0.16 195)", vendor: "Beamery", pricing: "Enterprise", url: "https://beamery.com" },
];

export const AGENT_COUNT = AI_AGENTS.length;
