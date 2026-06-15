// lib/emergencyIntercept.js

const TRIGGERS = {
  MENTAL_HEALTH: [
    'want to die','want to kill myself','kill myself','killing myself',
    'end my life','ending my life',"don't want to be alive",'dont want to be alive',
    "don't want to live",'dont want to live','suicide','suicidal',
    'hurt myself','harm myself','self-harm','selfharm','no reason to live',
  ],
  OVERDOSE: [
    'overdose','overdosed','took too many','took too much',
    'swallowed too many','swallowed too much','too many pills',
    'accidental overdose','might have overdosed','poisoning',
    'ingested something toxic','toxic dose',
  ],
  EMERGENCY: [
    'chest pain','chest pressure','chest tightness',
    "can't breathe",'cannot breathe','cant breathe',
    'trouble breathing','difficulty breathing','heart attack','crushing chest',
    'face drooping','face is drooping','facial drooping',
    'slurred speech','speech slurred','speech is slurred','slurring',
    'arm is weak','arm weakness','suddenly weak',
    "can't speak",'cannot speak','cant speak',
    'worst headache of my life','thunderclap headache','sudden severe headache',
    "bleeding won't stop",'bleeding wont stop','uncontrolled bleeding',
    'unconscious','not responding','not breathing',
    'throat closing','throat is closing','throat swelling',
    'anaphylaxis','anaphylactic','epipen','severe allergic reaction',
  ],
};

const HISTORICAL_BYPASS = [
  /\b(had|have had|history of|recovering from|recovered from)\s+a\s+stroke\b/i,
  /\b(had|have had|experienced)\s+a\s+(heart attack|cardiac arrest)\b/i,
  /\bsigns of (a )?stroke\b/i,
  /\bsymptoms of (a )?stroke\b/i,
  /\bwhat (is|are|does) (a )?stroke\b/i,
];

export const RESPONSES = {
  MENTAL_HEALTH: {
    level: 'crisis',
    label: 'Crisis support',
    message: "I'm really glad you said something. What you're feeling sounds incredibly hard.\n\nPlease reach out to the 988 Suicide and Crisis Lifeline — call or text 988 anytime, 24/7. They're there to listen.\n\nIf you're in immediate danger, please call 911 or go to your nearest emergency room.",
    cta: { label: 'Call or text 988', action: 'tel:988' },
    secondary: { label: 'Call 911', action: 'tel:911' },
  },
  OVERDOSE: {
    level: 'critical',
    label: 'Possible overdose',
    message: "Please call Poison Control right now: 1-800-222-1222 (US, free & confidential, 24/7).\n\nIf the person is unconscious, not breathing normally, or having a seizure — call 911 instead.",
    cta: { label: 'Call Poison Control', action: 'tel:18002221222' },
    secondary: { label: 'Call 911', action: 'tel:911' },
  },
  EMERGENCY: {
    level: 'critical',
    label: 'Medical emergency',
    message: "This sounds like a medical emergency.\n\nPlease call 911 (or your local emergency number) right now, or have someone take you to the nearest emergency room immediately.\n\nDo not wait.",
    cta: { label: 'Call 911', action: 'tel:911' },
  },
};

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkMessage(raw) {
  if (!raw || typeof raw !== 'string') return null;
  if (HISTORICAL_BYPASS.some(p => p.test(raw))) return null;

  const n = normalize(raw);

  for (const [category, triggers] of Object.entries(TRIGGERS)) {
    for (const trigger of triggers) {
      if (n.includes(trigger)) {
        return { category, response: RESPONSES[category] };
      }
    }
  }

  return null;
}
