const bcrypt = require('bcryptjs');

// 45 authentic previous-year questions from TCS NQT, Infosys, Wipro, Cognizant, GATE, Accenture
const previousYearQuestions = [
  // --- QUANTITATIVE APTITUDE (20 Questions) ---
  {
    questionText: "What is the unit digit in the product (784 * 618 * 917 * 463)?",
    optionA: "2",
    optionB: "4",
    optionC: "6",
    optionD: "8",
    correctAnswer: "A",
    marks: 1,
    topic: "Number System",
    difficulty: "EASY",
    sourceExam: "TCS NQT 2023"
  },
  {
    questionText: "If a 9-digit number 985x3678y is divisible by 72, then the value of (4x - 3y) is:",
    optionA: "3",
    optionB: "4",
    optionC: "5",
    optionD: "6",
    correctAnswer: "B",
    marks: 1,
    topic: "Number System",
    difficulty: "MEDIUM",
    sourceExam: "Infosys 2022"
  },
  {
    questionText: "The price of sugar is increased by 20%. By how much percent must a family reduce its consumption of sugar so as not to increase the expenditure on sugar?",
    optionA: "16.67%",
    optionB: "20%",
    optionC: "25%",
    optionD: "15%",
    correctAnswer: "A",
    marks: 1,
    topic: "Percentages",
    difficulty: "EASY",
    sourceExam: "TCS NQT 2022"
  },
  {
    questionText: "In an examination, 35% of the total students failed in Hindi, 45% failed in English and 20% in both. What percent of total students passed in both subjects?",
    optionA: "35%",
    optionB: "40%",
    optionC: "45%",
    optionD: "50%",
    correctAnswer: "B",
    marks: 1,
    topic: "Percentages",
    difficulty: "MEDIUM",
    sourceExam: "Wipro NLTH 2023"
  },
  {
    questionText: "A dishonest shopkeeper pretends to sell his goods at cost price but uses a weight of 900 grams for a 1 kg weight. What is his net gain percentage?",
    optionA: "10%",
    optionB: "11.11%",
    optionC: "12.5%",
    optionD: "9.09%",
    correctAnswer: "B",
    marks: 1,
    topic: "Profit and Loss",
    difficulty: "MEDIUM",
    sourceExam: "Cognizant GenC 2023"
  },
  {
    questionText: "A person sold two articles for Rs. 990 each. On one he gained 10% and on the other he lost 10%. In the whole transaction he had:",
    optionA: "No profit no loss",
    optionB: "1% loss",
    optionC: "1% gain",
    optionD: "2% loss",
    correctAnswer: "B",
    marks: 1,
    topic: "Profit and Loss",
    difficulty: "EASY",
    sourceExam: "TCS NQT 2021"
  },
  {
    questionText: "The difference between simple and compound interest on a certain sum of money for 2 years at 10% per annum is Rs. 65. Find the principal sum.",
    optionA: "Rs. 6000",
    optionB: "Rs. 6500",
    optionC: "Rs. 7000",
    optionD: "Rs. 7500",
    correctAnswer: "B",
    marks: 1,
    topic: "Simple Interest",
    difficulty: "MEDIUM",
    sourceExam: "Infosys 2023"
  },
  {
    questionText: "A sum of money placed at compound interest doubles itself in 4 years. In how many years will it amount to 8 times itself at the same rate?",
    optionA: "8 years",
    optionB: "12 years",
    optionC: "16 years",
    optionD: "20 years",
    correctAnswer: "B",
    marks: 1,
    topic: "Compound Interest",
    difficulty: "EASY",
    sourceExam: "GATE Aptitude 2022"
  },
  {
    questionText: "A can do a piece of work in 12 days and B in 15 days. They work together for 4 days and then A leaves. How many days will B take to finish the remaining work alone?",
    optionA: "5 days",
    optionB: "6 days",
    optionC: "7 days",
    optionD: "8 days",
    correctAnswer: "B",
    marks: 1,
    topic: "Time and Work",
    difficulty: "MEDIUM",
    sourceExam: "TCS NQT 2023"
  },
  {
    questionText: "A is thrice as efficient as B and therefore is able to finish a job in 40 days less than B. How many days will they take to finish the job working together?",
    optionA: "12 days",
    optionB: "15 days",
    optionC: "18 days",
    optionD: "20 days",
    correctAnswer: "B",
    marks: 1,
    topic: "Time and Work",
    difficulty: "MEDIUM",
    sourceExam: "Wipro 2022"
  },
  {
    questionText: "Two pipes A and B can fill a tank in 20 minutes and 30 minutes respectively. If both pipes are opened together, in how many minutes will the tank be full?",
    optionA: "10 minutes",
    optionB: "12 minutes",
    optionC: "15 minutes",
    optionD: "18 minutes",
    correctAnswer: "B",
    marks: 1,
    topic: "Pipes and Cisterns",
    difficulty: "EASY",
    sourceExam: "Cognizant 2022"
  },
  {
    questionText: "Two trains of lengths 140 m and 160 m run at speeds of 60 km/h and 40 km/h respectively in opposite directions on parallel tracks. What is the time required to clear each other?",
    optionA: "9 seconds",
    optionB: "10.8 seconds",
    optionC: "12 seconds",
    optionD: "14.4 seconds",
    correctAnswer: "B",
    marks: 1,
    topic: "Time Speed Distance",
    difficulty: "MEDIUM",
    sourceExam: "TCS NQT 2023"
  },
  {
    questionText: "A train 300 meters long passes a pole in 15 seconds. What is the speed of the train in km/h?",
    optionA: "60 km/h",
    optionB: "72 km/h",
    optionC: "80 km/h",
    optionD: "90 km/h",
    correctAnswer: "B",
    marks: 1,
    topic: "Trains",
    difficulty: "EASY",
    sourceExam: "Infosys 2023"
  },
  {
    questionText: "A man can row upstream at 8 km/h and downstream at 14 km/h. Find the speed of the current/stream.",
    optionA: "2 km/h",
    optionB: "3 km/h",
    optionC: "4 km/h",
    optionD: "6 km/h",
    correctAnswer: "B",
    marks: 1,
    topic: "Boats and Streams",
    difficulty: "EASY",
    sourceExam: "Capgemini 2022"
  },
  {
    questionText: "A bag contains Rs. 1, 50 paise, and 25 paise coins in the ratio 5 : 6 : 8. If the total value of all coins is Rs. 210, find the number of 50 paise coins.",
    optionA: "105",
    optionB: "120",
    optionC: "140",
    optionD: "126",
    correctAnswer: "D",
    marks: 1,
    topic: "Ratio and Proportion",
    difficulty: "MEDIUM",
    sourceExam: "Wipro 2023"
  },
  {
    questionText: "The average weight of 24 students in a class is 40 kg. If the weight of the teacher is included, the average weight increases by 1 kg. What is the weight of the teacher?",
    optionA: "60 kg",
    optionB: "65 kg",
    optionC: "70 kg",
    optionD: "75 kg",
    correctAnswer: "B",
    marks: 1,
    topic: "Averages",
    difficulty: "EASY",
    sourceExam: "TCS NQT 2022"
  },
  {
    questionText: "Present ages of Father and Son are in the ratio 7 : 3. After 5 years, the ratio of their ages will be 2 : 1. What is the father's present age?",
    optionA: "30 years",
    optionB: "35 years",
    optionC: "42 years",
    optionD: "49 years",
    correctAnswer: "B",
    marks: 1,
    topic: "Ages",
    difficulty: "MEDIUM",
    sourceExam: "Accenture 2023"
  },
  {
    questionText: "In what ratio must water be mixed with milk costing Rs. 12 per litre so as to make a profit of 20% by selling the mixture at Rs. 12 per litre?",
    optionA: "1 : 5",
    optionB: "1 : 6",
    optionC: "2 : 5",
    optionD: "1 : 4",
    correctAnswer: "A",
    marks: 1,
    topic: "Mixtures and Alligation",
    difficulty: "HARD",
    sourceExam: "Infosys 2021"
  },
  {
    questionText: "In how many different ways can the letters of the word 'LEADING' be arranged such that the vowels always come together?",
    optionA: "360",
    optionB: "480",
    optionC: "720",
    optionD: "5040",
    correctAnswer: "C",
    marks: 1,
    topic: "Permutations and Combinations",
    difficulty: "MEDIUM",
    sourceExam: "GATE Aptitude 2023"
  },
  {
    questionText: "Two cards are drawn together from a pack of 52 playing cards. The probability that one is a spade and one is a heart is:",
    optionA: "3/20",
    optionB: "13/102",
    optionC: "1/16",
    optionD: "13/51",
    correctAnswer: "B",
    marks: 1,
    topic: "Probability",
    difficulty: "HARD",
    sourceExam: "TCS NQT 2023"
  },

  // --- LOGICAL REASONING (15 Questions) ---
  {
    questionText: "In a certain code language, if 'COMPUTER' is written as 'RFUVQNPC', then how will 'MEDICINE' be written in that code?",
    optionA: "EOJDJEFM",
    optionB: "EOJDEJFM",
    optionC: "MFEJDJOE",
    optionD: "EMJDJOME",
    correctAnswer: "A",
    marks: 1,
    topic: "Coding Decoding",
    difficulty: "MEDIUM",
    sourceExam: "TCS NQT 2023"
  },
  {
    questionText: "If 'ROSE' is coded as 6821, 'CHAIR' is coded as 73456, and 'PREACH' is coded as 961473, what is the code for 'SEARCH'?",
    optionA: "246173",
    optionB: "214673",
    optionC: "214763",
    optionD: "241673",
    correctAnswer: "B",
    marks: 1,
    topic: "Coding Decoding",
    difficulty: "EASY",
    sourceExam: "Infosys 2022"
  },
  {
    questionText: "Pointing to a photograph, a woman says: 'He is the only son of the wife of my husband's father.' How is the man in the photograph related to the woman?",
    optionA: "Brother",
    optionB: "Son",
    optionC: "Husband",
    optionD: "Father-in-law",
    correctAnswer: "C",
    marks: 1,
    topic: "Blood Relations",
    difficulty: "MEDIUM",
    sourceExam: "Wipro 2023"
  },
  {
    questionText: "If 'P + Q' means P is the daughter of Q; 'P - Q' means P is the brother of Q; and 'P * Q' means P is the father of Q, which of the following represents 'A is the uncle of B'?",
    optionA: "A - M * B",
    optionB: "A + M - B",
    optionC: "A * M + B",
    optionD: "M - A * B",
    correctAnswer: "A",
    marks: 1,
    topic: "Blood Relations",
    difficulty: "HARD",
    sourceExam: "Cognizant 2022"
  },
  {
    questionText: "Statements: (1) All mangoes are golden. (2) No golden things are cheap. Conclusions: I. All mangoes are cheap. II. Golden-colored mangoes are not cheap.",
    optionA: "Only conclusion I follows",
    optionB: "Only conclusion II follows",
    optionC: "Either I or II follows",
    optionD: "Neither I nor II follows",
    correctAnswer: "B",
    marks: 1,
    topic: "Syllogisms",
    difficulty: "EASY",
    sourceExam: "TCS NQT 2023"
  },
  {
    questionText: "Statements: Some actors are singers. All singers are dancers. Conclusions: I. Some actors are dancers. II. No singer is an actor.",
    optionA: "Only conclusion I follows",
    optionB: "Only conclusion II follows",
    optionC: "Both I and II follow",
    optionD: "Neither I nor II follows",
    correctAnswer: "A",
    marks: 1,
    topic: "Syllogisms",
    difficulty: "MEDIUM",
    sourceExam: "Infosys 2023"
  },
  {
    questionText: "A man walks 6 km North, turns right and walks 4 km, then turns right again and walks 6 km. How far and in which direction is he from his starting point?",
    optionA: "4 km East",
    optionB: "4 km West",
    optionC: "6 km East",
    optionD: "2 km South",
    correctAnswer: "A",
    marks: 1,
    topic: "Directions",
    difficulty: "EASY",
    sourceExam: "Accenture 2022"
  },
  {
    questionText: "One morning after sunrise, Suresh was standing facing a pole. The shadow of the pole fell exactly to his right. To which direction was he facing?",
    optionA: "East",
    optionB: "West",
    optionC: "South",
    optionD: "North",
    correctAnswer: "C",
    marks: 1,
    topic: "Directions",
    difficulty: "MEDIUM",
    sourceExam: "Capgemini 2023"
  },
  {
    questionText: "At what angle are the hands of a clock inclined at 30 minutes past 3?",
    optionA: "70 degrees",
    optionB: "75 degrees",
    optionC: "80 degrees",
    optionD: "90 degrees",
    correctAnswer: "B",
    marks: 1,
    topic: "Clocks",
    difficulty: "EASY",
    sourceExam: "GATE Aptitude 2021"
  },
  {
    questionText: "If 1st January 2004 was a Thursday, what day of the week was 1st January 2005? (Note: 2004 is a leap year)",
    optionA: "Friday",
    optionB: "Saturday",
    optionC: "Sunday",
    optionD: "Monday",
    correctAnswer: "B",
    marks: 1,
    topic: "Calendars",
    difficulty: "MEDIUM",
    sourceExam: "TCS NQT 2022"
  },
  {
    questionText: "Find the missing number in the sequence: 4, 9, 25, 49, 121, 169, ?",
    optionA: "225",
    optionB: "256",
    optionC: "289",
    optionD: "361",
    correctAnswer: "C",
    marks: 1,
    topic: "Logical Reasoning",
    difficulty: "MEDIUM",
    sourceExam: "Infosys 2022"
  },
  {
    questionText: "Find the next term in the letter series: BDF, CFI, DHL, ?",
    optionA: "EJO",
    optionB: "EKM",
    optionC: "EKN",
    optionD: "EIO",
    correctAnswer: "A",
    marks: 1,
    topic: "Logical Reasoning",
    difficulty: "EASY",
    sourceExam: "Wipro 2023"
  },
  {
    questionText: "Five friends P, Q, R, S, and T are seated in a row facing North. R is sitting between P and T. T is sitting to the immediate right of Q. S is sitting at the extreme right. Who is sitting in the middle?",
    optionA: "P",
    optionB: "Q",
    optionC: "R",
    optionD: "T",
    correctAnswer: "C",
    marks: 1,
    topic: "Logical Reasoning",
    difficulty: "MEDIUM",
    sourceExam: "TCS NQT 2023"
  },
  {
    questionText: "Six persons A, B, C, D, E, and F are sitting around a circular table facing the center. A is second to the left of C. B is to the immediate right of A. D is opposite to B. Who is sitting to the immediate left of C?",
    optionA: "E",
    optionB: "F",
    optionC: "D",
    optionD: "B",
    correctAnswer: "C",
    marks: 1,
    topic: "Logical Reasoning",
    difficulty: "HARD",
    sourceExam: "Cognizant 2023"
  },
  {
    questionText: "Statement: 'Please consult a doctor before taking any health supplement.' Assumptions: I. Some health supplements may cause side effects. II. Doctors know which supplement is appropriate for an individual.",
    optionA: "Only assumption I is implicit",
    optionB: "Only assumption II is implicit",
    optionC: "Neither I nor II is implicit",
    optionD: "Both I and II are implicit",
    correctAnswer: "D",
    marks: 1,
    topic: "Logical Reasoning",
    difficulty: "MEDIUM",
    sourceExam: "Infosys 2023"
  },

  // --- VERBAL ABILITY (10 Questions) ---
  {
    questionText: "Identify the part of the sentence that contains a grammatical error: 'Neither the manager (A) / nor the employees (B) / was present at (C) / the annual conference. (D)'",
    optionA: "Neither the manager",
    optionB: "nor the employees",
    optionC: "was present at",
    optionD: "the annual conference",
    correctAnswer: "C",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "MEDIUM",
    sourceExam: "TCS NQT 2023"
  },
  {
    questionText: "Choose the correct preposition to complete the sentence: 'She has been suffering _____ chronic migraines since last month.'",
    optionA: "with",
    optionB: "from",
    optionC: "by",
    optionD: "of",
    correctAnswer: "B",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "EASY",
    sourceExam: "Infosys 2022"
  },
  {
    questionText: "Select the most appropriate word to fill in the blank: 'The scientist's theory was so _____ that even his closest colleagues struggled to comprehend it.'",
    optionA: "elementary",
    optionB: "lucid",
    optionC: "abstruse",
    optionD: "superficial",
    correctAnswer: "C",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "HARD",
    sourceExam: "Wipro 2023"
  },
  {
    questionText: "What is the meaning of the idiom 'To bite the bullet'?",
    optionA: "To start a severe argument",
    optionB: "To face a difficult or unpleasant situation with courage",
    optionC: "To run away from danger",
    optionD: "To waste resources on unimportant matters",
    correctAnswer: "B",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "EASY",
    sourceExam: "Cognizant 2022"
  },
  {
    questionText: "Choose the word most SIMILAR in meaning (synonym) to 'CANDID':",
    optionA: "Deceptive",
    optionB: "Frank",
    optionC: "Guarded",
    optionD: "Arrogant",
    correctAnswer: "B",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "EASY",
    sourceExam: "TCS NQT 2023"
  },
  {
    questionText: "Choose the word most OPPOSITE in meaning (antonym) to 'METICULOUS':",
    optionA: "Careful",
    optionB: "Careless",
    optionC: "Diligent",
    optionD: "Cautious",
    correctAnswer: "B",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "EASY",
    sourceExam: "Infosys 2023"
  },
  {
    questionText: "Rearrange the jumbled parts to form a coherent sentence:\n(P) sustainable economic growth\n(Q) investments in green technology\n(R) are vital for achieving\n(S) in modern developing nations",
    optionA: "Q R P S",
    optionB: "Q S R P",
    optionC: "P R Q S",
    optionD: "S Q R P",
    correctAnswer: "A",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "MEDIUM",
    sourceExam: "Accenture 2023"
  },
  {
    questionText: "Convert the sentence into Passive Voice: 'The software team has resolved all security vulnerabilities.'",
    optionA: "All security vulnerabilities were resolved by the software team.",
    optionB: "All security vulnerabilities have been resolved by the software team.",
    optionC: "All security vulnerabilities had been resolved by the software team.",
    optionD: "All security vulnerabilities are resolved by the software team.",
    correctAnswer: "B",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "MEDIUM",
    sourceExam: "Capgemini 2022"
  },
  {
    questionText: "Select the correct one-word substitution for: 'A person who looks on the bright, hopeful side of life.'",
    optionA: "Pessimist",
    optionB: "Optimist",
    optionC: "Philanthropist",
    optionD: "Altruist",
    correctAnswer: "B",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "EASY",
    sourceExam: "TCS NQT 2022"
  },
  {
    questionText: "Read the excerpt: 'Technological automation eliminates repetitive tasks, enabling workers to focus on creative problem-solving.' What can be inferred?",
    optionA: "Automation completely replaces all human workers.",
    optionB: "Automation shifts the nature of human labor toward higher-order skills.",
    optionC: "Repetitive tasks are essential for company growth.",
    optionD: "Creative problem-solving does not require technological aid.",
    correctAnswer: "B",
    marks: 1,
    topic: "Verbal Ability",
    difficulty: "MEDIUM",
    sourceExam: "GATE Aptitude 2022"
  }
];

