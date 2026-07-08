export interface CallTemplate {
  id: string;
  title: string;
  customerName: string;
  repName: string;
  scenario: string;
  transcriptText: string;
  // Pre-analyzed analytics to seed local storage or populate immediately without API key
  seedAnalytics: {
    successPercentage: number;
    speakingListeningRatio: string;
    customerSentiment: 'positive' | 'neutral' | 'negative';
    repEmpathyScore: number;
    customerObjectionResistance: number;
    confidenceIndex: number;
    keyInsights: string[];
    miltonPatterns: Array<{
      patternName: string;
      description: string;
      quote: string;
      speaker: 'Representative' | 'Customer';
      evaluation: 'effective' | 'ineffective' | 'neutral';
      improvementSuggestion: string;
    }>;
    coachingInterventions: Array<{
      title: string;
      originalText: string;
      frameworkApplied: string;
      correctedText: string;
      explanation: string;
    }>;
    nextSteps: string[];
  };
}

export const CALL_TEMPLATES: CallTemplate[] = [
  {
    id: "template-crm-saas",
    title: "SaaS Enterprise Deal: CRM Migration Pitch",
    customerName: "Sarah Jenkins (Director of Ops)",
    repName: "Alex Mercer (Senior Account Executive)",
    scenario: "Alex is pitching Sarah on migrating from their Legacy CRM to the SparkCRM enterprise platform. Sarah is worried about data migration downtime and team training resistance.",
    transcriptText: `Representative (Alex): Hi Sarah, thank you for joining today's session. As you review your team's current performance metrics, you can begin to notice where the bottlenecks in user adoption are happening.
Customer (Sarah): Yeah, adopting a new CRM is always a nightmare. My last team took six months just to get comfortable with our legacy CRM, and honestly, we lost deals because of formatting issues.
Representative (Alex): I completely understand. It's frustrating when tools slow you down. But since you're looking for a platform that guarantees a 30% reduction in entry clicks, you are already picturing how much more active selling time your team will reclaim.
Customer (Sarah): Well, yes, if it actually saves time. But what about the migration? I can't afford to have my team blind for three days while you transfer data.
Representative (Alex): Absolutely, continuous operations are paramount. Is it worth seeing how our zero-downtime shadow-sync operates, which ensures your legacy CRM remains live until you decide to pull the plug?
Customer (Sarah): Zero downtime shadow-sync? How does that work?
Representative (Alex): It's quite simple. Our engine mirrors your live database, meaning you won't lose a single lead. Because we handle the heavy lifting, your team will notice the simplicity of the transition the moment they log in. I know you're wondering how the training phase works too, and we've pre-loaded a personalized academy for them.
Customer (Sarah): That does sound a bit better. If we can avoid the downtime, that resolves my biggest headache. But my budget is fully committed for this quarter.
Representative (Alex): That makes sense. Since we're looking to eliminate CRM friction, would you prefer to review our deferred billing option for this quarter, or should we schedule a technical deep dive with your database administrator first?
Customer (Sarah): A deferred billing option could actually work for us. Let's look into that. And yes, a technical call with my database admin is a good next step.`,
    seedAnalytics: {
      successPercentage: 85,
      speakingListeningRatio: "48:52",
      customerSentiment: "positive",
      repEmpathyScore: 9,
      customerObjectionResistance: 4,
      confidenceIndex: 8,
      keyInsights: [
        "Customer's primary bottleneck is the operational fear of migration downtime and team resistance.",
        "The deferred billing option effectively neutralized the Q1 budget objection.",
        "Rapport was solidified by validating legacy CRM frustrations before pivoting to the solution."
      ],
      miltonPatterns: [
        {
          patternName: "Pacing and Matching",
          description: "Describing the listener's ongoing, undeniable experience to build trust.",
          quote: "As you review your team's current performance metrics, you can begin to notice where the bottlenecks in user adoption are happening.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Strong opening that maps directly onto the customer's executive focus."
        },
        {
          patternName: "Presupposition",
          description: "Sentences that contain implicit assumptions to guide choice.",
          quote: "Since you're looking for a platform that guarantees a 30% reduction in entry clicks, you are already picturing how much more active selling time your team will reclaim.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Excellent use of presupposition ('you are already picturing') which forces Sarah to imagine the positive future state."
        },
        {
          patternName: "Lost Performative",
          description: "Value statements made without attributing the evaluation to a specific source.",
          quote: "Absolutely, continuous operations are paramount.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Sounds highly objective and builds authority regarding enterprise operational safety."
        },
        {
          patternName: "Conversational Postulate",
          description: "A soft yes-or-no question that prompts an action or agreement.",
          quote: "Is it worth seeing how our zero-downtime shadow-sync operates...?",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Highly effective at reducing defense mechanisms; far superior to 'Let me demo our shadow-sync product'."
        },
        {
          patternName: "Mind Reading",
          description: "Claiming to know the internal state of another without direct verification.",
          quote: "I know you're wondering how the training phase works too...",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Pre-empts the next unspoken objection while maintaining conversational command."
        }
      ],
      coachingInterventions: [
        {
          title: "Optimize Alternative Option Presupposition",
          originalText: "Would you prefer to review our deferred billing option for this quarter, or should we schedule a technical deep dive with your database administrator first?",
          frameworkApplied: "Double-Bind Presupposition",
          correctedText: "As we structure the deferred billing schedule to accommodate your quarterly constraints, would you prefer the technical integration call on Tuesday morning, or is Wednesday afternoon more aligned?",
          explanation: "The original question gave an 'either/or' choice between commercial terms and a technical meeting. The improved version presupposes BOTH will happen, doubling down on commitment and accelerating the timeline."
        },
        {
          title: "Strengthen Lost Performative on Migration Risk",
          originalText: "Our engine mirrors your live database, meaning you won't lose a single lead.",
          frameworkApplied: "Lost Performative + Cause-and-Effect",
          correctedText: "It is widely accepted that shadow-syncing is the only secure migration standard. When you protect your lead stream, you automatically secure Q1 revenues.",
          explanation: "Sarah's fear of lost database records requires absolute professional authority. Using 'It is widely accepted' removes personal speculation, and linking 'protecting lead stream' to 'securing revenue' creates an undeniable logical progression."
        }
      ],
      nextSteps: [
        "Send the calendar invitation for the technical shadow-sync overview, copying her database administrator.",
        "Draft the deferred billing proposal (billing commences Q2) and attach a copy of the zero-downtime guarantee certificate.",
        "Add Sarah on LinkedIn and send a short note referencing her database admin meeting."
      ]
    }
  },
  {
    id: "template-fintech",
    title: "FinTech Consultative: Payment Gateway Pricing",
    customerName: "Robert Vance (CFO, Vance Retail)",
    repName: "Chloe Vance (Solutions consultant)",
    scenario: "Chloe is discussing payment gateway processing fees with Robert. Robert is highly analytical, skeptical, and focused entirely on basis-points. He wants a direct volume discount.",
    transcriptText: `Representative (Chloe): Thanks for jumping on, Robert. I know that as a CFO, every basis point represents critical operating leverage that you must protect.
Customer (Robert): Correct. We process $40M annually. Right now, our rates are 2.2% + 10c per transaction. Your starting rate is 2.4% + 15c. That's a deal breaker unless you can beat my current provider on price.
Representative (Chloe): It is logical to prioritize fee structures. However, when you realize that transaction failures and cart abandonments actually cost your brand 85 basis points in hidden slippage, you begin to see why leading merchants prioritize gateway resilience over base fees.
Customer (Robert): SLIPPAGE? Where is that slippage coming from? We have a 98% gateway approval rate.
Representative (Chloe): Exactly, 98% is a solid standard. But because we're looking at the additional $800,000 lost to soft-declines and legacy smart-routing errors, can you notice how a 99.6% approval rating easily covers that basis-point delta?
Customer (Robert): How can you prove we are suffering from soft declines at that level?
Representative (Chloe): That's a great question. By reviewing our diagnostic snapshot on your current payment flow, your engineering team will instantly isolate the exact retry-failures that our adaptive routing bypasses.
Customer (Robert): Hmmm. We haven't looked at soft-decline retries. If we actually save $200k in reclaimed revenue, then a minor transaction cost delta is acceptable. But I need hard proof before we discuss any migration.
Representative (Chloe): Absolutely, proof builds confidence. Let's run our zero-risk API log audit next week. It is easy to connect, and it will give you complete visibility before you commit to any contracts.
Customer (Robert): OK, send me the API integration doc. If my engineers approve, we'll run the audit.`,
    seedAnalytics: {
      successPercentage: 72,
      speakingListeningRatio: "38:62",
      customerSentiment: "neutral",
      repEmpathyScore: 8,
      customerObjectionResistance: 8,
      confidenceIndex: 9,
      keyInsights: [
        "CFO Robert is highly analytical and transactional; he initially rejected Spark because of superficial price differences.",
        "Reframing the discussion from 'processing fees' to 'revenue slippage due to soft declines' successfully bypasses price objections.",
        "The zero-risk API log audit is an optimal low-friction next step that caters to his need for 'hard proof'."
      ],
      miltonPatterns: [
        {
          patternName: "Mind Reading",
          description: "Claiming knowledge of another's unexpressed thoughts or feelings.",
          quote: "I know that as a CFO, every basis point represents critical operating leverage that you must protect.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Builds immediate credibility and shows alignment with his specific professional goals."
        },
        {
          patternName: "Cause and Effect",
          description: "Linking an undeniable fact to an inferred outcome.",
          quote: "However, when you realize that transaction failures and cart abandonments actually cost your brand 85 basis points in hidden slippage, you begin to see why leading merchants prioritize gateway resilience over base fees.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Creates strong logical coupling. Bypasses the fee-negotiation deadlock by showing higher cost centers."
        },
        {
          patternName: "Conversational Postulate",
          description: "Soft phrasing that stimulates a physical response or focus without demands.",
          quote: "...can you notice how a 99.6% approval rating easily covers that basis-point delta?",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Allows Robert to calculate the math himself, which is highly effective with analytical buyers."
        },
        {
          patternName: "Lost Performative",
          description: "Value statements made as an objective truth without a source.",
          quote: "Absolutely, proof builds confidence.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Elegant validation that builds authority and professional security."
        }
      ],
      coachingInterventions: [
        {
          title: "Presuppose Technical Alignment",
          originalText: "If my engineers approve, we'll run the audit.",
          frameworkApplied: "Presupposition & Temporal Pacing",
          correctedText: "When your team reviews our sandbox API docs, they will immediately recognize the speed of our webhook routing, which makes running the audit a seamless afternoon project for them.",
          explanation: "Instead of leaving the 'if' condition completely open to the engineers' subjective opinion, Chloe can presuppose that when they read the docs, they will be impressed, converting a hurdle into a standard milestone."
        }
      ],
      nextSteps: [
        "Email the developer sandbox documentation and API gateway spec sheets to Robert Vance.",
        "Prepare the draft scope of work for the 7-day retrospective log audit.",
        "Set an internal task to follow up in 3 days with his engineering lead."
      ]
    }
  },
  {
    id: "template-cold-call",
    title: "Objection Heavy: Cold Call with HR Director",
    customerName: "Elena Rostova (HR Director, Apex Solutions)",
    repName: "Marcus Vance (BDR)",
    scenario: "Marcus cold-calls Elena to pitch their SparkTalent AI recruitment shortlister. Elena is busy, highly skeptical, and immediate attempts to brush him off.",
    transcriptText: `Representative (Marcus): Hello Elena, this is Marcus. I know you weren't expecting my call, and as you handle the chaotic hiring sprint for Apex this quarter, you might feel tempted to hang up, but if you give me 90 seconds, you will see why other fast-growing HR teams are reclaiming 15 hours a week in screening fatigue.
Customer (Elena): Look Marcus, I'm literally walking into a board meeting in two minutes. We are not hiring any recruiters, and our ATS does automated screening anyway. I don't have time.
Representative (Marcus): I completely respect your busy calendar, Elena. That's why I'll speak quickly. Because you're walking into a board meeting, you know that report-readiness is key. Traditional ATS keyword filters miss the top 40% of non-linear resumes, meaning you might be pitching sub-optimal pipelines to your board today.
Customer (Elena): Wait... my ATS misses 40%? What do you mean 'non-linear resumes'?
Representative (Marcus): Exactly. A non-linear candidate might have the perfect skills but a different job title. Traditional filters lock them out. By applying our behavioral-match engine, our system reads capabilities rather than keywords. That is why it's highly important to audit candidate flow.
Customer (Elena): Well, our hiring managers have complained that they aren't seeing enough diversity or versatile profiles... but we have a lock-in contract with our current ATS.
Representative (Marcus): Of course, contracts are standard. But since we integrate with your current ATS in under 5 minutes, can you imagine how easy it is to try this on a single hard-to-fill role without disrupting your vendor agreements?
Customer (Elena): It works on top of our existing ATS? It doesn't replace it?
Representative (Marcus): Correct. It sits right on top to enrich your current stream. Is it worth receiving a 2-minute visual breakdown of how this saved 20 hours for the HR team at CloudDev?
Customer (Elena): OK, send me the 2-minute visual link. I will check it after my board meeting. Here is my direct email: elena@apex.com.
Representative (Marcus): Wonderful. Have a fantastic board meeting, Elena! I will send that over immediately.`,
    seedAnalytics: {
      successPercentage: 68,
      speakingListeningRatio: "55:45",
      customerSentiment: "neutral",
      repEmpathyScore: 7,
      customerObjectionResistance: 9,
      confidenceIndex: 8,
      keyInsights: [
        "The customer is highly time-starved and immediate-defensive, but has an active pain-point (hiring managers complaining about sub-optimal/homogeneous pipelines).",
        "Reframing the product as an 'enrichment layer' that integrates in 5 minutes rather than an ATS replacement bypassed vendor contract friction.",
        "Leveraged her board meeting context to create urgency regarding pipeline reports."
      ],
      miltonPatterns: [
        {
          patternName: "Pacing and Matching",
          description: "Describing a undeniable present state to lower defense mechanisms.",
          quote: "I know you weren't expecting my call, and as you handle the chaotic hiring sprint for Apex this quarter, you might feel tempted to hang up...",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Bold and effective pattern for pattern-interrupt on cold calls. Confirms her internal desire (to hang up) which paradoxically stops her from doing it."
        },
        {
          patternName: "Cause and Effect",
          description: "Linking an undeniable state to a desirable cognitive focus.",
          quote: "Because you're walking into a board meeting, you know that report-readiness is key.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Connects her immediate physical situation directly to her business responsibility, securing her attention."
        },
        {
          patternName: "Lost Performative",
          description: "Value statements presented without attribution.",
          quote: "That is why it's highly important to audit candidate flow.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Establishes a strong objective authority on recruitment best practices."
        },
        {
          patternName: "Presupposition",
          description: "Implicitly assuming a favorable outcome.",
          quote: "...can you imagine how easy it is to try this on a single hard-to-fill role without disrupting your vendor agreements?",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Excellent use of 'can you imagine' which activates her problem-solving state."
        }
      ],
      coachingInterventions: [
        {
          title: "Soften Cold Pitch Ratio",
          originalText: "Traditional ATS keyword filters miss the top 40% of non-linear resumes, meaning you might be pitching sub-optimal pipelines to your board today.",
          frameworkApplied: "Presupposition & Empathy Pacing",
          correctedText: "As you sit down with your board today to discuss Apex's growth, you are probably looking for ways to maximize the talent pool. When keyword filters accidentally filter out high-potential candidates, it makes reporting a lot harder than it needs to be.",
          explanation: "The original statement was slightly aggressive ('meaning you might be pitching sub-optimal pipelines today'). While it got her attention, a softer Milton presupposition paired with empathy prevents defensive backlash while keeping the urgency high."
        }
      ],
      nextSteps: [
        "Email the 2-minute visual walk-through video to elena@apex.com immediately.",
        "Add a personalized note congratulating her on finishing the board meeting.",
        "Log the call in the CRM and schedule an automated follow-up email in 24 hours."
      ]
    }
  },
  {
    id: "template-widget-plus",
    title: "Widget Plus Inc: Negotiation & Technical Evaluation",
    customerName: "Jack White (VP of Procurement)",
    repName: "Bob Smith (Senior Account Executive)",
    scenario: "Bob Smith is discussing enterprise cloud integration and commercial agreements with Jack White from Widget Plus Inc. Jack is concerned about long deployment cycles and contract flexibility.",
    transcriptText: `Representative (Bob Smith): Hi Jack, thank you for your time today. As you look at the Q3 scalability roadmaps for Widget Plus Inc., you can already begin to notice where the legacy architecture is falling short.
Customer (Jack White): Well, yes. We're growing quite fast and our current widgets aren't integrating smoothly. But we can't afford to be stuck in a nine-month onboarding cycle. We need speed.
Representative (Bob Smith): Absolutely, velocity is crucial. Since you're seeking a platform that deploys in under 30 days, you are probably already visualizing how much faster your developers will roll out new features.
Customer (Jack White): A 30-day deployment would be fantastic. But our procurement team is highly sensitive about contract lock-ins. We need some flexibility.
Representative (Bob Smith): It is natural to protect commercial flexibility. Because we are looking to align with Widget Plus's corporate standards, would you prefer to explore our quarterly review-outs, or should we align with your standard net-60 vendor terms first?
Customer (Jack White): Quarterly review-outs would address most of our risk. If you can write that into the SLA, we are very interested. Let's get a trial set up.
Representative (Bob Smith): Excellent. I will send the draft SLA with the quarterly review provisions over right away.`,
    seedAnalytics: {
      successPercentage: 92,
      speakingListeningRatio: "45:55",
      customerSentiment: "positive",
      repEmpathyScore: 9,
      customerObjectionResistance: 3,
      confidenceIndex: 9,
      keyInsights: [
        "Jack White (Widget Plus Inc.) needs high speed-to-value (under 30 days deployment) and commercial flexible guardrails.",
        "Bob Smith maintained strong conversational posture, using double-bind presuppositions to bypass contract rigidity objections.",
        "Procurement risk was successfully mitigated with quarterly review-outs, leading directly to a trial commitment."
      ],
      miltonPatterns: [
        {
          patternName: "Pacing and Matching",
          description: "Describing the listener's ongoing, undeniable experience to lower analytical resistance.",
          quote: "As you look at the Q3 scalability roadmaps for Widget Plus Inc., you can already begin to notice...",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Strong opening linking corporate roadmaps directly to the solution's value."
        },
        {
          patternName: "Presupposition",
          description: "Phrasing that contains silent assumptions to guide buyer imagination.",
          quote: "Since you're seeking a platform that deploys in under 30 days, you are probably already visualizing...",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Excellent use of 'already visualizing' to pre-emptively anchor the 30-day timeline."
        },
        {
          patternName: "Lost Performative",
          description: "Value statements presented as universal standard truths.",
          quote: "Absolutely, velocity is crucial.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Sounds authoritative and objective, aligning with the CFO's timeline goals."
        }
      ],
      coachingInterventions: [
        {
          title: "Double-Bind Presupposition Tuning",
          originalText: "Would you prefer to explore our quarterly review-outs, or should we align with your standard net-60 vendor terms first?",
          frameworkApplied: "Double-Bind",
          correctedText: "As we structure the flexible SLA for Widget Plus Inc., would you prefer to review the draft next Tuesday morning, or should we schedule the executive review for Wednesday afternoon?",
          explanation: "Presupposes both options are acceptable and leads directly to scheduling the next high-value meeting."
        }
      ],
      nextSteps: [
        "Email the draft SLA with quarterly review-out provisions to Jack White at Widget Plus Inc.",
        "Set up the sandbox staging trial instance for their developer team.",
        "Schedule a brief 15-minute alignment sync with their engineering manager."
      ]
    }
  },
  {
    id: "template-arachnid-systems",
    title: "Gong Upload: Arachnid Systems Discovery Call",
    customerName: "Phil Muffins (Chief Category Officer)",
    repName: "Mark Toura (Account Executive)",
    scenario: "Introductory Zoom call with Phil Muffins and his multi-functional executive team from Arachnid Systems (Equine/Livestock care, $100M+). Mark tries to dive into priorities but completely misses the customer's expectation to see the product, leading to an awkward reschedule.",
    transcriptText: `Representative (Mark): hey, Phil.
Customer (Phil): Hey, good morning.
Representative (Mark): Good morning. Did you have a good weekend? Yes, yourself? I did. I'm in Miami. I went to the beach, played some tennis. It's kind of getting too hot. I got there at like 10 am and by like 11, it was too hot to play.
Customer (Phil): That sounds rough. Some tennis and a day at the beach. Yeah. Where are you located? We're located in just about an hour south of Cleveland. Okay? Nice.
Representative (Mark): Are we waiting for a few others? Yeah.
Customer (Phil): And I don't I thought somebody sitting here. He just closed his door maybe… do they have the same invite?
Representative (Mark): I sent out a new one with the zoom link rather than the Google meets like an hour ago. I don't know why it always includes a Google invite instead?
Customer (Phil): It says, hello, I'm on the 10 30 call but waiting to be let in, I don't know. Is there anybody that might be the?
Representative (Mark): Google apologies for that should be a zoom link as well… or in place of it?
Customer (Phil): Let me reply to everybody.
Representative (Mark): Send you the link… in chat. Okay?
Customer (Phil): Eric, how long have you been with Illuminate?
Representative (Mark): It's been about three months so far. Okay. So rather new, but, yeah, I guess we'll kick off the conversation once I get here. Curious like, your history of knowing Illuminate, but there's been some changes since April first. We launched a new platform. So excited to chat through that with you.
Customer (Phil): What, what's your background? Pre, Illuminate? I?
Representative (Mark): Was in software solution sales, or SaaS, sales for an HR technology company. Okay. Yeah. And Illuminate is in a great spot with, their new solution kind of being more of a AI native platform? Yeah, really exciting times. Nice. Hey, Phineas.
Customer (Phineas): Hi, Eric.
Representative (Mark): And then we have Tia, is that everyone?
Customer (Phil): And Liz, oh, Liz, we might have Elizabeth as well. All right. Sorry, guys. I was on a different link.
Representative (Mark): Yes. Sorry about that when it automatically schedules, it goes to Google meets. So I sent out a zoom invite maybe like an hour ago, must not got pushed through though… but I guess we can go ahead and get started, appreciate your reach out to Illuminate. I would love to kind of kick off the conversation, understand what, you know, about Illuminate, what you're looking to accomplish any specific projects initiative, just overall background of yourself and the business too.
Customer (Phil): Yeah. So I think I'm probably the only one who knows anything about Illuminate. So the rest of the team here is, but I wanted them to get a chance to see it as we start talking about it. So I previously worked at wellness pet company, which is a client of Illuminate. I actually helped bring Illuminate aboard back in like 2018, 2019. So I think fairly early days for Illuminate. And so, yeah, I'm familiar with the consumer research side of the platform I had done. I was working innovation at the time but then shifted to more strategy and finance. So kind of moved to a different part of the business and haven't used it very recently. So to your point about like what's new with Illuminate? I mean, besides seeing matt's posts on LinkedIn, that's basically what I know of any updates or changes today. So.
Representative (Mark): Right. And.
Customer (Phil): What we're looking for? So we are a… let me think of, we're a livestock and equine company or equine and livestock company just rolls off the tongue better. So we make everything you need to care for your horse except for the saddle itself. We're about based out of northeast Ohio. And I think what we're looking for as we look at innovation and some of the projects that we're working through, we want to be able to talk to consumers who don't currently buy… from us. So we have a direct consumer site so we actually can poll our customers or consumers. But what we would like to do is understand for some of the things where we're some of our initiatives where we want to bring new people into the brand, have a way to source a different side, a different type of panel to get some good answers there. Got it. And.
Representative (Mark): So would this be specifically for, I saw eight different brands on your website. So would this be for any specific one or just overall?
Customer (Phil): Overall, and so maybe with that, we should go around the table here on introductions. So my role is I'm the chief category officer. I've been here about nine months and I oversee our five core businesses. So all of those brands that you saw from profit and loss product portfolio et cetera, flow up through my team. And then I've got a few of my team members on here, but maybe we can go to Phineas next… yeah.
Customer (Phineas): Sure. I'm Phineas Beans, I'm the chief information officer and senior VP of digital. So oversee our digital business, direct consumer, Amazon marketing. And it been at Arachnid Systems since 2003, so long tenure.
Customer (Phil): How about Tia? Sure.
Customer (Tia): Good morning. Yeah. My name is Tia scheer. And I'm the general manager for our livestock division. I've been with company for 22 years and oversee all things related to the livestock channel.
Customer (Phil): How about Elizabeth? Sure?
Customer (Elizabeth): So I would lead our marketing team and our marketing team is a team of about 20 that serves as an internal agency to those eight brands that you mentioned.
Representative (Mark): Perfect.
Customer (Phil): And then Liz, our newest member of the team. Hi.
Customer (Liz): Everybody, I'm Liz, Smith, I'm the GM on equine and pet. And so we're seeing all things related to those various brands. And I have been with the company for two months… perfect. Yeah.
Representative (Mark): Great introductions. So, I guess with a lot of people on the call, I would like to start with you. So initially we do a discovery, gather information, have a tailored demonstration for you. So if we can get to that demonstration later, be happy to, or schedule another call, but we'd love to kind of dive into those priorities a little bit more. So it sounds like finding that new type of customer, whether it's DTC identifying, who that is. Are there any other kind of top five priorities that you're looking for from Illuminate?
Customer (Phil): I mean, I think to maybe be a little bit more clear on, so we have, we sell direct to consumer, but we also sell through wholesalers through dealer network, through tractor supply, farm stores and Amazon. So we have a pretty broad consumer base. And so while growing our DTC business is one of our top priorities, we actually are looking at how does our brand and the relevance of our brand play in the minds of consumers. So I would say… understanding or maybe let me put it this way. The problem statement is more along the lines of, we are a fairly well known brand with good goodwill… behind it or aspirational… brand. Like people don't hear Arachnid Systems and think they make the best xyz and so particularly on the equine side, trying to understand the consumers that are choosing to ride with our competitors, whether it's because it's the best or for some other reason and understand a little bit more what goes into their purchase decision, right?
Representative (Mark): And then once you get that feedback, that data of understanding that would that go into different marketing campaigns, position it in a different way against the competitors? Is it more product development, what they're looking for out of the product? Yeah.
Customer (Phil): It's it's probably all of the above. I mean, I, so, so my team is more, on the product and portfolio positioning side, but, I would think if you know the data then, you know, we work with Elizabeth's team on what those campaigns and how we actually like the materials at the end of the day. So, got it.
Representative (Mark): Do you have anything today like gathering any consumer data besides just sales data in general and trying to kind of interpret that? Do you have anything today that you're kind of pulsing the audience or the, any new markets potentially?
Customer (Phil): Not significantly. I mean, we have, we'll poll some of our DTC consumers on occasion and we, we've also done a NPS survey with our customers like the actual, you know, like, the stores themselves. Yeah, but from a consumer research side, we've done, we did some more qualitative work about a year and a half ago, Phineas that consumerize study. Yeah, that timing is roughly right. Yep, but definitely more on the qualitative focus group side, there might've been a quant component but we, I would say in general, we don't have a lot of consumer. We certainly don't have a lot of quant data floating around our.
Representative (Mark): Walls got it. And then kind of what sparked you to like do those studies? Is there a, how does the workflow go from? Hey, we identified this trend or we have this business question to we need to get that data on it. And then how do we make a decision from there? What does that workflow look like today? Is it just you're like identifying that? Okay, this could be an issue. We're seeing these numbers come back in sales. It's maybe telling a trend here. We need to get more research on this.
Customer (Phil): I'm curious to hear other people's takes, but I would say… our go to is probably more along the lines of we've spoken with a customer or, you know, we have a number of enthusiasts in the building, right? Like Tia is, was probably at a livestock show this weekend or certainly taking care of, her livestock. And so like there's it's more of a grassroots identify a problem, try to scope out the sizing of it. And then we actually test it with in market with consumers. Like I think, we do a pretty good job of actually getting the product out in the hands of whether it's influencers or teams that actually like use our products and they use them hard. But there's a I'd say the gap is that we don't usually communicate or… get feedback in that initial like prototyping phase besides the people that we know.
Representative (Mark): Got it. So like validating the concept or that product before you heavily invest in it to expand it and then kind of building the marketing campaigns around that as well. Is that what I'm hearing? Yeah.
Customer (Phineas): I think to your original question, I mean Phil walked through it there. It was like we just don't have this data now. Like he mentioned a few projects that we've done and we have, but there is no consistency. Like we did. The one project you referenced was a big project that took a lot of hands and we did it once and we have now the powerpoint deck in our drawers and we have ever reached out to our customers via a poll of like the customer audience, that is our owned audience like from our email list, but we're not getting regular consumer feedback. So be it new product or their brand perception or how the, whatever we're not getting that on a regular basis. So any of this is more aspirational than comparison to current. We just don't have a lot today.
Representative (Mark): Yeah. Totally. That makes sense. And kind of the goal of Illuminate is you want to make these business decisions with, to back it up. So if you're investing in a marketing campaign, is it based off gut off feeling of the market? And you want to know what's going to land? So you want to test it out prior to investing heavily in that. So, no, that totally makes sense. And even like those old studies that you have, if there is still like good information in that, being able to query it easily across everyone here at the team rather than it just kind of living within a silo. So having that data in one spot, being able to ask Illuminate like, hey, do we have any information on this? That's totally kind of the direction that we've headed in? I guess, is there any like initial project here that's kind of driving the timeline? Would you be looking to kind of go live with Illuminate?
Customer (Phil): Yeah, I mean, I think… yeah, I think there's some questions that are floating around like one in particular kind of that equine problem about increasing the improving the perception of our brand in terms of like the level of quality fit, finish, like moving some things more a little bit more premium. We had an aiming question that I was like this is a classic question that I would have asked to the panel that we had built at wellness to just get a read on. Do people like this name better or this name?
Representative (Mark): So, yeah, and packaging too, I'm guessing with things like that.
Customer (Liz): Yeah. I mean, go ahead. I was going to say going off of what Phil said and going back to what you said earlier. Like I think we have, so many of ourselves in the building are the customers as well or are close enough to the customers or reach out to the customers that when it comes to the big decisions, so like new products or… I feel like especially mostly when it comes to like new products, things like that, like the big, where do we go? What are our customers using? I feel like that's the stuff that we know inherently because we are our customers or are close to our customers where I think I would love a little more help is where it's kind of specific and a little bit more nuanced. So, for example, the name, is this name better? Or is this slightly different version of kind of the same name better like those things where it kind of could go either way? And I feel like if I'm you know, it wouldn't be bad for us to pick one. It's not going to ruin things, but it would be better to have a bit more of, you know, a little bit more information and strategy to go off of. So it's more of or like to your point like packaging, like is this layout better? Is this different layout, slightly different layout? Better? It's more of those kind of nuanced things versus like the bigger question like what is our customer using? Who are they? Like that stuff? We know?
Representative (Mark): Right. No, that totally makes sense. Go.
Customer (Elizabeth): Ahead. If I can jump in from a marketing standpoint, we have a lot of, I thinks around here, I'd like to get to the point where we have, I knows, and as we think about it from a marketing standpoint, we focus a lot on our product marketing. We have not focused as much on our brand marketing and our brand positioning. So if we could use this research to help us identify from a brand positioning standpoint, how do we go from a brand people are aware of and know about to a brand that's relevant to them and they're purchasing it. That story is something I'm interested in exploring a bit more to see what it would take to get to that point as well?
Representative (Mark): Yeah, totally. That's another great use case for Illuminate. But back to like one of the questions, is there like a speed issue? If you notice like, hey, there could be this trend and then getting to that decision, we want this data quick. So we can make that decision is speed kind of an issue there? I know consumers move fast. There's a lot of different things out there and marketing campaigns move fast. Is that like a barrier that you're seeing?
Customer (Phil): Let me phrase it this way. I think it's less about the speed of the marketplace… and more about the resources and time that we have in the building. So I think the speed would enable us having used Illuminate. I kind of know a little bit about the speed, right? Like it would allow us not to. Then if we had a group of questions that we wanted answers on, let's say 20 questions rather than going out to a firm sourcing a panel running a quant. I mean, it's six to eight weeks, maybe 12 weeks. By the time you do all that work, you got to get some multiple bids. So to me, I think the speed is more like how can we get a little bit sharper about going from? I think to, well we have this data that shows X y Z, but doing it in a little bit more real time or within a week or two rather than waiting and then moving on to the next thing. I mean with the… five, you know, I only have our representatives from equine and livestock on the call here, but we have like 25,000 SKUs active as a business and a fairly lean team to manage all of that. So anytime we can shorten… that decision loop and, you know, I think we actually do a pretty good job of making decisions and moving on. But we are doing it either in the absence of data, you know, or when… we don't have data, then we do end up circling at times.
Representative (Mark): Right. How would that data kind of help with those retailer conversations? Like the value that it's bringing there when you're going to the retailer wholesale? Are they looking for data to support the products in their store? It would certainly.
Customer (Phil): Help. I don't know if any, you know, we don't have any of the sales team on the phone here, but yeah, I know they go with that.
Customer (Tia): A little bit, yeah, go ahead especially in our farm store channels. Those buyers in particular are asking, you know, what's the industry saying or do you have any data to support that? So I definitely think it would help with those types of customers because again, it just goes back to, you know, our selling case would be well, we, you know, we are in the industry, we eat sleep, breathe it. This is what we experience that's how we know that it's true and that is one thing of the coin, right? But the other side of the coin then would be to quickly turn the conversation to and we've done a research study and, the numbers collected through this third party effort and data clearly shows supporting, our thoughts as well. So, yeah, I mean, I think it's, very helpful. It.
Customer (Elizabeth): Would be helpful to us as well from the standpoint of we get pushback sometimes from our retailers because we sell D to C ourselves, we sell on Amazon and then we sell in store. So you will have stores that will push back saying, well, why should I carry that? You're competing with me? This at the other, I think understanding that landscape better and what our brand consumers, how they shop would be extremely helpful from a sales perspective as well as just understanding that better. So they can have those conversations. I mean, we know it's valuable to be in all three spaces obviously to us as a business and impacts our bottom line. But being able to help those sales reps, I think would be key. Yeah.
Customer (Phil): That's a great point also as I think about like who these people are, the people that are shopping on our website and shopping at tractor supply? Are they're two different consumers? And when we go to talk to tractor supply, we don't really have a lot of data on that customer to have.
Customer (Elizabeth): The data to tell them. Yeah, it's something totally different. I think would be awesome for that team. They would probably love it. Yeah.
Representative (Mark): Absolutely. And you can kind of design, the surveys questionnaires differently, obviously within Illuminate, have screener questions to make sure you're hitting that exact target audience. Are you, are you shopping online? Are you shopping more in wholesale retail? Trying to get to that exact buyer question that you would like? Cool? I guess, I know I asked like initial projects. But what is like the timeline for making a decision? Are you looking at other people for this solution? Phil, I know you're familiar with Illuminate, but are you looking at other vendors for this? Is there a timeline? Hey, we need this up and running?
Customer (Phil): No, this is the first initial call. So… TBD, I mean, I kind of remember a little bit about the pricing that we had when we brought it on, but I don't know how Susie's changed. We are not, you know, we have over 100,000,000 dollars in sales annually, but we are also not a, you know, we're not a 1,000,000,000 dollar company like many of the companies you have on your website. So, yeah.
Representative (Mark): Finding.
Customer (Phil): something that will fit with our, within our budget, might, you know, might be a challenge even more than like the time to get people up and running. So, right.
Representative (Mark): Okay. Is there a budget in mind that I should be aware of?
Customer (Phil): We haven't we haven't really discussed, but, okay.
Representative (Mark): Yeah. All good. No, but, we do work with many smaller business media businesses and the larger business. It's just a different use case. So you're saying as a leaner team, many of you probably wear different hats. You need to do more with less and that's kind of the new Illuminate that we've developed. It's not just that market research tool, it's we call it three teammates. So your researchers staying ahead of different trends, identifying different trends that are tailored to your business. Then obviously the consumer insights pillar getting from like, hey, we understand that there's maybe a gap here looking to understand it further validate that with the data with the consumer data, have that with Susie's system and then act on it moving forward. And then you can even chat on it. So that old upload that into Illuminate, any kind of goals for Q3, Q4 or for the full year, helping Illuminate understand who you are as a business and where you want to go, helps you get different recommendations there. And so often what I'll show on the demonstration once we get that set up is having that data come back in like, hey, are there any gaps from our research hypothesis? We were looking to understand this, what gaps are still currently there? Asking Illuminate? And then from the platform be like, hey, can you draft another survey or a qualitative study to help us further evaluate this hypothesis? And we'll build it straight from there and you can launch it within five minutes. So it's really is that speed to getting that answer. And then the third pillar is kind of storytelling. So all that data that's within your system if you run a survey once a month, same survey just looking to understand the tracking of the business audience understanding over that three six month period, being able to create quick deliverable for all the different teams here. So everyone may not need a full narrative. But Phil you may want the narrative, other people may want the deck that kind of illustrates the information that you're getting there and helps you make a decision. So you're not trying to rework the data over and over to that insights piece faster. But I know we didn't quite get to the product. But I have a lot of great use cases. And so what I'll do is I'll tailor the demonstration to the specific use cases show different concept testing, audience understanding, testing, product testing all within this easy solution on our next demonstration.
Customer (Phil): Okay. That works. And I'm sorry, team. I thought we were actually going to get into the product today. So more to come there. No, I can work with scheduling for you for the team. So, yeah.
Representative (Mark): Sorry about that. It's just like Illuminate has grown from just that initial piece and it's a full solution now and I want to tailor it to your specific use cases can show like a basic broad but I don't think it's as powerful for your team to see like the actual specific use case that we talked about. Yeah, that's fair cool. But appreciate all your time Phil. It sounds like I'll connect with you on timing for this. I'm pretty free this week or whenever it needs to be. So, yeah, I'll send over some times and we can get that set up.
Customer (Phil): Okay. That sounds good perfect.
Representative (Mark): Thanks, everyone. Have a good week. Thanks bye.`,
    seedAnalytics: {
      successPercentage: 45,
      speakingListeningRatio: "35:65",
      customerSentiment: "neutral",
      repEmpathyScore: 6,
      customerObjectionResistance: 6,
      confidenceIndex: 5,
      keyInsights: [
        "Arachnid Systems manages 25,000 active SKUs across 8 brands with a highly lean team, making traditional 6-12 week panel research processes unviable.",
        "The core brand challenges include equine/livestock buyers preferring competitors and retail channel pushback (Tractor Supply) regarding direct-to-consumer competition.",
        "The representative missed a critical buying signal and customer expectation by failing to demonstrate the product on the first call, resulting in customer disappointment."
      ],
      miltonPatterns: [
        {
          patternName: "Presupposition",
          description: "Describing a future or ongoing action that assumes agreement.",
          quote: "I guess we can go ahead and get started, appreciate your reach out to Illuminate. I would love to kind of kick off the conversation...",
          speaker: "Representative",
          evaluation: "neutral",
          improvementSuggestion: "Rather than passively starting, Mark should have presupposed the team's objective: 'Since we are exploring how to make your 25,000 SKUs more relevant to equine consumers, you are likely looking for immediate, simple research tools...'"
        },
        {
          patternName: "Lost Performative",
          description: "Value statements made as an objective truth without a source.",
          quote: "So it really is that speed to getting that answer.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "This successfully highlighted their core need of accelerating their feedback loop from 12 weeks to real-time."
        },
        {
          patternName: "Mind Reading",
          description: "Claiming knowledge of another's unexpressed thoughts or feelings.",
          quote: "I know we didn't quite get to the product.",
          speaker: "Representative",
          evaluation: "ineffective",
          improvementSuggestion: "Acknowledging this after the customer complains doesn't fix the issue; he should have set expectations for a 5-minute visual walkthrough at the very beginning."
        }
      ],
      coachingInterventions: [
        {
          title: "Align with Customer Demonstration Expectations",
          originalText: "But I have a lot of great use cases. And so what I'll do is I'll tailor the demonstration to the specific use cases show different concept testing, audience understanding, testing, product testing all within this easy solution on our next demonstration.",
          frameworkApplied: "Direct Value Pacing",
          correctedText: "I hear you, Phil, and I apologize to the team for the misunderstanding. Since your multi-functional leaders are assembled right now, let's spend 5 minutes showing you a live equine panel dashboard, and then we can schedule a deep dive tailored to your specific Q3 concepts.",
          explanation: "The customer team explicitly joined the call expecting to see the product. Forcing a multi-functional executive team of 5 leaders to reschedule because of a rigid sales discovery template caused significant professional friction."
        },
        {
          title: "Pre-empt Scheduling & Tooling Mismatches",
          originalText: "Yes. Sorry about that when it automatically schedules, it goes to Google meets. So I sent out a zoom invite maybe like an hour ago, must not got pushed through though...",
          frameworkApplied: "Universal Solution Ownership",
          correctedText: "We will make sure all future calendar invites are configured on Zoom directly. Let's make sure Phineas has the link so he can let the rest of the team in right away.",
          explanation: "Blaming calendar integration scripts sounds highly unprofessional and wastes valuable executive call time in the first five minutes of discovery."
        }
      ],
      nextSteps: [
        "Immediately send a customized Zoom invitation for the tailored product demonstration, copying the entire Arachnid executive team.",
        "Prepare custom Equine vs. Competitor brand-perception sample dashboards utilizing simulated northeast Ohio consumer panel data.",
        "Draft a budget-friendly custom SLA proposal targeting a mid-market pricing tier to accommodate their $100M revenue scale."
      ]
    }
  },
  {
    id: "template-lucia-formica",
    title: "Renewal Review: Platform Migration & Account Transition",
    customerName: "Ray Chang (Senior Product Manager, Avonlea)",
    repName: "Lucia Formica (VP, Customer Success)",
    scenario: "Lucia and the team are reviewing the renewal and platform migration with Ray Chang of Avonlea. Ray wants cost justification slides and comparison narratives to present to Avonlea leadership.",
    transcriptText: `Representative (Lucia): Hi Ray, great to see you again. I know we've got some updates to share on our new AI-native platform, and also we want to make sure your transition to our new pricing model is smooth.
Customer (Ray): Hey Lucia, yeah, absolutely. I need to have a very logical stance on why I need this tool and what with or without it looks like. Data is king for me. I need data behind me because I'm walking into a twenty million dollar funding discussion with our leadership in June.
Representative (Lucia): For sure, we can help explain that and build those slides for you.
Customer (Ray): Awesome. I’ll take that data, put it as source code to this GPT that I’ve created, and that way I can scale the learnings over time. But why can't I just do it with the AI tools that I have already today?
Representative (Lucia): That's a great question, Ray. Let's make sure we build a slide comparing generic desktop AI tools to our specialized research assistant so you can show exactly why ours is a multiplier for your 'army of one' team.`,
    seedAnalytics: {
      successPercentage: 59,
      speakingListeningRatio: "42:58",
      customerSentiment: "positive",
      repEmpathyScore: 7,
      customerObjectionResistance: 5,
      confidenceIndex: 7,
      keyInsights: [
        "Ray is preparing a $20M funding pitch to Avonlea leadership in June and needs solid consumer data.",
        "The team did not explicitly anchor the renewal price to this $20M business outcome on the call.",
        "Ray requested a cost-of-not-having-this case which the team deferred to a future slide deck rather than starting live."
      ],
      miltonPatterns: [
        {
          patternName: "Pacing and Matching",
          description: "Aligning communication with the client's current, observable experience.",
          quote: "I know we've got some updates to share on our new AI-native platform, and also we want to make sure your transition to our new pricing model is smooth.",
          speaker: "Representative",
          evaluation: "effective",
          improvementSuggestion: "Successfully aligned with Ray's awareness of the renewal timeline."
        }
      ],
      coachingInterventions: [
        {
          title: "Anchor Renewal Value to Stated ROI Target",
          originalText: "For sure, we can help explain that and build those slides for you.",
          frameworkApplied: "Confirm",
          correctedText: "So the platform's real job for you is giving you the definitive consumer data backing the $20M ask — is that fair? Let's make sure our migration proposal mirrors that exact scale of value.",
          explanation: "Connecting pricing directly to the user's high-stakes business goal prevents the software from being viewed as an isolated cost line item."
        }
      ],
      nextSteps: [
        "Create custom competitor-comparison slide showing Illumine specialized intelligence versus generic AI tools.",
        "Confirm whether the renewal contract (approx. $70-90k) requires additional sign-offs or procurement reviews beyond Ray at Avonlea.",
        "Draft a working sample budget proposal aligned with Ray's survey frequency expectations."
      ]
    }
  }
];


