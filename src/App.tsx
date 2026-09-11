import { AnimatePresence, motion } from 'motion/react';
import { GardenProvider, useGarden } from './state/garden';
import Arrival from './scenes/Arrival';
import Garden from './scenes/Garden';
import Bouquet from './scenes/Bouquet';

function Shell() {
  const { state, dispatch } = useGarden();

  return (
    <AnimatePresence mode="wait">
      {state.phase === 'arrival' && (
        <motion.div key="arrival" exit={{ opacity: 0.4 }} style={{ display: 'contents' }}>
          <Arrival onEnter={() => dispatch({ type: 'swipe-arrival' })} />
        </motion.div>
      )}
      {(state.phase === 'garden' || state.phase === 'after') && (
        <motion.div
          key="garden"
          initial={{ scale: 1.1, y: -40, opacity: 0.6 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ opacity: 0.3, scale: 1.05 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'contents' }}
        >
          <Garden onToBouquet={() => dispatch({ type: 'to-bouquet' })} />
        </motion.div>
      )}
      {state.phase === 'bouquet' && (
        <motion.div key="bouquet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'contents' }}>
          <Bouquet onDone={() => dispatch({ type: 'bouquet-done' })} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <GardenProvider>
      <Shell />
    </GardenProvider>
  );
}
