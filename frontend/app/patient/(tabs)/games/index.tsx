import BrainGamesScreen from '@/src/components/patient/cognitive/components/games/BrainGamesScreen';
import { AssessmentProvider } from '@/src/context/AssessmentContext';

export default function BrainGamesTabRoute() {
  return (
    <AssessmentProvider>
      <BrainGamesScreen />
    </AssessmentProvider>
  );
}
