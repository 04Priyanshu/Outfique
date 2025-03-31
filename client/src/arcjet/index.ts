import arcjet, { detectBot, fixedWindow, protectSignup, shield, validateEmail } from "@arcjet/next";

export const protectSignupRules = arcjet({
    key: process.env.ARCJET_KEY!, 
    rules: [
      protectSignup({
        email: {
          mode: "LIVE",
          block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
        },
        bots: {
          mode: "LIVE",
          
          allow: [], 
        },
        
        rateLimit: {
          
          mode: "LIVE",
          interval: "10m", 
          max: 100,
        },
      }),
      
    ],
  });

  export const protectLogin = arcjet({
    key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
    rules: [
      validateEmail({
        mode: "LIVE", 
        deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
      }),
    ],
  });

  export const createNewProductRules = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
      detectBot({
        mode: "LIVE",
        allow: [],
      }),
      fixedWindow({
        mode: "LIVE",
        window: "300s",
        max: 5,
      }),
      shield({
        mode: "LIVE",
      }),
    ],
  });