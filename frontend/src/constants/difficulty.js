// 고정된 난이도 레벨 (5단계)
export const DIFFICULTY_LEVELS = [
  { value: 'VERY_EASY', label: '매우 쉬움', order: 1 },
  { value: 'EASY', label: '쉬움', order: 2 },
  { value: 'MEDIUM', label: '보통', order: 3 },
  { value: 'HARD', label: '어려움', order: 4 },
  { value: 'VERY_HARD', label: '매우 어려움', order: 5 }
];

export const getDifficultyLabel = (value) => {
  const level = DIFFICULTY_LEVELS.find(d => d.value === value);
  return level ? level.label : value;
};

export const getDifficultyColor = (value) => {
  const colors = {
    'VERY_EASY': '#4caf50',
    'EASY': '#8bc34a',
    'MEDIUM': '#ff9800',
    'HARD': '#ff5722',
    'VERY_HARD': '#f44336'
  };
  return colors[value] || '#666';
};
