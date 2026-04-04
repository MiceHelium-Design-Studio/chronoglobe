import { TimelineEvent } from '../../types/history';

export const seedEventsByYear: Record<number, TimelineEvent[]> = {
  117: [
    {
      id: 't117-rome',
      title: 'Roman territorial apex under Trajan',
      summary: 'Imperial administration reaches maximum geographic extent.',
      region: 'Mediterranean',
      tags: ['empire', 'administration'],
      significance: 'high',
    },
    {
      id: 't117-han',
      title: 'Han frontier operations stabilize Silk intermediaries',
      summary: 'Trade corridors maintain East-West relay capacity.',
      region: 'Central Asia',
      tags: ['trade', 'frontier'],
      significance: 'medium',
    },
  ],
  476: [
    {
      id: 't476-western-collapse',
      title: 'Western Roman imperial office collapses',
      summary: 'Successor polities replace centralized western administration.',
      region: 'Western Europe',
      tags: ['state-fragmentation', 'succession'],
      significance: 'high',
    },
  ],
  800: [
    {
      id: 't800-charlemagne',
      title: 'Carolingian imperial claim formalized',
      summary: 'New western legitimacy framework competes with eastern continuity.',
      region: 'Western Europe',
      tags: ['legitimacy', 'religion'],
      significance: 'high',
    },
  ],
  1200: [
    {
      id: 't1200-steppe-mobility',
      title: 'Steppe mobility reshapes Eurasian security assumptions',
      summary: 'Rapid mounted warfare challenges static frontier systems.',
      region: 'Eurasian Steppe',
      tags: ['military', 'mobility'],
      significance: 'high',
    },
  ],
  1453: [
    {
      id: 't1453-constantinople',
      title: 'Ottoman capture of Constantinople',
      summary: 'Eastern Mediterranean power and trade access are reconfigured.',
      region: 'Eastern Mediterranean',
      tags: ['siege', 'trade'],
      significance: 'high',
    },
  ],
  1492: [
    {
      id: 't1492-atlantic',
      title: 'Atlantic maritime crossing establishes recurring route',
      summary: 'Oceanic expansion begins sustained hemispheric integration.',
      region: 'Atlantic',
      tags: ['navigation', 'expansion'],
      significance: 'high',
    },
  ],
  1812: [
    {
      id: 't1812-napoleonic-shift',
      title: 'Continental warfare shifts strategic coalitions',
      summary: 'European campaign failures alter power balancing trajectories.',
      region: 'Europe',
      tags: ['coalitions', 'warfare'],
      significance: 'high',
    },
  ],
  1914: [
    {
      id: 't1914-alliance-cascade',
      title: 'Alliance obligations trigger global war',
      summary: 'Industrial mobilization transforms regional crisis into systemic conflict.',
      region: 'Europe',
      tags: ['alliances', 'industrial-war'],
      significance: 'high',
    },
  ],
  1945: [
    {
      id: 't1945-postwar-order',
      title: 'Postwar institutional order established',
      summary: 'UN and Bretton Woods architecture define a new system framework.',
      region: 'Global',
      tags: ['institutions', 'deterrence'],
      significance: 'high',
    },
  ],
  1991: [
    {
      id: 't1991-soviet-collapse',
      title: 'Soviet dissolution ends bipolar order',
      summary: 'Unipolar governance and market integration accelerate.',
      region: 'Eastern Europe',
      tags: ['system-change', 'globalization'],
      significance: 'high',
    },
  ],
  2001: [
    {
      id: 't2001-security-reset',
      title: 'Security doctrine pivots to asymmetric threats',
      summary: 'Counterterror strategies reshape domestic and external policy.',
      region: 'North Atlantic',
      tags: ['counterterror', 'security'],
      significance: 'high',
    },
  ],
  2025: [
    {
      id: 't2025-ai-competition',
      title: 'AI infrastructure and chokepoint rivalry intensify',
      summary: 'Compute, semiconductors, and maritime routes become strategic levers.',
      region: 'Indo-Pacific',
      tags: ['ai', 'supply-chains'],
      significance: 'high',
    },
  ],
};
