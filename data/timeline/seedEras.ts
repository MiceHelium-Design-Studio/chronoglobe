import { Era, TimelineMarker } from '../../types/history';

export interface EraSeedRecord
  extends Omit<Era, 'events' | 'map'> {
  map: Omit<Era['map'], 'regions'>;
}

function marker(
  id: string,
  label: string,
  lat: number,
  lng: number,
  intensity: TimelineMarker['intensity'],
  note?: string,
): TimelineMarker {
  return { id, label, lat, lng, intensity, note };
}

export const eraSeedRecords: EraSeedRecord[] = [
  {
    year: 117,
    slug: 'imperial-apex',
    title: 'Imperial Apex and Managed Frontiers',
    subtitle: 'Consolidated empires with long-haul exchange',
    description:
      'Roman and Han systems maintain administrative scale while intermediaries sustain transcontinental routes.',
    eraLabel: 'Classical Continuity',
    tags: ['empire', 'trade', 'administration'],
    summary: {
      dominantPowers: ['Roman Empire', 'Han Dynasty'],
      conflicts: ['Frontier rebellions', 'Succession pressure'],
      population: '~250M',
      technologyLevel: 'Road engineering and siege logistics',
      tradeContext: 'Silk and luxury exchange through relay networks',
      culturalShift: 'Codified law and imperial identity formation',
    },
    map: {
      theme: 'imperial',
      markers: [
        marker('m117-rome', 'Rome', 41.9, 12.5, 'high', 'Administrative and military core'),
        marker('m117-changan', 'Chang’an', 34.3, 108.9, 'high', 'Eastern imperial anchor'),
      ],
      focus: { lat: 38, lng: 35, zoom: 3 },
    },
    hotspots: ['Mediterranean governance', 'Silk corridor stability'],
  },
  {
    year: 476,
    slug: 'post-rome-fragmentation',
    title: 'Western Fragmentation, Eastern Continuity',
    description:
      'Western Roman collapse fragments political authority while Byzantine and Sasanian systems retain strategic depth.',
    eraLabel: 'Late Antiquity',
    tags: ['fragmentation', 'succession', 'continuity'],
    summary: {
      dominantPowers: ['Byzantine Empire', 'Sasanian Empire', 'Successor Kingdoms'],
      conflicts: ['Border wars', 'Power consolidation'],
      technologyLevel: 'Heavy infantry and fortified cities',
      tradeContext: 'Eastern routes resilient, western routes contractionary',
      culturalShift: 'Religious institutions absorb governance roles',
    },
    map: {
      theme: 'antique',
      markers: [
        marker('m476-constantinople', 'Constantinople', 41, 28.9, 'high'),
        marker('m476-ravenna', 'Ravenna', 44.4, 12.2, 'medium'),
      ],
      focus: { lat: 42, lng: 20, zoom: 4 },
    },
    hotspots: ['Western succession crisis', 'Eastern fiscal continuity'],
  },
  {
    year: 800,
    slug: 'sacred-imperial-orders',
    title: 'Competing Sacred and Imperial Orders',
    description:
      'Carolingian, Abbasid, and East Asian systems define overlapping legitimacy models with connected exchange networks.',
    eraLabel: 'Medieval Consolidation',
    tags: ['religion', 'administration', 'knowledge'],
    summary: {
      dominantPowers: ['Carolingian Empire', 'Abbasid Caliphate', 'Tang Legacy'],
      conflicts: ['Border campaigns', 'Dynastic competition'],
      technologyLevel: 'Cavalry-command and paper administration',
      tradeContext: 'Indian Ocean and overland networks converge',
      culturalShift: 'Translation movements accelerate technical diffusion',
    },
    map: {
      theme: 'imperial',
      markers: [
        marker('m800-baghdad', 'Baghdad', 33.3, 44.4, 'high'),
        marker('m800-aachen', 'Aachen', 50.8, 6.1, 'medium'),
      ],
      focus: { lat: 36, lng: 43, zoom: 3 },
    },
    hotspots: ['Scholarly networks', 'Religious legitimacy'],
  },
  {
    year: 1200,
    slug: 'mobile-empires',
    title: 'Mobile Empires and Corridor Rewiring',
    description:
      'Steppe mobility and maritime finance transform strategic assumptions across Eurasian theaters.',
    eraLabel: 'High Medieval',
    tags: ['mobility', 'finance', 'corridors'],
    summary: {
      dominantPowers: ['Steppe Confederations', 'Regional Sultanates', 'Maritime Republics'],
      conflicts: ['Rapid frontier incursions', 'City-state rivalry'],
      technologyLevel: 'Mounted maneuver and fortified commerce hubs',
      tradeContext: 'Caravan and maritime insurance systems expand',
      culturalShift: 'Cross-cultural military learning deepens',
    },
    map: {
      theme: 'imperial',
      markers: [
        marker('m1200-samarkand', 'Samarkand', 39.6, 66.9, 'high'),
        marker('m1200-venice', 'Venice', 45.4, 12.3, 'medium'),
      ],
      focus: { lat: 43, lng: 60, zoom: 3 },
    },
    hotspots: ['Steppe pressure', 'Credit-backed shipping'],
  },
  {
    year: 1453,
    slug: 'constantinople-fall',
    title: 'Ottoman Breakthrough and Route Rebalancing',
    description:
      'Control of Constantinople shifts strategic leverage in eastern Mediterranean commerce and military projection.',
    eraLabel: 'Late Medieval Pivot',
    tags: ['siege', 'maritime', 'chokepoints'],
    summary: {
      dominantPowers: ['Ottoman Empire', 'Italian Maritime States'],
      conflicts: ['Siege warfare escalation', 'Sea-lane competition'],
      technologyLevel: 'Gunpowder artillery scaling',
      tradeContext: 'Mediterranean toll and access conditions reset',
      culturalShift: 'Imperial capitals become symbolic geopolitical trophies',
    },
    map: {
      theme: 'industrial',
      markers: [
        marker('m1453-istanbul', 'Constantinople/Istanbul', 41, 28.9, 'high'),
      ],
      focus: { lat: 39, lng: 27, zoom: 4 },
    },
    hotspots: ['Bosporus control', 'Levantine route pricing'],
  },
  {
    year: 1492,
    slug: 'atlantic-expansion',
    title: 'Atlantic Expansion Begins',
    description:
      'Iberian maritime breakthroughs establish repeatable Atlantic routing and colonial administration patterns.',
    eraLabel: 'Oceanic Expansion',
    tags: ['navigation', 'colonial', 'atlantic'],
    summary: {
      dominantPowers: ['Castile-Aragon', 'Portugal', 'Ottoman Empire'],
      conflicts: ['Naval competition', 'Colonial foothold contests'],
      technologyLevel: 'Advanced sail navigation and cartography',
      tradeContext: 'Atlantic routes challenge Mediterranean centrality',
      culturalShift: 'Missionary and imperial narratives globalize',
    },
    map: {
      theme: 'industrial',
      markers: [
        marker('m1492-seville', 'Seville', 37.4, -5.9, 'high'),
        marker('m1492-caribbean', 'Caribbean Outpost', 18.5, -69.9, 'medium'),
      ],
      focus: { lat: 25, lng: -32, zoom: 3 },
    },
    hotspots: ['Atlantic convoy corridors', 'Colonial governance templates'],
  },
  {
    year: 1812,
    slug: 'continental-war-balance',
    title: 'Continental War and Coalition Rebalance',
    description:
      'Napoleonic campaigns strain logistics and trigger coalition realignment across Europe.',
    eraLabel: 'Revolutionary Aftershock',
    tags: ['coalitions', 'campaigns', 'logistics'],
    summary: {
      dominantPowers: ['French Empire', 'Russian Empire', 'British Empire'],
      conflicts: ['Continental campaigns', 'Maritime blockade rivalry'],
      technologyLevel: 'Mass conscription and operational maneuver',
      tradeContext: 'Blockades and sanctions reshape industrial supply access',
      culturalShift: 'National identity merges with wartime mobilization',
    },
    map: {
      theme: 'industrial',
      markers: [
        marker('m1812-moscow', 'Moscow', 55.8, 37.6, 'high'),
        marker('m1812-london', 'London', 51.5, -0.1, 'medium'),
      ],
      focus: { lat: 52, lng: 18, zoom: 4 },
    },
    hotspots: ['Coalition diplomacy', 'Overextended supply lines'],
  },
  {
    year: 1914,
    slug: 'industrial-total-war',
    title: 'Alliance Cascade into Total War',
    description:
      'Industrial mobilization and rigid alliance commitments create system-wide conflict.',
    eraLabel: 'Industrial Total War',
    tags: ['alliances', 'mobilization', 'attrition'],
    summary: {
      dominantPowers: ['British Empire', 'German Empire', 'Russian Empire'],
      conflicts: ['Western Front', 'Eastern Front', 'Imperial theaters'],
      technologyLevel: 'Mechanized artillery and trench systems',
      tradeContext: 'Blockades and convoy warfare dominate maritime risk',
      culturalShift: 'Mass media reshapes public war consciousness',
    },
    map: {
      theme: 'industrial',
      markers: [
        marker('m1914-sarajevo', 'Sarajevo', 43.9, 18.4, 'medium'),
        marker('m1914-western-front', 'Western Front', 49.5, 2.2, 'high'),
      ],
      focus: { lat: 48, lng: 9, zoom: 4 },
    },
    hotspots: ['Alliance rigidity', 'Industrial attrition'],
  },
  {
    year: 1945,
    slug: 'postwar-bipolar-order',
    title: 'Postwar Institutions and Bipolar Order',
    description:
      'Global governance institutions emerge as U.S.-Soviet strategic competition defines deterrence logic.',
    eraLabel: 'Postwar Reordering',
    tags: ['institutions', 'deterrence', 'reconstruction'],
    summary: {
      dominantPowers: ['United States', 'Soviet Union', 'United Kingdom'],
      conflicts: ['Occupation zones', 'Emergent proxy tensions'],
      technologyLevel: 'Nuclear deterrence and strategic air power',
      tradeContext: 'Bretton Woods and reconstruction finance stabilize markets',
      culturalShift: 'Human rights norms and multilateral diplomacy expand',
    },
    map: {
      theme: 'modern',
      markers: [
        marker('m1945-washington', 'Washington', 38.9, -77, 'high'),
        marker('m1945-moscow', 'Moscow', 55.8, 37.6, 'high'),
      ],
      focus: { lat: 45, lng: 5, zoom: 2.8 },
    },
    hotspots: ['Institutional architecture', 'Nuclear threshold politics'],
  },
  {
    year: 1991,
    slug: 'post-cold-war-transition',
    title: 'Post-Cold War Transition',
    description:
      'Soviet collapse accelerates market integration and unipolar security coordination.',
    eraLabel: 'Globalization Expansion',
    tags: ['globalization', 'transition', 'integration'],
    summary: {
      dominantPowers: ['United States', 'European Community', 'Rising East Asia'],
      conflicts: ['Regional interventions', 'State transition instability'],
      technologyLevel: 'Satellite command and precision operations',
      tradeContext: 'Containerization and free-trade acceleration',
      culturalShift: 'Early digital media compresses geopolitical reaction cycles',
    },
    map: {
      theme: 'modern',
      markers: [
        marker('m1991-berlin', 'Berlin', 52.5, 13.4, 'medium'),
        marker('m1991-riyadh', 'Riyadh', 24.7, 46.7, 'medium'),
      ],
      focus: { lat: 35, lng: 20, zoom: 2.8 },
    },
    hotspots: ['System transition', 'Networked markets'],
  },
  {
    year: 2001,
    slug: 'security-realignment',
    title: 'Security Realignment under Asymmetric Threats',
    description:
      'Non-state threats shift strategy toward intelligence fusion, surveillance, and expeditionary campaigns.',
    eraLabel: 'Security Reset',
    tags: ['counterterror', 'surveillance', 'intervention'],
    summary: {
      dominantPowers: ['United States', 'NATO Coalition', 'Regional Security States'],
      conflicts: ['Afghanistan theater', 'Counterterror campaigns'],
      technologyLevel: 'Persistent ISR and networked targeting',
      tradeContext: 'Critical infrastructure protection becomes economic priority',
      culturalShift: 'Security policy reshapes civic and digital norms',
    },
    map: {
      theme: 'modern',
      markers: [
        marker('m2001-nyc', 'New York', 40.7, -74, 'high'),
        marker('m2001-kabul', 'Kabul', 34.5, 69.2, 'medium'),
      ],
      focus: { lat: 33, lng: 25, zoom: 2.6 },
    },
    hotspots: ['Asymmetric threat doctrine', 'Homeland security expansion'],
  },
  {
    year: 2025,
    slug: 'multipolar-ai-competition',
    title: 'Multipolar AI and Supply-Chain Competition',
    description:
      'Strategic rivalry concentrates on compute access, semiconductor chokepoints, maritime security, and narrative control.',
    eraLabel: 'AI-Geopolitical Convergence',
    tags: ['ai', 'semiconductors', 'maritime', 'cyber'],
    summary: {
      dominantPowers: ['United States', 'China', 'Networked Middle Powers'],
      conflicts: ['Proxy flashpoints', 'Economic coercion', 'Cyber operations'],
      population: '~8.1B',
      technologyLevel: 'Foundation-model ecosystems and autonomous sensing',
      tradeContext: 'Resilient, redundant supply architecture replaces single-path efficiency',
      culturalShift: 'Synthetic media reshapes public trust and influence operations',
    },
    map: {
      theme: 'modern',
      markers: [
        marker('m2025-taiwan-strait', 'Taiwan Strait', 24.5, 121, 'high'),
        marker('m2025-red-sea', 'Red Sea Corridor', 18.6, 40.2, 'high'),
      ],
      focus: { lat: 21, lng: 90, zoom: 2.4 },
    },
    hotspots: ['Compute sovereignty', 'Maritime chokepoints', 'Narrative competition'],
  },
];
