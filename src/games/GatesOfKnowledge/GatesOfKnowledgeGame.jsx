import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GameLayout from '../../components/templates/GameLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import QuestionCard from './QuestionCard';
import useGameState from '../../hooks/useGameState';
import useAuth from '../../hooks/useAuth';
import { useGameReward } from '../../contexts/GameRewardContext';
import GameMasteryDisplay from '../../components/molecules/GameMasteryDisplay';
import RewardNotification from '../../components/molecules/RewardNotification';

// Sample questions database
const questionsDatabase = [
  {
    id: 1,
    question: "Which Persian philosopher is known as the 'Father of Medicine'?",
    options: ["Ibn Sina (Avicenna)", "Al-Farabi", "Ibn Rushd (Averroes)", "Al-Razi"],
    answer: 0,
    difficulty: "easy",
    explanation: "Ibn Sina, known as Avicenna in the West, wrote 'The Canon of Medicine' which was a standard medical text for centuries.",
    category: "medicine"
  },
  {
    id: 2,
    question: "Which philosopher's works on optics influenced Newton and Descartes?",
    options: ["Ibn Rushd", "Al-Kindi", "Ibn al-Haytham", "Omar Khayyam"],
    answer: 2,
    difficulty: "medium",
    explanation: "Ibn al-Haytham (Alhazen) wrote the Book of Optics which established the scientific method and transformed our understanding of light and vision.",
    category: "science"
  },
  {
    id: 3,
    question: "Which Persian scholar wrote 'The Book of Healing', an encyclopedic work covering logic, physics, and metaphysics?",
    options: ["Al-Farabi", "Ibn Sina (Avicenna)", "Al-Ghazali", "Ibn Rushd"],
    answer: 1,
    difficulty: "medium",
    explanation: "Ibn Sina (Avicenna) wrote 'The Book of Healing' as a comprehensive philosophical and scientific encyclopedia.",
    category: "philosophy"
  },
  {
    id: 4,
    question: "Who wrote the 'Rubaiyat', a collection of quatrains that offers insights into existence and the human condition?",
    options: ["Rumi", "Hafez", "Omar Khayyam", "Ferdowsi"],
    answer: 2,
    difficulty: "easy",
    explanation: "Omar Khayyam, also known for his contributions to mathematics and astronomy, wrote the Rubaiyat, famously translated by Edward FitzGerald.",
    category: "literature"
  },
  {
    id: 5,
    question: "Which Islamic philosopher is known for his critique of Aristotelian metaphysics in 'The Incoherence of the Philosophers'?",
    options: ["Ibn Rushd", "Al-Farabi", "Al-Ghazali", "Ibn Sina"],
    answer: 2,
    difficulty: "hard",
    explanation: "Al-Ghazali's critique challenged Aristotelian thought in the Islamic world and influenced later Western scholastic debates.",
    category: "philosophy"
  },
  {
    id: 6,
    question: "Which Persian polymath made significant contributions to algebra, introducing systematic solutions for quadratic and cubic equations?",
    options: ["Al-Khwarizmi", "Omar Khayyam", "Ibn al-Haytham", "Al-Biruni"],
    answer: 0,
    difficulty: "medium",
    explanation: "Al-Khwarizmi's work 'The Compendious Book on Calculation by Completion and Balancing' established algebra as an independent mathematical discipline.",
    category: "mathematics"
  },
  {
    id: 7,
    question: "The concept of 'Practical Wisdom' (phronesis) was central to which philosopher's ethics?",
    options: ["Ibn Sina", "Al-Farabi", "Aristotle", "Al-Ghazali"],
    answer: 2,
    difficulty: "medium",
    explanation: "Aristotle emphasized practical wisdom as the capacity to know how to achieve the good in a concrete situation, through deliberation and experience.",
    category: "ethics"
  },
  {
    id: 8,
    question: "What mathematical concept did Persian scholars develop which is now essential in modern calculus?",
    options: ["Logarithms", "Algebra", "Trigonometry", "Algorithms"],
    answer: 2,
    difficulty: "hard",
    explanation: "Persian mathematicians, particularly Nasir al-Din al-Tusi, made significant advancements in trigonometry as a separate mathematical discipline from astronomy.",
    category: "mathematics"
  },
  {
    id: 9,
    question: "Which Persian philosopher described a thought experiment similar to the 'Brain in a Vat' scenario?",
    options: ["Ibn Sina (Avicenna)", "Suhrawardi", "Ibn Rushd", "Al-Farabi"],
    answer: 0,
    difficulty: "hard",
    explanation: "Ibn Sina proposed the 'Floating Man' thought experiment, asking readers to imagine being created suspended in air, unable to perceive anything, to demonstrate self-awareness.",
    category: "philosophy"
  },
  {
    id: 10,
    question: "Which text is considered the most important work in Arabic literature, containing tales like Aladdin and Ali Baba?",
    options: ["Shahnameh", "Masnavi", "One Thousand and One Nights", "Conference of the Birds"],
    answer: 2,
    difficulty: "easy",
    explanation: "One Thousand and One Nights (Arabian Nights) is a collection of folk tales compiled during the Islamic Golden Age, framed by the story of Scheherazade.",
    category: "literature"
  },
  {
    id: 11,
    question: "Which Persian scientist accurately calculated the Earth's circumference and radius in the 10th century?",
    options: ["Al-Biruni", "Ibn al-Haytham", "Al-Khwarizmi", "Al-Farabi"],
    answer: 0,
    difficulty: "hard",
    explanation: "Al-Biruni calculated the Earth's radius with remarkable accuracy using trigonometry and was a pioneer in several scientific fields.",
    category: "astronomy"
  },
  {
    id: 12,
    question: "The concept of 'Unity of Being' (Wahdat al-Wujud) is central to which Sufi philosopher's teachings?",
    options: ["Rumi", "Ibn Arabi", "Al-Ghazali", "Suhrawardi"],
    answer: 1,
    difficulty: "medium",
    explanation: "Ibn Arabi developed the concept of 'Unity of Being,' suggesting that all existence is a manifestation of the Divine Reality.",
    category: "spirituality"
  }
];

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
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [wisdomPointsEarned, setWisdomPointsEarned] = useState(0);
  
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
  
  // Start game with selected options
  const startGame = () => {
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
    setWisdomPointsEarned(0);
    
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
    const isCorrect = answerIndex === currentQuestion.answer;
    setIsAnswerCorrect(isCorrect);
    
    // Award points if correct
    if (isCorrect) {
      const pointsAwarded = POINTS_PER_QUESTION[currentQuestion.difficulty] || 10;
      setScore(prevScore => prevScore + pointsAwarded);
      
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
  const endGame = () => {
    setGameOver(true);
    
    // Calculate wisdom points to award (1 point for every 10 score points)
    const wisdom = Math.floor(score / 10);
    setWisdomPointsEarned(wisdom);
    
    if (wisdom > 0) {
      updateUserPoints(wisdom);
    }
    
    // Calculate correct answers
    const correctAnswers = Math.floor(score / 10);
    const correctPercentage = Math.floor((correctAnswers / questionsAnswered) * 100);
    
    // Award completion reward based on score and percentage correct
    let difficultyModifier = 1;
    if (selectedDifficulty === 'medium') {
      difficultyModifier = 1.5;
    } else if (selectedDifficulty === 'hard') {
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
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto h-full overflow-hidden">
        {!gameStarted ? (
          // Game start screen
          <motion.div 
            className="w-full text-center py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GameMasteryDisplay gameId="gates-of-knowledge" />
            
            <h1 className="text-2xl font-primary text-royalGold mb-3"></h1>
            <p className="text-white/80 mb-6"></p>
            
            <div className="mb-6 p-4 bg-deepLapisLight/30 rounded-lg border border-royalGold/30">
              <p className="text-royalGold font-medium mb-3">Choose Your Path</p>
              
              {/* Difficulty selection */}
              <div className="mb-4">
                <p className="text-white text-sm mb-2">Difficulty:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['all', 'easy', 'medium', 'hard'].map(diff => (
                    <Button
                      key={diff}
                      variant={selectedDifficulty === diff ? "primary" : "outline"}
                      size="small"
                      onClick={() => setSelectedDifficulty(diff)}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Category selection */}
              <div>
                <p className="text-white text-sm mb-2">Category:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['all', 'philosophy', 'science', 'mathematics', 'literature', 'ethics', 'spirituality'].map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "primary" : "outline"}
                      size="small"
                      onClick={() => setSelectedCategory(cat)}
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
            
            <div className="p-3 rounded-md bg-deepLapisLight/50 text-sm text-white/70">
              <p>
                <span className="text-royalGold font-medium block">Game Rules:</span>
                Answer {MAX_QUESTIONS} questions to complete your quest. More difficult questions award more wisdom points.
                The ancient scrolls contain explanations to enlighten you after each answer.
              </p>
            </div>
            
            {/* Stats display */}
            {gameData?.stats && (
              <div className="mt-6 p-3 bg-deepLapisLight/30 rounded-lg">
                <p className="text-royalGold font-medium mb-2">Your Wisdom Journey</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-deepLapis/50 p-2 rounded">
                    <p className="text-white/70">Questions Answered</p>
                    <p className="text-white text-lg">{gameData.stats.questionsAnswered || 0}</p>
                  </div>
                  <div className="bg-deepLapis/50 p-2 rounded">
                    <p className="text-white/70">Wisdom Earned</p>
                    <p className="text-royalGold text-lg">{gameData.stats.wisdomEarned || 0}</p>
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
            <div className="flex justify-between items-center mb-4">
              <div className="py-2 px-4 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Question</p>
                <p className="text-lg text-white">{questionsAnswered + 1}/{Math.min(MAX_QUESTIONS, availableQuestions.length)}</p>
              </div>
              
              <div className="py-2 px-4 bg-deepLapisLight/50 rounded-md">
                <p className="text-xs text-white/70">Score</p>
                <p className="text-lg text-royalGold">{score}</p>
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
                    <p className="text-xl text-white">{Math.floor(score / 10)}/{questionsAnswered}</p>
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