export const SKILL_CATEGORIES = {
  'Software & Web Development': [
    'Python', 'Java', 'JavaScript/TypeScript', 'React/React Native', 'C#', 'C++', 'PHP',
    'Web Development', 'Mobile App Development', 'Backend Development', 'Frontend Development', 'API Development',
  ],
  'AI, Data & Analytics': [
    'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Data Analytics', 'Big Data',
  ],
  'Cloud, Infrastructure & Security': [
    'Cloud Computing', 'DevOps', 'Database Management', 'Computer Networking', 'Cybersecurity', 'IT Infrastructure',
  ],
  'Design & UX': [
    'UI/UX Design', 'Graphic Design', 'Product Design',
  ],
  'Business & Management': [
    'Business Analysis', 'Project Management', 'Digital Marketing', 'Sales', 'Communication & Leadership', 'Entrepreneurship',
  ],
  'Emerging Tech': [
    'Blockchain', 'FinTech', 'Robotics & IoT', 'Research & Innovation',
  ],
} as const;

// Flat list -- used for storing/matching. "Other" is handled separately
// via a free-text field (interests_other / skills_sought_other / skills_required_other),
// never added to this array, so custom entries don't participate in tag-overlap matching.
export const SKILL_TAGS = Object.values(SKILL_CATEGORIES).flat();
