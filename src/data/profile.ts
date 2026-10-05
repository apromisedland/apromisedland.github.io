export type Publication = {
  id: string;
  shortTitle: string;
  title: string;
  year: number;
  venue: string;
  status: string;
  authors: { name: string; mark?: string }[];
  contributionNote?: string;
  summary: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  links: { label: string; href: string }[];
  topics: string[];
};

export const profile = {
  name: 'Yirong Qiang',
  role: 'AI Researcher',
  email: 'yirongqiang1@gmail.com',
  github: 'https://github.com/apromisedland',
  bio: 'I study how intelligent agents perceive, reason, and act in the physical world. My research spans embodied AI, efficient world models, verifiable robotic reasoning, and multimodal human–agent interaction. I received my B.Eng. in Artificial Intelligence & Mathematics from the Yingcai Honors College at UESTC, and have conducted research at Tsinghua University and Shanghai Jiao Tong University.',
  interests: [
    "Embodied AI, World Models/VLAs",
    "Agentic AI",
    "Multimodal AI",
    "Human-Computer Interaction",
  ],
};

export const publications: Publication[] = [
  {
    id: 'diwa',
    shortTitle: 'DIWA',
    title: 'DIWA: Decision-Influential World Abstraction for VLA-WAM Policies',
    year: 2027,
    venue: 'ICLR 2027',
    status: 'Under review',
    authors: [{ name: 'Yirong Qiang' }, { name: 'Lianlei Shan' }],
    summary: 'Selects decision-relevant future information before world-model decoding, combining intervention-based influence estimation with candidate-action regret geometry for efficient vision–language–action policies.',
    image: 'images/diwa-architecture.webp',
    imageWidth: 1400,
    imageHeight: 1044,
    imageAlt: 'DIWA architecture showing decision-influential selection of future queries before world-model decoding.',
    links: [
      { label: 'Paper', href: 'https://apromisedland.github.io/diwa-paper-page/assets/diwa-paper.pdf' },
      { label: 'Project', href: 'https://apromisedland.github.io/diwa-paper-page/' },
    ],
    topics: ['Embodied AI', 'World Models', 'Efficient Inference'],
  },
  {
    id: 'vlcot',
    shortTitle: 'VLCoT',
    title: 'Stage-Verifiable Latent Chain-of-Thought with Local Repair for Long-Horizon Robotic Manipulation',
    year: 2026,
    venue: 'ICML 2026',
    status: 'Accepted',
    authors: [
      { name: 'Yirong Qiang', mark: '*' },
      { name: 'Jiahe Zhang', mark: '*' },
      { name: 'Ming Zhou' },
      { name: 'Yuxiu Pei' },
      { name: 'Lianlei Shan', mark: '†' },
    ],
    contributionNote: '* Co-authors · † Corresponding author',
    summary: 'Aligns latent reasoning with observable task stages, verifies execution progress, and repairs only the affected plan segments while retaining valid prior reasoning.',
    image: 'images/vlcot-architecture.svg',
    imageWidth: 1440,
    imageHeight: 882,
    imageAlt: 'VLCoT architecture connecting stage-aligned latent reasoning, observation-based verification, and local repair.',
    links: [
      { label: 'Paper', href: 'https://apromisedland.github.io/vlcot-paper-page/assets/paper/vlcot-paper.pdf' },
      { label: 'Project', href: 'https://apromisedland.github.io/vlcot-paper-page/' },
      { label: 'Code', href: 'https://github.com/apromisedland/VLCoT' },
    ],
    topics: ['Embodied AI', 'Latent Reasoning', 'Robotic Manipulation'],
  },
  {
    id: 'tame3d',
    shortTitle: 'Tame3D',
    title: 'Taming Multi-Agent Collaboration for 3D Situated Reasoning via Uncertainty Alignment',
    year: 2025,
    venue: 'ICLR 2025 Workshop on Foundation Models in the Wild',
    status: 'Workshop paper',
    authors: [
      { name: 'Yirong Qiang', mark: '*' },
      { name: 'Xi Hong', mark: '*' },
      { name: 'Zhewei Li' },
      { name: 'Yuling Zheng' },
      { name: 'Yi Lu' },
      { name: 'Yilun Chen', mark: '†' },
    ],
    contributionNote: '* Equal contribution · † Corresponding author',
    summary: 'Coordinates complementary agents for 3D situated reasoning, using uncertainty alignment to guide evidence acquisition and decisions about when to answer or abstain.',
    image: 'images/tame3d-framework.webp',
    imageWidth: 1608,
    imageHeight: 754,
    imageAlt: 'Tame3D framework with complementary reasoning experts, uncertainty alignment, and evidence acquisition.',
    links: [
      { label: 'Paper', href: 'https://apromisedland.github.io/tame3d-paper-page/assets/tame3d-paper.pdf' },
      { label: 'Project', href: 'https://apromisedland.github.io/tame3d-paper-page/' },
      { label: 'Code', href: 'https://github.com/apromisedland/Tame_3D' },
    ],
    topics: ['Multi-Agent Systems', '3D Reasoning', 'Uncertainty'],
  },
  {
    id: 'omniintents',
    shortTitle: 'OmniIntents',
    title: 'OmniIntents: Enhancing Intent Prediction and Agent Selection through Real-World Multimodal Inputs and LLM Integration',
    year: 2025,
    venue: 'CHI 2025',
    status: 'Published',
    authors: [
      { name: 'Yunmeng Kui', mark: '*' },
      { name: 'Yirong Qiang', mark: '*' },
      { name: 'Haoran Wu' },
      { name: 'Tusheng Ren' },
      { name: 'Wu Cheng' },
      { name: 'Kang Zhao', mark: '†' },
    ],
    contributionNote: '* Equal contribution · † Corresponding author',
    summary: 'Combines multimodal cues and large language models to infer human intentions, plan tasks, and select suitable agents for interaction across digital and physical environments.',
    image: 'images/omniintents-architecture.webp',
    imageWidth: 2600,
    imageHeight: 934,
    imageAlt: 'OmniIntents pipeline linking multimodal inputs, intent prediction, task planning, and agent selection.',
    links: [
      { label: 'Paper', href: 'https://apromisedland.github.io/omniintents-paper-page/assets/omniintents-paper.pdf' },
      { label: 'Project', href: 'https://apromisedland.github.io/omniintents-paper-page/' },
      { label: 'Code', href: 'https://github.com/apromisedland/OmniIntents_' },
    ],
    topics: ['Human–Agent Interaction', 'Multimodal AI', 'Intent Prediction'],
  },
];

