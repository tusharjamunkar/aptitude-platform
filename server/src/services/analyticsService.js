const calculateTopicPerformance = (answers) => {
  const topics = {};
  
  answers.forEach(ans => {
    const topic = ans.question.topic;
    if (!topics[topic]) {
      topics[topic] = { total: 0, correct: 0 };
    }
    topics[topic].total++;
    if (ans.isCorrect) {
      topics[topic].correct++;
    }
  });

  return Object.entries(topics).map(([topic, data]) => ({
    topic,
    totalQuestions: data.total,
    correctAnswers: data.correct,
    avgPercentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    isWeak: data.total > 0 && (data.correct / data.total) * 100 < 60
  }));
};

const calculateWeakTopics = (topicPerformance) => {
  return topicPerformance.filter(t => t.isWeak);
};

module.exports = { calculateTopicPerformance, calculateWeakTopics };