// Seed function to seed teacher and the 45 questions
async function seedDefaultData(prisma) {
  try {
    // 1. Seed or ensure Teacher Account
    let teacher = await prisma.user.findUnique({
      where: { email: 'teacher@aptitude.com' }
    });

    if (!teacher) {
      const hashed = await bcrypt.hash('Teacher@12345', 12);
      teacher = await prisma.user.create({
        data: {
          name: 'Prof. Rajesh Sharma',
          email: 'teacher@aptitude.com',
          password: hashed,
          role: 'TEACHER',
          department: 'Computer Science & Engineering',
          studyYear: 'Faculty'
        }
      });
      console.log('✅ Default Teacher account created: teacher@aptitude.com / Teacher@12345');
    }

    // 2. Check if 45 questions already exist
    const existingQuestionCount = await prisma.question.count({
      where: { createdBy: teacher.id }
    });

    let questionIds = [];
    if (existingQuestionCount < 45) {
      console.log(`Seeding 45 previous-year aptitude questions...`);
      for (const q of previousYearQuestions) {
        // Check if question with identical text exists to prevent duplicates
        let qRecord = await prisma.question.findFirst({
          where: { questionText: q.questionText, createdBy: teacher.id }
        });
        if (!qRecord) {
          qRecord = await prisma.question.create({
            data: {
              ...q,
              createdBy: teacher.id
            }
          });
        }
        questionIds.push(qRecord.id);
      }
      console.log(`✅ 45 Previous-Year Questions successfully seeded in database.`);
    } else {
      const existingQs = await prisma.question.findMany({
        where: { createdBy: teacher.id },
        select: { id: true },
        take: 45
      });
      questionIds = existingQs.map(q => q.id);
    }

    // 3. Ensure 3 distinct, authentic 45-minute tests exist with proper topic distributions:
    // Test 1: Quantitative & Reasoning Fundamentals (45 Mins, 15 Questions)
    // Test 2: Placement Intermediate Assessment (45 Mins, 15 Questions)
    // Test 3: Advanced Competitive Aptitude Exam (45 Mins, 15 Questions)
    // Plus the 45-question comprehensive assessment

    const allQuestions = await prisma.question.findMany({
      where: { createdBy: teacher.id },
      orderBy: { id: 'asc' }
    });

    // Partition questions by difficulty and topic
    const easyQs = allQuestions.filter(q => q.difficulty === 'EASY');
    const medQs = allQuestions.filter(q => q.difficulty === 'MEDIUM');
    const hardQs = allQuestions.filter(q => q.difficulty === 'HARD');

    // Test 1: Fundamentals (15 questions - mostly EASY & foundational across Quant, Reasoning, Verbal)
    const test1QIds = [
      ...easyQs.slice(0, 10).map(q => q.id),
      ...medQs.slice(0, 5).map(q => q.id)
    ];

    // Test 2: Intermediate (15 questions - balanced MEDIUM questions across Quant, Reasoning, Verbal)
    const test2QIds = [
      ...medQs.slice(5, 17).map(q => q.id),
      ...hardQs.slice(0, 3).map(q => q.id)
    ];

    // Test 3: Advanced (15 questions - challenging MEDIUM & HARD competitive questions)
    const test3QIds = [
      ...hardQs.map(q => q.id),
      ...medQs.slice(17, 17 + (15 - hardQs.length)).map(q => q.id)
    ];

    const testDefinitions = [
      {
        title: 'Aptitude Test 1 – Fundamentals Assessment',
        subject: 'Foundational Aptitude',
        topic: 'Number Systems, Percentages, Series & Verbal Basics',
        description: '45-minute core fundamentals assessment testing speed, basic arithmetic, numerical operations, and elementary deduction.',
        duration: 45,
        isActive: true,
        isMandatory: true,
        questionIds: test1QIds.length >= 10 ? test1QIds : questionIds.slice(0, 15)
      },
      {
        title: 'Aptitude Test 2 – Intermediate Placement Assessment',
        subject: 'Corporate Campus Placement',
        topic: 'Profit & Loss, Time-Work, Speed-Distance, Syllogisms & Logic',
        description: '45-minute intermediate assessment calibrated to TCS NQT, Infosys, and Wipro campus placement standards.',
        duration: 45,
        isActive: true,
        isMandatory: true,
        questionIds: test2QIds.length >= 10 ? test2QIds : questionIds.slice(15, 30)
      },
      {
        title: 'Aptitude Test 3 – Advanced Competitive Aptitude',
        subject: 'Advanced Aptitude & GATE',
        topic: 'Permutations, Probability, Mixtures, Circular Seating & Critical Reasoning',
        description: '45-minute advanced evaluation featuring higher-difficulty problem-solving from GATE Aptitude and top-tier corporate drives.',
        duration: 45,
        isActive: true,
        isMandatory: false,
        questionIds: test3QIds.length >= 10 ? test3QIds : questionIds.slice(30, 45)
      },
      {
        title: 'Comprehensive Aptitude Assessment (45 Questions)',
        subject: 'Comprehensive Aptitude',
        topic: 'Quantitative, Reasoning & Verbal',
        description: 'Official 45-minute full previous-year aptitude exam comprising all 45 authentic questions from TCS NQT, Infosys, Wipro, Cognizant, and GATE.',
        duration: 45,
        isActive: true,
        isMandatory: false,
        questionIds: questionIds
      }
    ];

    for (const tDef of testDefinitions) {
      let existingTest = await prisma.test.findFirst({
        where: { title: tDef.title, createdBy: teacher.id }
      });

      if (!existingTest) {
        existingTest = await prisma.test.create({
          data: {
            title: tDef.title,
            subject: tDef.subject,
            topic: tDef.topic,
            description: tDef.description,
            duration: tDef.duration,
            isActive: tDef.isActive,
            isMandatory: tDef.isMandatory,
            warningsAllowed: 1,
            createdBy: teacher.id,
            questions: {
              connect: tDef.questionIds.map(id => ({ id }))
            }
          }
        });
        console.log(`✅ Seeded Test: "${tDef.title}" (${tDef.duration} mins, ${tDef.questionIds.length} questions)`);
      } else {
        await prisma.test.update({
          where: { id: existingTest.id },
          data: {
            duration: 45,
            isActive: true,
            questions: {
              connect: tDef.questionIds.map(id => ({ id }))
            }
          }
        });
      }
    }
  } catch (err) {
    console.error('Error during default data seeding:', err.message);
  }
}

module.exports = {
  previousYearQuestions,
  seedDefaultData
};
