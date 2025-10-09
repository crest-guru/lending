import React, { useState } from 'react';
import { 
  Shield, 
  Zap, 
  Eye, 
  Settings, 
  Users, 
  Lock, 
  Coins, 
  ChevronRight,
  Check,
  Mail,
  Building,
  DollarSign,
  MessageCircle,
  CheckCircle,
  ExternalLink,
  Bot,
  FileCheck,
  Layers,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { sendToNotion } from './api';

function App() {
  const [formData, setFormData] = useState({
    email: '',
    isTreasurer: false,
    organization: '',
    assets: '',
    handle: '',
    betaAgreed: false,
    privacyAgreed: false
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.betaAgreed && formData.privacyAgreed && formData.email) {
      setIsLoading(true);
      setError(null);
      
      try {
        // Собираем все данные из формы и отправляем в Notion
        const submissionData = {
          email: formData.email,
          treasuary: formData.isTreasurer ? 'I manage a treasury / DAO / family office / fund' : '',
          organisation: formData.organization,
          assets: formData.assets,
          tg: formData.handle,
          comment: ''
        };
        
        await sendToNotion(submissionData);
        setIsSubmitted(true);
      } catch (err) {
        setError('ERROR: Failed to submit form');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const NodeDot = ({ className = "" }: { className?: string }) => (
    <div className={`w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse ${className}`} />
  );

  const ConnectionLine = ({ className = "" }: { className?: string }) => (
    <div className={`h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-30 ${className}`} />
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden" style={{ userSelect: 'text' }}>
      {/* Background Network Pattern */}
      <div className="fixed inset-0 opacity-10" style={{ pointerEvents: 'none' }}>
        <div className="absolute top-20 left-10">
          <div className="flex items-center space-x-8">
            <NodeDot />
            <ConnectionLine className="w-16" />
            <NodeDot />
            <ConnectionLine className="w-12" />
            <NodeDot />
          </div>
        </div>
        <div className="absolute top-40 right-20">
          <div className="flex flex-col items-center space-y-6">
            <NodeDot />
            <ConnectionLine className="w-px h-12 bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
            <NodeDot />
          </div>
        </div>
        <div className="absolute bottom-32 left-32">
          <div className="flex items-center space-x-6">
            <NodeDot />
            <ConnectionLine className="w-20" />
            <NodeDot />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-cyan-500/20" style={{ pointerEvents: 'none' }} />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full">
              <img src="/AII.png" alt="AII Logo" className="w-[72px] h-[72px]" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Partially Delegate Treasury Management to AI
            </span>
          </h1>
          
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-300">
            No Multisig or Hardware Wallet Friction. On‑Chain Enforced Limits.
          </h2>
          
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
            AII (Artificial Intelligent Interface) lets you run AI agents that <em className="text-cyan-400">cannot</em> operate 
            outside blockchain-verified rules. No hallucinations. No black boxes. Full on-chain accountability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => document.getElementById('whitelist-form')?.scrollIntoView({behavior: 'smooth'})}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-semibold text-lg hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25">
              Join the Whitelist
            </button>
            <a
              href="/bridge"
              className="px-8 py-4 rounded-lg border border-cyan-400/50 text-cyan-300 font-semibold text-lg transition-all duration-300 hover:border-cyan-300 hover:text-cyan-200"
            >
              Open Token Bridge
            </a>
            <a href="#security" className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
              Read our Security Assurance
              <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </section>

      {/* DeFi Treasurers Strip */}
      <section className="py-8 px-6 border-y border-gray-800 bg-gradient-to-r from-blue-900/20 to-cyan-900/20">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 text-blue-300">Built for DeFi Treasurers</h3>
          <p className="text-lg text-gray-300">
            Programmable roles, hard spend caps, contract functions rules, verifiable execution. 
            Delegate operations without losing control.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Settings,
                title: "Set on-chain policy limits",
                description: "Define roles, spend caps, whitelists, and approved strategies."
              },
              {
                icon: Bot,
                title: "Let the AI act inside the box",
                description: "Your agent executes only what your policy allows — everything else is blocked."
              },
              {
                icon: Eye,
                title: "Monitor & verify every move",
                description: "Every transaction is provable on-chain. Get full transparency and auditability."
              },
              {
                icon: Zap,
                title: "Trigger execution any way you prefer",
                description: "UI click, API call, webhook, cron, on-chain signal, or manual or audio command — your on-chain policy still enforces the limits."
              }
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 h-full">
                  <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 w-fit">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-blue-300">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-cyan-400 opacity-50" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => document.getElementById('whitelist-form')?.scrollIntoView({behavior: 'smooth'})}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all duration-300">
              Join the Whitelist
            </button>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Key Features
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Blockchain-Level AI Verification",
                description: "Hard execution boundaries enforced by smart contracts."
              },
              {
                icon: Users,
                title: "Simple AI Assistant UX",
                description: "Powerful automation without operational overload."
              },
              {
                icon: Lock,
                title: "Treasury-Grade Access Control",
                description: "Roles, permissions, spending limits, and safe operations for teams, family offices, or DAOs."
              },
              {
                icon: Layers,
                title: "Battle-Tested Foundations",
                description: "Built on OpenZeppelin, Safe, and Cobo Argus–grade primitives."
              },
              {
                icon: FileCheck,
                title: "Open, Transparent Ethos",
                description: "We communicate clearly, publish what matters, and ship visibly."
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600 hover:border-cyan-500/50 transition-all duration-300 group">
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 w-fit group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-blue-300">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Assurance */}
      <section id="security" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Security Assurance
            </span>
          </h2>
          
          <div className="space-y-6">
            {[
              "Battle-tested contracts only: OpenZeppelin, Safe, Cobo Argus.",
              "Hard-coded rules mean your AI can't hallucinate with your funds.",
              "Experimental, in beta: high transparency, explicit limits, constant audits and reviews as we evolve.",
              "On-chain proofs, not promises: all agent actions are policy-checked and publicly verifiable."
            ].map((point, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-gradient-to-r from-green-900/20 to-cyan-900/20 border border-green-800/30">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AII Token */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              The AII Token
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Utility",
                description: "Access to premium product features, reduced fees, and priority support."
              },
              {
                icon: Users,
                title: "Governance",
                description: "Help define what agents can and cannot do. Vote on roadmap priorities and policy templates."
              },
              {
                icon: Coins,
                title: "Community Incentives",
                description: "Rewards for early participation, security contributions, and policy/module authors."
              }
            ].map((item, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600">
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 w-fit mx-auto">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-blue-300">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Roadmap
            </span>
          </h2>
          
          <div className="space-y-8">
            {[
              {
                phase: "Now — Pre-launch",
                description: "Whitelist, research, public docs."
              },
              {
                phase: "Closed Beta for Treasuries",
                description: "Policy engine, permission layers, agent execution sandboxed on-chain."
              },
              {
                phase: "Policy Marketplace",
                description: "Curated, composable policy modules for different risk profiles and org types."
              },
              {
                phase: "Agent SDK",
                description: "Build, test, and ship your own agents inside enforced limits."
              },
              {
                phase: "DAO Governance",
                description: "Token-holder control over core parameters and upgrades."
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-6 p-6 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-blue-300">{item.phase}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community & Social */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Community & Social
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">Join the conversation & stay up to date:</p>
          
          <div className="flex justify-center space-x-6 mb-12">
            <a href="#" className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-300">
              <span>X (Twitter)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a href="#" className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-300">
              <span>Warpcast</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <p className="text-gray-400 mb-4">Docs & Litepaper</p>
          <p className="text-gray-500">We'll publish transparent technical and product documentation as we roll out the beta.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              FAQ
            </span>
          </h2>
          
          <div className="space-y-8">
            {[
              {
                question: "How do you prevent the AI from draining funds?",
                answer: "We enforce strict, on-chain policy limits: roles, spend caps, whitelists, and allowed function calls. Anything outside the policy is rejected at the contract level."
              },
              {
                question: "Is AII custodial?",
                answer: "No. You remain in control. Policies and agents operate within your configured, verifiable on-chain boundaries."
              },
              {
                question: "Which chains will you support first?",
                answer: "We'll start with major EVM chains (to be announced) and expand based on treasury demand and security readiness."
              },
              {
                question: "Is this production-ready?",
                answer: "AII is experimental and in beta. We are transparent about risks and will iterate fast with treasurer feedback."
              },
              {
                question: "How will the AII token be used?",
                answer: "Utility (access, fees), governance (policy & roadmap decisions), and community incentives (security, modules, early adoption)."
              },
              {
                question: "Can I delegate operations to team members or family?",
                answer: "Yes. You can define granular roles and permissions so different actors can safely execute specific, limited actions."
              },
              {
                question: "What if an AI tries to execute an out-of-policy transaction?",
                answer: "It fails on-chain. The transaction won't go through, and you'll see the attempted violation."
              },
              {
                question: "Do you offer audits and bug bounties?",
                answer: "We will. As we move through beta, we'll publish audits, open bug bounties, and keep everything transparent."
              }
            ].map((faq, index) => (
              <div key={index} className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600">
                <h3 className="text-xl font-bold mb-3 text-blue-300">{faq.question}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Whitelist Form */}
      <section id="whitelist-form" className="py-24 px-6 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-8">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Join the Whitelist
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 text-center mb-12">
            Be first to access AII. Choose if you also want to be considered for the <strong className="text-cyan-400">Closed Beta for DeFi Treasurers</strong>.
          </p>
          
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6" style={{ pointerEvents: 'auto' }}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="treasurer"
                  checked={formData.isTreasurer}
                  onChange={(e) => setFormData({...formData, isTreasurer: e.target.checked})}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
                <label htmlFor="treasurer" className="text-gray-300">
                  I manage a treasury / DAO / family office / fund
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Organization / DAO name (optional)
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                  placeholder="Your organization name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Approx. assets under management (optional)
                </label>
                <select
                  value={formData.assets}
                  onChange={(e) => setFormData({...formData, assets: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                >
                  <option value="">Select range</option>
                  <option value="<$100K">Less than $100K</option>
                  <option value="$100K-$1M">$100K - $1M</option>
                  <option value="$1M-$10M">$1M - $10M</option>
                  <option value="$10M-$100M">$10M - $100M</option>
                  <option value=">$100M">More than $100M</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Telegram / Discord handle (optional)
                </label>
                <input
                  type="text"
                  value={formData.handle}
                  onChange={(e) => setFormData({...formData, handle: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                  placeholder="@yourhandle"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="beta"
                    required
                    checked={formData.betaAgreed}
                    onChange={(e) => setFormData({...formData, betaAgreed: e.target.checked})}
                    className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 mt-0.5"
                  />
                  <label htmlFor="beta" className="text-gray-300 text-sm">
                    I understand AII is experimental and in beta *
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    required
                    checked={formData.privacyAgreed}
                    onChange={(e) => setFormData({...formData, privacyAgreed: e.target.checked})}
                    className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 mt-0.5"
                  />
                  <label htmlFor="privacy" className="text-gray-300 text-sm">
                    I agree to the Privacy Policy *
                  </label>
                </div>
              </div>
              
              {error && (
                <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-200 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-semibold text-lg hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Apply to Whitelist'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-900/20 to-cyan-900/20 border border-green-800/30">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-300 mb-2">Thanks! You're on the list.</h3>
              <p className="text-gray-300">We'll email you as soon as we open early access.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full">
                <img src="/AII.png" alt="AII Logo" className="w-12 h-12" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6 max-w-3xl mx-auto">
              AII is experimental software in active beta testing. Nothing on this website constitutes 
              financial, legal, or investment advice. Use at your own risk.
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms of Use</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
