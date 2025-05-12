import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';

const QuestionCard = ({ 
  question, 
  selectedAnswer, 
  isAnswerCorrect, 
  showExplanation, 
  onAnswerSelect, 
  onNextQuestion 
}) => {
  // Determine difficulty badge color
  const getDifficultyColor = () => {
    switch(question.difficulty) {
      case 'easy':
        return 'bg-emeraldGreen/70';
      case 'medium':
        return 'bg-royalGold/70';
      case 'hard':
        return 'bg-rubyRed/70';
      default:
        return 'bg-deepLapisLight/70';
    }
  };
  
  // Determine option styling based on selection and correct answer
  const getOptionStyle = (index) => {
    if (selectedAnswer === null) {
      return 'bg-deepLapisLight/50 hover:bg-deepLapisLight/70 cursor-pointer';
    }
    
    if (index === question.answer) {
      return 'bg-emeraldGreen/50 border-emeraldGreen';
    }
    
    if (index === selectedAnswer && selectedAnswer !== question.answer) {
      return 'bg-rubyRed/50 border-rubyRed';
    }
    
    return 'bg-deepLapisLight/30 opacity-70';
  };
  
  // Card animation variants
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };
  
  return (
    <motion.div 
      className="bg-deepLapisLight/30 rounded-lg border border-royalGold/30 overflow-hidden"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Question header */}
      <div className="p-4 border-b border-royalGold/20">
        <div className="flex justify-between items-start mb-3">
          <span className={`px-3 py-1 rounded-full text-xs text-white ${getDifficultyColor()}`}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
          <span className="px-3 py-1 bg-deepLapisLight/50 rounded-full text-xs text-white/80">
            {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
          </span>
        </div>
        <h3 className="text-lg text-white font-medium">
          {question.question}
        </h3>
      </div>
      
      {/* Answer options */}
      <div className="p-4">
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => (
            <motion.div
              key={`option-${index}`}
              className={`p-3 border border-royalGold/20 rounded-md ${getOptionStyle(index)}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              onClick={() => selectedAnswer === null && onAnswerSelect(index)}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full border border-royalGold/50 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm text-white">{String.fromCharCode(65 + index)}</span>
                </div>
                <span className="text-white">{option}</span>
                
                {/* Show check/x icon after answer selection */}
                {selectedAnswer !== null && index === question.answer && (
                  <Icon name="check" size={18} color="#00C853" className="ml-auto" />
                )}
                {selectedAnswer === index && index !== question.answer && (
                  <Icon name="x" size={18} color="#F44336" className="ml-auto" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Feedback after answering */}
        {selectedAnswer !== null && !showExplanation && (
          <motion.div 
            className={`p-4 rounded-md ${isAnswerCorrect ? 'bg-emeraldGreen/20' : 'bg-rubyRed/20'}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className={`text-center font-medium ${isAnswerCorrect ? 'text-emeraldGreen' : 'text-rubyRed'}`}>
              {isAnswerCorrect ? 'Correct! Your wisdom grows.' : 'Incorrect. Knowledge comes from learning.'}
            </p>
          </motion.div>
        )}
        
        {/* Explanation */}
        {showExplanation && (
          <motion.div
            className="p-4 bg-royalGold/10 rounded-md border border-royalGold/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h4 className="text-royalGold font-medium mb-2">Ancient Wisdom</h4>
            <p className="text-white/90">{question.explanation}</p>
            
            <div className="mt-4 text-center">
              <Button 
                variant="primary" 
                onClick={onNextQuestion}
                icon={<Icon name="arrow" size={16} />}
                iconPosition="right"
              >
                Continue Journey
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Persian decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100">
          <path d="M50,5 L95,50 L50,95 L5,50 L50,5 z" fill="currentColor" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M50,20 L55,40 L75,50 L55,60 L50,80 L45,60 L25,50 L45,40 z" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </motion.div>
  );
};

export default QuestionCard;