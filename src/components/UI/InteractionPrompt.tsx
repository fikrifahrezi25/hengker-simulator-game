import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

// ── Named interactable labels ──────────────────────────────────────────────
const NAMED_LABELS: Record<string, { icon: string; desc: string }> = {
  'home-computer':   { icon: '💻', desc: 'Use Computer'            },
  'apartment-door':  { icon: '🚪', desc: 'Exit to Neo Satria City' },
  'apt-city-door':   { icon: '🏠', desc: 'Enter Apartment'         },
  'interior-exit':   { icon: '🚪', desc: 'Exit Building'           },
  'npc-zara':        { icon: '💬', desc: 'Talk to Zara'            },
  'npc-hana':        { icon: '💬', desc: 'Talk to Prof. Hana'      },
  'npc-marcus':      { icon: '💬', desc: 'Talk to Marcus'          },
  'npc-riko':        { icon: '💬', desc: 'Talk to Riko'            },
  'npc-leo':         { icon: '💬', desc: 'Talk to Leo'             },
  'cyber-cafe':      { icon: '☕', desc: 'Enter Meridian Cyber Cafe' },
  'computer-store':  { icon: '🖥', desc: 'Enter Chen\'s Tech Store' },
  'university':      { icon: '🎓', desc: 'Enter University'         },
  'uni-server':      { icon: '🖥', desc: 'Access Server Terminal'   },
  'corp-terminal':   { icon: '🖥', desc: 'Access Corporate Terminal'},
};

// ── District labels for generic building entrances ─────────────────────────
function getBuildingLabel(id: string): { icon: string; desc: string } {
  if (id.includes('res'))   return { icon: '🏘', desc: 'Enter Residential Building' };
  if (id.includes('uni'))   return { icon: '🎓', desc: 'Enter University Building'  };
  if (id.includes('biz'))   return { icon: '🏢', desc: 'Enter Office Building'      };
  if (id.includes('tech'))  return { icon: '💡', desc: 'Enter Tech Park Building'   };
  if (id.includes('shop'))  return { icon: '🛍', desc: 'Enter Shop'                 };
  if (id.includes('ind'))   return { icon: '🏭', desc: 'Enter Industrial Building'  };
  if (id.includes('mixed')) return { icon: '🏬', desc: 'Enter Building'             };
  return { icon: '🚪', desc: 'Enter Building' };
}

export default function InteractionPrompt() {
  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);

  if (!nearbyInteractable) return null;

  const named = NAMED_LABELS[nearbyInteractable];
  const info  = named ?? (
    nearbyInteractable.startsWith('building-')
      ? getBuildingLabel(nearbyInteractable)
      : null
  );

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-30"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <div className="glass-dark rounded-xl px-5 py-3 flex items-center gap-3">
            {/* Key badge */}
            <div className="w-8 h-8 rounded-lg border border-white/30 bg-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            {/* Icon + label */}
            <span className="text-lg">{info.icon}</span>
            <span className="text-white/90 font-medium text-sm">{info.desc}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
