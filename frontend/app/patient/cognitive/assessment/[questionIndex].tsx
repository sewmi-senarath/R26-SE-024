// the single question engine screen
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAssessmentSession } from '@/src/hooks/useAssessmentSession';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { ProgressBar } from '@/src/components/patient/cognitive/components/progressBar';
import { TimerBar } from '@/src/components/patient/cognitive/components/renderers/timeBar';
import { MCQRenderer } from '@/src/components/patient/cognitive/components/renderers/mcqRenderer';
import { WordRecallRenderer } from '@/src/components/patient/cognitive/components/renderers/wordRecallRenderer';
import { SerialSubtractionRenderer } from '@/src/components/patient/cognitive/components/renderers/serialSubtractionRenderer';
import { Question } from '@/src/types/assessment.types';
import { ImageMcqRenderer } from '@/src/components/patient/cognitive/components/renderers/imageMcqRenderer';
import { PhraseRepeatRenderer } from '@/src/components/patient/cognitive/components/renderers/phraseRepeatRenderer';
import { InstructionActionRenderer } from '@/src/components/patient/cognitive/components/renderers/instructionActionRenderer';
// You'll pass patientId and clinicianId via route params or context
// For now hardcoding for development
const PATIENT_ID = 'patient_001';
const CAREGIVER_ID = 'caregiver-001';

export default function QuestionScreen() {
  const router = useRouter();
  const {
    session,
    currentQuestion,
    progressPercent,
    submitAnswer,
    goToNext,
    goToPrev,
    markTimeExpired,
  } = useAssessmentSession(PATIENT_ID, CAREGIVER_ID);

  const handleExpire = useCallback(() => {
    markTimeExpired();
  }, [markTimeExpired]);

  const timer = useQuestionTimer({
    limitSeconds: currentQuestion?.timeLimit ?? null,
    onExpire: handleExpire,
  });

  const handleAnswer = (answer: any) => {
    submitAnswer(currentQuestion.id, answer);
  };

  const handleNext = () => {
    if (session.status === 'done') {
      router.replace('/patient/cognitive/assessment/results');
    } else {
      goToNext();
    }
  };

  if (!currentQuestion) return null;

  const answered = currentQuestion.id in session.answers;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>

      {/* Top bar */}
      <ProgressBar
        current={session.currentQuestionIndex + 1}
        total={session.totalQuestions}
        sectionName={currentQuestion.section}
      />

      {/* Timer */}
      {currentQuestion.timeLimit && (
        <TimerBar
          secondsLeft={timer.secondsLeft}
          isWarning={timer.isWarning}
          timeLimit={currentQuestion.timeLimit}
        />
      )}

      <ScrollView className="flex-1" contentContainerClassName="pb-8">

        {/* Question prompt */}
        <View className="px-6 py-6">
          <Text className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">
            {currentQuestion.section}
          </Text>
          <Text className="text-2xl font-semibold text-gray-900 leading-snug">
            {currentQuestion.prompt}
          </Text>
          {currentQuestion.subPrompt && (
            <Text className="text-base text-gray-500 mt-2">
              {currentQuestion.subPrompt}
            </Text>
          )}
        </View>

        {/* Renderer — switch on question type */}
        <View className="mt-2">
          {renderQuestion(currentQuestion, handleAnswer)}
        </View>

      </ScrollView>

      {/* Bottom navigation */}
      <View className="px-6 pb-6 pt-3 gap-3 border-t border-gray-100 bg-white">
        <TouchableOpacity
          onPress={handleNext}
          disabled={!answered && !session.timeExpired}
          className={`py-4 rounded-2xl items-center ${
            answered || session.timeExpired ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <Text className={`font-semibold text-base ${
            answered || session.timeExpired ? 'text-white' : 'text-gray-400'
          }`}>
            {session.currentQuestionIndex === session.totalQuestions - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>

        {session.currentQuestionIndex > 0 && (
          <TouchableOpacity onPress={goToPrev} className="items-center py-2">
            <Text className="text-sm text-gray-400">Go back</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

// The renderer switch — clean and isolated
function renderQuestion(question: Question, onAnswer: (a: any) => void) {
  switch (question.type) {
    case 'mcq':
      return <MCQRenderer question={question} onAnswer={onAnswer} />;
    case 'image_mcq':
      return <ImageMcqRenderer question={question} onAnswer={onAnswer} />;
    case 'word_recall_display':
    case 'word_recall_input':
      return <WordRecallRenderer question={question} onAnswer={onAnswer} />;
    case 'serial_subtraction':
      return <SerialSubtractionRenderer question={question} onAnswer={onAnswer} />;
    case 'phrase_repeat' :
      return <PhraseRepeatRenderer question={question} onAnswer={onAnswer} />;
    case 'instruction_action':
      return <InstructionActionRenderer question={question} onAnswer={onAnswer} />;
    default:
      return (
        <View className="px-6">
          <Text className="text-gray-400 text-sm">Renderer for `{question.type}` coming soon</Text>
        </View>
      );
  }
}