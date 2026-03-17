export const defaultContent = {
  brand: {
    short: "JF.",
    name: "Job Finder"
  },
  auth: {
    subtitle: "On-chain hiring workspace powered by your Soroban smart contract."
  },
  home: {
    heading: "On-Chain Job Dashboard",
    searchPlaceholder: "Search role, company, skills, or location",
    popularTitle: "Featured On-Chain Jobs",
    recentTitle: "Latest Job Posts",
    popularJobs: [
      {
        company: "Stellar Labs",
        role: "Soroban Smart Contract Developer",
        location: "Remote",
        salary: "$2500/m",
        tags: ["Full Time", "Remote", "Rust"]
      },
      {
        company: "ChainHire",
        role: "Backend API Engineer",
        location: "Bangalore, India",
        salary: "$1800/m",
        tags: ["Full Time", "Hybrid", "Node.js"]
      }
    ],
    recentJobs: [
      {
        company: "AnchorFlow",
        role: "Rust Integration Engineer",
        location: "Dubai, UAE",
        salary: "$2100/m",
        tags: ["Contract", "Remote", "Soroban"]
      }
    ]
  },
  notifications: [
    { title: "Your Application Confirmed!", time: "3 Hours Ago" },
    { title: "Google Declined Your Application.", time: "17 Hours Ago" },
    { title: "Figma Have Seen Your Application.", time: "20 Hours Ago" },
    { title: "Security Update", time: "17 April, 2024" }
  ],
  search: {
    title: "Search",
    placeholder: "Soroban Developer",
    recentSearch: ["Soroban", "Rust", "Node API", "Smart Contract"],
    recentView: [
      {
        company: "TrustWork",
        role: "Blockchain QA Engineer",
        location: "Remote",
        salary: "$1400/m",
        tags: ["Full Time", "Remote", "Testing"]
      },
      {
        company: "Orbit Payroll",
        role: "Full Stack Web3 Engineer",
        location: "London, UK",
        salary: "$2300/m",
        tags: ["Full Time", "On-Site", "React"]
      }
    ]
  },
  filter: {
    title: "Search By Filter",
    location: "United States",
    sortBy: "Most Recent",
    jobNature: "Full Time",
    jobLevels: ["Entry Level", "Mid Level", "Senior", "Lead"],
    workModes: ["All", "Remote", "On-Site", "Hybrid"],
    companies: ["Stellar Labs", "ChainHire", "AnchorFlow", "TrustWork"],
    salaryMin: 500,
    salaryMax: 3000
  },
  post: {
    title: "Job Application Post",
    postButtonLabel: "Post Job"
  }
};
