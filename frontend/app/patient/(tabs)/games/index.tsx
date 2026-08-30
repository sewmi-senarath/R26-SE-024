import BrainGamesScreen from '@/src/components/patient/cognitive/components/games/BrainGamesScreen';
import ScreeningPromptModal from '@/src/components/patient/cognitive/ScreeningPromptModal';
import { AssessmentProvider } from '@/src/context/AssessmentContext';

export default function BrainGamesTabRoute() {
  return (
    <AssessmentProvider>
      <ScreeningPromptModal />
      <BrainGamesScreen />
    </AssessmentProvider>
  );
}