export const experiences = [
  {
    organization: 'Tsinghua University',
    unit: 'Department of Computer Science and Technology',
    role: 'Research Assistant',
    period: 'Jun – Sep 2026',
    description: 'Led the research direction and method design for DIWA, studying decision-relevant world abstraction and the trade-off between predictive information and inference computation.',
  },
  {
    organization: 'Tsinghua University',
    unit: 'Institute for AI Industry Research (AIR)',
    role: 'Research Intern',
    period: 'Dec 2024 – Mar 2025',
    description: 'Co-designed the Tame3D multi-agent framework for 3D situated reasoning, with a focus on the core pipeline, agent architecture, uncertainty alignment, and experimental analysis.',
  },
  {
    organization: 'University of Electronic Science and Technology of China',
    unit: '',
    role: 'Undergraduate Researcher',
    period: 'Jun – Nov 2024',
    description: 'Built the core OmniIntents pipeline and conducted multimodal intent-prediction experiments, connecting human–computer interaction with language-model reasoning and agent selection.',
  },
];

export const education = {
  institution: 'University of Electronic Science and Technology of China',
  college: 'Yingcai Honors College',
  degree: 'B.Eng. in Artificial Intelligence & Mathematics',
  period: 'Sep 2022 – Jun 2026',
  gpa: '4.00 / 4.00',
  rank: '1',
  average: '92.46',
};

export const awards = [
  {
    year: '2025',
    title: 'Selected for Early Admission',
    detail: 'Tsinghua Shenzhen International Graduate School',
  },
  {
    year: '2025',
    title: 'Excellent Camper',
    detail: 'Beijing Institute for General Artificial Intelligence (BIGAI) and Pengcheng National Laboratory (PCNL)',
  },
  {
    year: '2025',
    title: 'Excellent Camper',
    detail: 'School of Artificial Intelligence, Shanghai Jiao Tong University',
  },
  {
    year: '2023 · 2024',
    title: 'Academic Excellence Star',
    detail: 'University of Electronic Science and Technology of China',
  },
  {
    year: '2023',
    title: 'National Scholarship',
    detail: 'Awarded in October 2023',
  },
  {
    year: '2023',
    title: 'ACM-ICPC Silver Award',
    detail: 'Regional Invitational Contest, Chengdu Site',
  },
  {
    year: '2020',
    title: 'Provincial Olympiad Awards',
    detail: 'First Prize in Mathematics and Physics; Second Prize in Chemistry',
  },
];

export const community = {
  title: 'Co-founder, UESTC AI Society',
  period: 'Dec 2023 – Mar 2026',
  description: 'Co-founded an AI community that grew to more than 2,000 members, connecting students with AI researchers and supporting an open-source AI community.',
};

export const project = {
  id: 'trustworthy-agent-simulation',
  title: 'Trustworthy Agent Simulation',
  subtitle: 'Multi-agent modeling for computational social science',
  description: 'An auditable, configurable simulation of a town with interacting residents and businesses. I designed multilayer agent architectures and an extensible framework to explore how individual interactions shape collective behavior.',
  tags: ['Multi-Agent Systems', 'AgentScope', 'Mesa', 'Simulation'],
  image: 'images/agent-simulation-dashboard.png',
  imageWidth: 704,
  imageHeight: 871,
  imageAlt: 'Dashboard from the project repository showing a completed offline baseline town simulation, including agent locations, economic indicators, and event records.',
  href: 'https://github.com/apromisedland/trustworthy-agent-simulation',
  award: 'First Prize (2nd place), New Engineering Exhibition',
};
