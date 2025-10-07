import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';

const QuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    options: [],
    correct_answer: 0,
    difficulty: 'easy',
    category: '',
    explanation: ''
  });

  // Ensure correct_answer is always a number and within bounds
  const safeCorrectAnswer = typeof newQuestion.correct_answer === 'number' &&
                           newQuestion.correct_answer >= 0 &&
                           newQuestion.correct_answer < newQuestion.options.length
                           ? newQuestion.correct_answer
                           : 0;
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gates_questions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionsChange = (index, value) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setNewQuestion(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newQuestion, correct_answer: safeCorrectAnswer };
      if (editingId) {
        const { error } = await supabase
          .from('gates_questions')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('gates_questions')
          .insert([payload]);
        if (error) throw error;
      }
      setNewQuestion({
        question_text: '',
        options: [],
        correct_answer: 0,
        difficulty: 'easy',
        category: '',
        explanation: ''
      });
      fetchQuestions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (question) => {
    const optionsLength = Array.isArray(question.options) ? question.options.length : 0;
    const rawIdx = typeof question.correct_answer === 'number' ? question.correct_answer : parseInt(question.correct_answer, 10);
    const normalizedIdx = Number.isFinite(rawIdx) && rawIdx >= 0 && rawIdx < optionsLength ? rawIdx : 0;
    const sanitized = {
      ...question,
      question_text: question.question_text || '',
      options: question.options || [],
      correct_answer: normalizedIdx,
      difficulty: question.difficulty || 'easy',
      category: question.category || '',
      explanation: question.explanation || ''
    };
    setNewQuestion(sanitized);
    setEditingId(question.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const { error } = await supabase
          .from('gates_questions')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchQuestions();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 bg-deepLapis text-textLight">
      <h1 className="text-2xl font-bold mb-6 text-royalGold">Gate's Questions Management</h1>
      <form onSubmit={handleSubmit} className="mb-8 bg-deepLapisDark p-6 rounded-lg shadow-glow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">Question Text</label>
            <input
              type="text"
              name="question_text"
              value={newQuestion.question_text}
              onChange={handleInputChange}
              placeholder="Enter question text"
              className="w-full p-2 rounded bg-textLight text-deepLapis"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Difficulty</label>
            <select
              name="difficulty"
              value={newQuestion.difficulty}
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-textLight text-deepLapis"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">Category</label>
            <input
              type="text"
              name="category"
              value={newQuestion.category}
              onChange={handleInputChange}
              placeholder="Enter category"
              className="w-full p-2 rounded bg-textLight text-deepLapis"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">Explanation</label>
            <textarea
              name="explanation"
              value={newQuestion.explanation}
              onChange={handleInputChange}
              placeholder="Enter explanation"
              className="w-full p-2 rounded bg-textLight text-deepLapis h-24"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">Options (Select the correct one)</label>
            {newQuestion.options.map((opt, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  id={`correct-${index}`}
                  name="correct_answer"
                  checked={safeCorrectAnswer === index}
                  onChange={() => setNewQuestion(prev => ({ ...prev, correct_answer: index }))}
                  className="mr-2"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionsChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-2 rounded bg-textLight text-deepLapis"
                  required
                />
              </div>
            ))}
            <button type="button" onClick={addOption} className="px-4 py-2 bg-royalGold text-deepLapis rounded">Add Option</button>
          </div>
        </div>
        <button type="submit" className="mt-4 px-6 py-2 bg-royalGold text-deepLapis rounded">{editingId ? 'Update' : 'Add'} Question</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questions.map(q => (
          <div key={q.id} className="p-4 border rounded-lg bg-deepLapisDark shadow-glow">
            <p className="font-bold mb-2">{q.question_text}</p>
            <p className="text-sm mb-2">Difficulty: {q.difficulty}</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => handleEdit(q)} className="px-3 py-1 bg-royalGold text-deepLapis rounded">Edit</button>
              <button onClick={() => handleDelete(q.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionManagement;