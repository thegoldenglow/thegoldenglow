import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import GameLayout from '../../components/templates/GameLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import QuestionCard from './QuestionCard';
import useGameState from '../../hooks/useGameState';
import useAuth from '../../hooks/useAuth';
import { useGameReward } from '../../contexts/GameRewardContext';
import GameMasteryDisplay from '../../components/molecules/GameMasteryDisplay';
import RewardNotification from '../../components/molecules/RewardNotification';
import { saveGameScoreAndUpdatePoints } from '../../utils/gameScoreManager';
import { ActivityTracker, trackGameActivity } from '../../utils/activityTracker';

const GatesOfKnowledgeGame = () => {
  const navigate = useNavigate();
  const { updateUserPoints } = useAuth();
  const { gameData, isUnlocked, loading, saveProgress, saveStats } = useGameState('gates-of-knowledge');
  const { awardGameReward } = useGameReward();
  const [rewardNotification, setRewardNotification] = useState(null);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [questionsDatabase, setQuestionsDatabase] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [wisdomPointsEarned, setWisdomPointsEarned] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameSessionId, setGameSessionId] = useState(null);
  
  // Game constants
  const MAX_QUESTIONS = 10;
  const POINTS_PER_QUESTION = {
    easy: 10,
    medium: 20,
    hard: 30
  };
  
  // Load saved stats
  useEffect(() => {
    if (!loading && gameData) {
      // Load saved stats if available
      const savedProgress = gameData.stats?.questionsAnswered || 0;
      const savedScore = gameData.stats?.totalScore || 0;
      
      // Update progress
      if (savedProgress > 0) {
        saveProgress(Math.min((savedProgress / 100) * 100, 100));
      }
    }
  }, [loading, gameData]);
  
  // Fetch questions from Supabase on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('gates_questions')
        .select('*');
      if (error) {
        console.error('Error fetching questions:', error);
        setQuestionsDatabase([]);
      } else {
        setQuestionsDatabase(
          data.map((q) => {
            const rawAnswer = typeof q.correct_answer === 'number' ? q.correct_answer : parseInt(q.correct_answer, 10);
            const optionsLength = Array.isArray(q.options) ? q.options.length : 0;
            const normalizedAnswer = Number.isFinite(rawAnswer) && rawAnswer >= 0 && rawAnswer < optionsLength ? rawAnswer : 0;
            return ({
              id: q.id,
              question: q.question_text,
              options: q.options,
              answer: normalizedAnswer,
              difficulty: q.difficulty,
              category: q.category,
              explanation: q.explanation,
            });
          })
        );
      }
    };
    fetchQuestions();
  }, []);
  
  // Start game with selected options
  const startGame = async () => {
    // Filter questions based on selected difficulty and category
    let filteredQuestions = [...questionsDatabase];
    
    if (selectedDifficulty !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === selectedDifficulty);
    }
    
    if (selectedCategory !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.category === selectedCategory);
    }
    
    // Shuffle questions
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
    setAvailableQuestions(shuffled);
    
    // Reset game state
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setWisdomPointsEarned(0);
    setGameStartTime(Date.now());
    
    // Generate session ID and track game start
    const sessionId = `gates-of-knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setGameSessionId(sessionId);
    
    // Track game start activity
    ActivityTracker.gameStart('gates-of-knowledge', sessionId);
    await trackGameActivity({
      type: 'game_start',
      gameType: 'gates-of-knowledge',
      sessionId,
      data: {
        difficulty: selectedDifficulty,
        category: selectedCategory,
        availableQuestions: shuffled.length
      }
    });
    
    // Award participation reward based on difficulty selection
    let difficultyModifier = 1;
    if (selectedDifficulty === 'medium') {
      difficultyModifier = 1.5;
    } else if (selectedDifficulty === 'hard') {
      difficultyModifier = 2;
    }
    
    // Award participation reward
    const participationReward = awardGameReward('gates-of-knowledge', 'participation', { 
      difficulty: selectedDifficulty,
      difficultyModifier,
      category: selectedCategory
    });
    
    if (participationReward > 0) {
      setRewardNotification({
        amount: participationReward,
        source: 'Quest Started'
      });
      
      // Clear notification after a few seconds
      setTimeout(() => setRewardNotification(null), 3000);
    }
    
    // Set first question
    if (shuffled.length > 0) {
      setCurrentQuestion(shuffled[0]);
    } else {
      // If no questions match criteria, show error and reset
      alert('No questions available with selected filters. Please try different options.');
      setGameStarted(false);
    }
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === Number(currentQuestion.answer);
    setIsAnswerCorrect(isCorrect);
    
    // Award points if correct
    if (isCorrect) {
      const pointsAwarded = POINTS_PER_QUESTION[currentQuestion.difficulty] || 10;
      setScore(prevScore => prevScore + pointsAwarded);
      setCorrectAnswers(prevCount => prevCount + 1);
      
      // Award GC for correct answer based on difficulty
      const correctAnswerReward = awardGameReward('gates-of-knowledge', 'correctAnswer', {
        difficulty: currentQuestion.difficulty,
        questionId: currentQuestion.id,
        category: currentQuestion.category
      });
      
      if (correctAnswerReward > 0) {
        setRewardNotification({
          amount: correctAnswerReward,
          source: 'Correct Answer!'
        });
        
        // Clear notification after a few seconds
        setTimeout(() => setRewardNotification(null), 2000);
      }
    }
    
    // Show explanation after answer
    setTimeout(() => {
      setShowExplanation(true);
    }, 1000);
  };
  
  // Move to next question
  const handleNextQuestion = () => {
    // Reset states
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setShowExplanation(false);
    
    // Update questions answered
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    
    // Check if game is over
    if (newQuestionsAnswered >= MAX_QUESTIONS || newQuestionsAnswered >= availableQuestions.length) {
      endGame();
    } else {
      // Set next question
      setCurrentQuestion(availableQuestions[newQuestionsAnswered]);
    }
  };
  
  // End game and calculate results
  const endGame = async () => {
    setGameOver(true);
    
    // Calculate game duration
    const gameDuration = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
    
    // Calculate wisdom points to award (1 point for every 10 score points)
    const wisdom = Math.floor(score / 10);
    setWisdomPointsEarned(wisdom);
    
    // Track game end activity
    if (gameSessionId) {
      ActivityTracker.gameEnd('gates-of-knowledge', gameSessionId, score, gameDuration);
      await trackGameActivity({
        type: 'game_end',
        gameType: 'gates-of-knowledge',
        sessionId: gameSessionId,
        score,
        timeElapsed: gameDuration,
        pointsEarned: wisdom,
        data: {
          questionsAnswered,
          correctAnswers,
          correctPercentage: questionsAnswered > 0 ? Math.floor((correctAnswers / questionsAnswered) * 100) : 0,
          difficulty: selectedDifficulty,
          category: selectedCategory
        }
      });
    }
    
    // Calculate correct percentage using actual correct answers
    const correctPercentage = questionsAnswered > 0 ? Math.floor((correctAnswers / questionsAnswered) * 100) : 0;
    
    // Calculate difficulty modifier
    let difficultyModifier = 1;
    if (selectedDifficulty === 'medium') {
      difficultyModifier = 1.5;
    } else if (selectedDifficulty === 'hard') {
      difficultyModifier = 2;
    }
    
    // Save score to database and update user points
    try {
      const result = await saveGameScoreAndUpdatePoints({
        gameType: 'gates-of-knowledge',
        score: score,
        pointsEarned: wisdom,
        duration: gameDuration,
        completed: true,
        gameData: {
          questionsAnswered: questionsAnswered,
          correctAnswers: correctAnswers,
          correctPercentage: correctPercentage,
          difficulty: selectedDifficulty,
          category: selectedCategory,
          difficultyModifier: difficultyModifier
        }
      });
      
      if (result.success) {
        console.log('Game score saved successfully:', result.data);
      } else {
        console.error('Failed to save game score:', result.error);
      }
    } catch (error) {
      console.error('Error saving game score:', error);
    }
    
    if (wisdom > 0) {
      updateUserPoints(wisdom);
    }
    
    // Award completion reward based on score and percentage correct
    // Using existing correctAnswers, correctPercentage, and difficultyModifier variables from above
    if (selectedDifficulty === 'hard') {
      difficultyModifier = 2;
    }
    
    // Award game completion reward
    const completionReward = awardGameReward('gates-of-knowledge', 'completion', {
      score,
      correctAnswers,
      totalQuestions: questionsAnswered,
      correctPercentage,
      difficulty: selectedDifficulty,
      difficultyModifier,
      category: selectedCategory
    });
    
    if (completionReward > 0) {
      setTimeout(() => {
        setRewardNotification({
          amount: completionReward,
          source: 'Quest Complete!'
        });
        setTimeout(() => setRewardNotification(null), 3000);
      }, 500);
    }
    
    // Check for achievements (high score, perfect score)
    const currentHighScore = gameData?.stats?.highestScore || 0;
    if (score > currentHighScore) {
      // Award new high score achievement
      const highScoreReward = awardGameReward('gates-of-knowledge', 'achievement', {
        type: 'highScore',
        newHighScore: score,
        previousHighScore: currentHighScore
      });
      
      if (highScoreReward > 0) {
        setTimeout(() => {
          setRewardNotification({
            amount: highScoreReward,
            source: 'New High Score!'
          });
          setTimeout(() => setRewardNotification(null), 3000);
        }, 3000);
      }
    }
    
    // Check for perfect score (all answers correct)
    if (correctAnswers === questionsAnswered && questionsAnswered >= 5) {
      // Award perfect score achievement
      const perfectScoreReward = awardGameReward('gates-of-knowledge', 'achievement', {
        type: 'perfectScore',
        questionsAnswered
      });
      
      if (perfectScoreReward > 0) {
        setTimeout(() => {
          setRewardNotification({
            amount: perfectScoreReward,
            source: 'Perfect Score!'
          });
          setTimeout(() => setRewardNotification(null), 3000);
        }, 5500);
      }
    }
    
    // Save stats
    saveStats({
      questionsAnswered: gameData?.stats?.questionsAnswered 
        ? gameData.stats.questionsAnswered + questionsAnswered 
        : questionsAnswered,
      questionsCorrect: gameData?.stats?.questionsCorrect 
        ? gameData.stats.questionsCorrect + correctAnswers 
        : correctAnswers,
      totalScore: gameData?.stats?.totalScore 
        ? gameData.stats.totalScore + score 
        : score,
      highestScore: Math.max(currentHighScore, score),
      gamesPlayed: gameData?.stats?.gamesPlayed 
        ? gameData.stats.gamesPlayed + 1 
        : 1,
      wisdomEarned: gameData?.stats?.wisdomEarned 
        ? gameData.stats.wisdomEarned + wisdom 
        : wisdom
    });
    
    // Update progress (based on total questions answered)
    const totalAnswered = (gameData?.stats?.questionsAnswered || 0) + questionsAnswered;
    saveProgress(Math.min((totalAnswered / 100) * 100, 100));
  };
  
  // Handle back button
  const handleBack = () => {
    if (gameStarted && !gameOver) {
      if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };
  
  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setShowExplanation(false);
  };
  
  // Loading state
  if (loading) {
    return (
      <GameLayout 
        title="Gates of Knowledge"
        gameType="quiz"
        onBackClick={handleBack}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-royalGold border-t-transparent rounded-full" />
        </div>
      </GameLayout>
    );
  }
  
  // Game not unlocked
  if (!isUnlocked) {
    return (
      <GameLayout 
        title="Gates of Knowledge"
        gameType="quiz"
        onBackClick={handleBack}
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-20 h-20 bg-deepLapisLight rounded-full flex items-center justify-center mb-4">
            <Icon name="lock" size={32} color="#DAA520" />
          </div>
          <h2 className="text-xl font-primary text-royalGold mb-2">Game Locked</h2>
          <p className="text-white/70 max-w-md mb-6">
            The ancient scrolls of wisdom remain sealed. Continue your journey to unlock this repository of knowledge.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
          >
            Return to Journey
          </Button>
        </div>
      </GameLayout>
    );
  }
  
  return (
    <GameLayout 
      title="Gates of Knowledge"
      gameType="quiz"
      onBackClick={handleBack}
      backgroundPattern="arabesque"
    >
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto h-full overflow-y-auto px-2">
        {!gameStarted ? (
          // Game start screen
          <motion.div 
            className="w-full text-center py-2 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameMasteryDisplay gameId="gates-of-knowledge" />
            
            <h1 className="text-2xl font-primary text-royalGold mb-3"></h1>
            <p className="text-white/80 mb-6"></p>
            
            <div className="mb-4 p-3 bg-deepLapisLight/30 rounded-lg border border-royalGold/30">
              <p className="text-royalGold font-medium mb-2 text-sm">Choose Your Path</p>
              
              {/* Difficulty selection */}
              <div className="mb-3">
                <p className="text-white text-xs mb-1">Difficulty:</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {['all', 'easy', 'medium', 'hard'].map(diff => (
                    <Button
                      key={diff}
                      variant={selectedDifficulty === diff ? "primary" : "outline"}
                      size="small"
                      onClick={() => setSelectedDifficulty(diff)}
                      className="text-xs px-2 py-1"
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Category selection */}
              <div>
                <p className="text-white text-xs mb-1">Category:</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {['all', 'philosophy', 'science', 'mathematics', 'literature', 'ethics', 'spirituality'].map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "primary" : "outline"}
                      size="small"
                      onClick={() => setSelectedCategory(cat)}
                      className="text-xs px-2 py-1"
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              fullWidth
              icon={<Icon name="book" size={18} />}
              onClick={startGame}
              className="mb-4"
            >
              Begin Quest for Knowledge
            </Button>
            
            <div className="p-2 rounded-md bg-deepLapisLight/50 text-xs text-white/70">
              <p>
                <span className="text-royalGold font-medium block text-sm">Game Rules:</span>
                Answer {MAX_QUESTIONS} questions to complete your quest. More difficult questions award more wisdom points.
                The ancient scrolls contain explanations to enlighten you after each answer.
              </p>
            </div>
            
            {/* Stats display */}
            {gameData?.stats && (
              <div className="mt-3 p-2 bg-deepLapisLight/30 rounded-lg">
                <p className="text-royalGold font-medium mb-1 text-sm">Your Wisdom Journey</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-deepLapis/50 p-2 rounded">
                    <p className="text-white/70">Questions Answered</p>
                    <p className="text-white text-sm">{gameData.stats.questionsAnswered || 0}</p>
                  </div>
                  <div className="bg-deepLapis/50 p-2 rounded">
                    <p className="text-white/70">Wisdom Earned</p>
                    <p className="text-royalGold text-sm">{gameData.stats.wisdomEarned || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // Active game
          <motion.div 
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Game header */}
            <div className="flex justify-between items-center mb-2">
              <div className="py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Question</p>
                <p className="text-sm text-white">{questionsAnswered + 1}/{Math.min(MAX_QUESTIONS, availableQuestions.length)}</p>
              </div>
              
              <div className="py-1 px-3 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Score</p>
                <p className="text-sm text-royalGold">{score}</p>
              </div>
            </div>
            
            {/* Question card */}
            {currentQuestion && !gameOver && (
              <QuestionCard
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                isAnswerCorrect={isAnswerCorrect}
                showExplanation={showExplanation}
                onAnswerSelect={handleAnswerSelect}
                onNextQuestion={handleNextQuestion}
              />
            )}
            
            {/* Game over screen */}
            {gameOver && (
              <motion.div
                className="bg-deepLapisLight/30 rounded-lg p-6 border border-royalGold/40"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-primary text-royalGold text-center mb-3">Quest Complete!</h2>
                <p className="text-white text-center mb-6">
                  You have journeyed through the ancient wisdom and answered {questionsAnswered} questions.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-deepLapis/60 p-3 rounded-md text-center">
                    <p className="text-white/70 text-sm">Final Score</p>
                    <p className="text-xl text-royalGold">{score}</p>
                  </div>
                  <div className="bg-deepLapis/60 p-3 rounded-md text-center">
                    <p className="text-white/70 text-sm">Correct Answers</p>
                    <p className="text-xl text-white">{correctAnswers}/{questionsAnswered}</p>
                  </div>
                </div>
                
                {wisdomPointsEarned > 0 && (
                  <div className="bg-royalGold/20 p-3 rounded-lg text-center mb-6">
                    <p className="text-royalGold">+{wisdomPointsEarned} Wisdom Points Earned</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="primary" 
                    onClick={startGame}
                    icon={<Icon name="game" size={18} />}
                  >
                    New Quest
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetGame}
                    icon={<Icon name="settings" size={18} />}
                  >
                    Change Settings
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Reward notification */}
      {rewardNotification && (
        <RewardNotification 
          amount={rewardNotification.amount} 
          source={rewardNotification.source} 
        />
      )}
    </GameLayout>
  );
};

export default GatesOfKnowledgeGame;