// pricingPlansData.ts

export const pricingPlans = [
  {
    name: "Basic",
    price: { monthly: "$570", annual: "$456" },
    description: "Minimum trading plan for getting started with crypto.",
    features: [
      "Access to 20+ cryptocurrencies",
      "Basic charting tools",
      "Market data with 15-min delay",
      "Email support",
      "Mobile app access"
    ],
    buttonText: "Get Started"
  },
  {
    name: "Pro",
    price: { monthly: "$1500", annual: "$1200" },
    description: "Advanced trading plan for active crypto traders.",
    highlighted: true,
    features: [
      "Access to 50+ cryptocurrencies",
      "Advanced charting tools",
      "Real-time market data",
      "Priority support",
      "API access"
    ],
    buttonText: "Get Pro"
  },
  {
    name: "Enterprise",
    price: { monthly: "$5000", annual: "$4000" },
    description: "Comprehensive solution for professional traders.",
    features: [
      "Access to all cryptocurrencies",
      "Professional-grade charts",
      "Real-time market data",
      "24/7 dedicated support",
      "Zero trading fees",
      "Advanced API access",
      "Institutional-grade security",
      "Custom reporting",
      "Team management"
    ],
    buttonText: "Contact Sales"
  }
];
