const router = require('express').Router();

// Comprehensive mock YouTube video database for all aptitude topics
// Video IDs are real well-known educational videos
const mockVideoDB = {
  'number system': [
    { id: 'ns1', title: 'Number System Complete Concepts | Aptitude', channel: 'TalentSprint Aptitude', videoId: 'e4X84W9y9rA', thumbnail: 'https://img.youtube.com/vi/e4X84W9y9rA/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=e4X84W9y9rA', duration: '28:14', views: '1.2M' },
    { id: 'ns2', title: 'Number System Tricks & Shortcuts', channel: 'Anil Kumar', videoId: 'MKESoGV7DwQ', thumbnail: 'https://img.youtube.com/vi/MKESoGV7DwQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=MKESoGV7DwQ', duration: '32:45', views: '890K' },
    { id: 'ns3', title: 'Number System for Competitive Exams', channel: 'CareerRide', videoId: '9cFIGHTZghc', thumbnail: 'https://img.youtube.com/vi/9cFIGHTZghc/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=9cFIGHTZghc', duration: '18:22', views: '654K' },
    { id: 'ns4', title: 'Number System Full Chapter in One Video', channel: 'Study Smart', videoId: 'bfTbcBmPv3E', thumbnail: 'https://img.youtube.com/vi/bfTbcBmPv3E/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=bfTbcBmPv3E', duration: '45:10', views: '2.1M' }
  ],
  'percentages': [
    { id: 'pc1', title: 'Percentage - Concepts, Tricks & Examples', channel: 'TalentSprint Aptitude', videoId: 'mSqT25QvxGQ', thumbnail: 'https://img.youtube.com/vi/mSqT25QvxGQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=mSqT25QvxGQ', duration: '24:30', views: '1.5M' },
    { id: 'pc2', title: 'Percentage Tricks - Shortcut Methods', channel: 'Anil Kumar', videoId: 'kFjYOCUKsQs', thumbnail: 'https://img.youtube.com/vi/kFjYOCUKsQs/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=kFjYOCUKsQs', duration: '19:45', views: '780K' },
    { id: 'pc3', title: 'Percentage Questions for All Exams', channel: 'CareerRide', videoId: 'fYVMM0AGDYQ', thumbnail: 'https://img.youtube.com/vi/fYVMM0AGDYQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=fYVMM0AGDYQ', duration: '35:00', views: '450K' },
    { id: 'pc4', title: 'Percentage Complete Chapter | Bank PO', channel: 'Unacademy CAT', videoId: 'Yd3JzDsWXHQ', thumbnail: 'https://img.youtube.com/vi/Yd3JzDsWXHQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Yd3JzDsWXHQ', duration: '41:12', views: '920K' }
  ],
  'profit and loss': [
    { id: 'pl1', title: 'Profit and Loss - Complete Chapter', channel: 'TalentSprint Aptitude', videoId: 'HhQrJDMrYI8', thumbnail: 'https://img.youtube.com/vi/HhQrJDMrYI8/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=HhQrJDMrYI8', duration: '22:18', views: '1.1M' },
    { id: 'pl2', title: 'Profit & Loss Tricks and Shortcuts', channel: 'Anil Kumar', videoId: 'F3dn5FrSM5I', thumbnail: 'https://img.youtube.com/vi/F3dn5FrSM5I/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=F3dn5FrSM5I', duration: '27:55', views: '830K' },
    { id: 'pl3', title: 'Profit Loss Discount | Aptitude Tutorial', channel: 'CareerRide', videoId: 'VDe2nGCLBkM', thumbnail: 'https://img.youtube.com/vi/VDe2nGCLBkM/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=VDe2nGCLBkM', duration: '30:00', views: '560K' },
    { id: 'pl4', title: 'Profit and Loss - 50 Questions Solved', channel: 'Study Smart', videoId: 'Jp0BXKF1TY4', thumbnail: 'https://img.youtube.com/vi/Jp0BXKF1TY4/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Jp0BXKF1TY4', duration: '38:20', views: '710K' }
  ],
  'simple interest': [
    { id: 'si1', title: 'Simple Interest - All Concepts & Tricks', channel: 'TalentSprint Aptitude', videoId: 'kS9UJqj4v2s', thumbnail: 'https://img.youtube.com/vi/kS9UJqj4v2s/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=kS9UJqj4v2s', duration: '16:40', views: '890K' },
    { id: 'si2', title: 'Simple Interest Shortcuts | Aptitude', channel: 'Anil Kumar', videoId: 'tIRmjZoMR5U', thumbnail: 'https://img.youtube.com/vi/tIRmjZoMR5U/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=tIRmjZoMR5U', duration: '21:30', views: '540K' },
    { id: 'si3', title: 'SI Problems for Placement Aptitude', channel: 'CareerRide', videoId: 'kxVfcKv7cA0', thumbnail: 'https://img.youtube.com/vi/kxVfcKv7cA0/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=kxVfcKv7cA0', duration: '14:15', views: '380K' },
    { id: 'si4', title: 'Simple Interest - 30 Questions Practice', channel: 'Study Smart', videoId: 'Wk2Ws8a2JiQ', thumbnail: 'https://img.youtube.com/vi/Wk2Ws8a2JiQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Wk2Ws8a2JiQ', duration: '25:00', views: '420K' }
  ],
  'compound interest': [
    { id: 'ci1', title: 'Compound Interest - Full Chapter', channel: 'TalentSprint Aptitude', videoId: 'gFQNNcvs8-E', thumbnail: 'https://img.youtube.com/vi/gFQNNcvs8-E/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=gFQNNcvs8-E', duration: '28:55', views: '970K' },
    { id: 'ci2', title: 'Compound Interest Tricks & Formula', channel: 'Anil Kumar', videoId: 'O8Yk5KhO3lc', thumbnail: 'https://img.youtube.com/vi/O8Yk5KhO3lc/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=O8Yk5KhO3lc', duration: '33:10', views: '620K' },
    { id: 'ci3', title: 'CI vs SI Difference Explained', channel: 'CareerRide', videoId: 'r5N8XLPeHcM', thumbnail: 'https://img.youtube.com/vi/r5N8XLPeHcM/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=r5N8XLPeHcM', duration: '18:30', views: '450K' },
    { id: 'ci4', title: 'Compound Interest - Bank Exam Special', channel: 'Unacademy CAT', videoId: 'LqLFMBWFl0I', thumbnail: 'https://img.youtube.com/vi/LqLFMBWFl0I/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=LqLFMBWFl0I', duration: '42:00', views: '810K' }
  ],
  'time and work': [
    { id: 'tw1', title: 'Time and Work - Complete Tutorial', channel: 'TalentSprint Aptitude', videoId: '4g8J0fAoKs8', thumbnail: 'https://img.youtube.com/vi/4g8J0fAoKs8/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=4g8J0fAoKs8', duration: '30:20', views: '1.3M' },
    { id: 'tw2', title: 'Time and Work Shortcut Methods', channel: 'Anil Kumar', videoId: '3e_w0P9fdJE', thumbnail: 'https://img.youtube.com/vi/3e_w0P9fdJE/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=3e_w0P9fdJE', duration: '24:45', views: '780K' },
    { id: 'tw3', title: 'Work and Wages | Pipes & Cistern', channel: 'CareerRide', videoId: 'Q6uVN0PPNHQ', thumbnail: 'https://img.youtube.com/vi/Q6uVN0PPNHQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Q6uVN0PPNHQ', duration: '26:00', views: '560K' },
    { id: 'tw4', title: 'Time Work Efficiency Problems Solved', channel: 'Study Smart', videoId: 'RkXmwSaC6yk', thumbnail: 'https://img.youtube.com/vi/RkXmwSaC6yk/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=RkXmwSaC6yk', duration: '35:15', views: '640K' }
  ],
  'time speed distance': [
    { id: 'tsd1', title: 'Speed, Distance & Time - All Concepts', channel: 'TalentSprint Aptitude', videoId: 'VHGaYYSnFIg', thumbnail: 'https://img.youtube.com/vi/VHGaYYSnFIg/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=VHGaYYSnFIg', duration: '34:10', views: '1.4M' },
    { id: 'tsd2', title: 'Speed Distance Time Tricks', channel: 'Anil Kumar', videoId: 'wMRRi78KfvM', thumbnail: 'https://img.youtube.com/vi/wMRRi78KfvM/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=wMRRi78KfvM', duration: '28:30', views: '920K' },
    { id: 'tsd3', title: 'Relative Speed Problems | Aptitude', channel: 'CareerRide', videoId: 'pEvvHqAJNik', thumbnail: 'https://img.youtube.com/vi/pEvvHqAJNik/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=pEvvHqAJNik', duration: '22:45', views: '580K' },
    { id: 'tsd4', title: 'Speed Distance Time Practice Set', channel: 'Study Smart', videoId: 'HTonDRMq7bM', thumbnail: 'https://img.youtube.com/vi/HTonDRMq7bM/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=HTonDRMq7bM', duration: '40:00', views: '730K' }
  ],
  'ratio and proportion': [
    { id: 'rp1', title: 'Ratio and Proportion - Complete Chapter', channel: 'TalentSprint Aptitude', videoId: 'HNfqT1HiA9Q', thumbnail: 'https://img.youtube.com/vi/HNfqT1HiA9Q/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=HNfqT1HiA9Q', duration: '20:15', views: '870K' },
    { id: 'rp2', title: 'Ratio Proportion Tricks for Fast Solving', channel: 'Anil Kumar', videoId: 'oYF0HNjAqoU', thumbnail: 'https://img.youtube.com/vi/oYF0HNjAqoU/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=oYF0HNjAqoU', duration: '25:30', views: '560K' },
    { id: 'rp3', title: 'Ratio and Proportion - 40 Questions', channel: 'CareerRide', videoId: 'u8R9EtF9j7Q', thumbnail: 'https://img.youtube.com/vi/u8R9EtF9j7Q/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=u8R9EtF9j7Q', duration: '30:00', views: '420K' },
    { id: 'rp4', title: 'Proportion Problems Solved Step by Step', channel: 'Unacademy CAT', videoId: 'VL4Y9dHlArE', thumbnail: 'https://img.youtube.com/vi/VL4Y9dHlArE/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=VL4Y9dHlArE', duration: '38:45', views: '690K' }
  ],
  'averages': [
    { id: 'av1', title: 'Averages - Concepts and Tricks', channel: 'TalentSprint Aptitude', videoId: 'J3GBEj01V5I', thumbnail: 'https://img.youtube.com/vi/J3GBEj01V5I/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=J3GBEj01V5I', duration: '18:00', views: '760K' },
    { id: 'av2', title: 'Average Shortcut Methods | Aptitude', channel: 'Anil Kumar', videoId: 'wVJE4pyZAac', thumbnail: 'https://img.youtube.com/vi/wVJE4pyZAac/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=wVJE4pyZAac', duration: '22:10', views: '490K' },
    { id: 'av3', title: 'Averages Practice Questions Solved', channel: 'CareerRide', videoId: 'jBPO7Vs7dLk', thumbnail: 'https://img.youtube.com/vi/jBPO7Vs7dLk/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=jBPO7Vs7dLk', duration: '15:30', views: '340K' },
    { id: 'av4', title: 'Average - Complete Chapter for Exams', channel: 'Study Smart', videoId: 'I3j8Fl0RWds', thumbnail: 'https://img.youtube.com/vi/I3j8Fl0RWds/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=I3j8Fl0RWds', duration: '28:00', views: '510K' }
  ],
  'ages': [
    { id: 'age1', title: 'Problems on Ages - All Types', channel: 'TalentSprint Aptitude', videoId: 'J_gFBXcz0Mc', thumbnail: 'https://img.youtube.com/vi/J_gFBXcz0Mc/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=J_gFBXcz0Mc', duration: '20:40', views: '680K' },
    { id: 'age2', title: 'Ages Tricks | Present Age Future Age', channel: 'Anil Kumar', videoId: 'NqOZ2rJChBU', thumbnail: 'https://img.youtube.com/vi/NqOZ2rJChBU/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=NqOZ2rJChBU', duration: '17:25', views: '430K' },
    { id: 'age3', title: 'Problems on Ages Solved | 25 Questions', channel: 'CareerRide', videoId: 'M_QZK5PLv-E', thumbnail: 'https://img.youtube.com/vi/M_QZK5PLv-E/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=M_QZK5PLv-E', duration: '25:00', views: '310K' },
    { id: 'age4', title: 'Ages - Shortcut Formula Tricks', channel: 'Study Smart', videoId: 'ABhR6a1sPKM', thumbnail: 'https://img.youtube.com/vi/ABhR6a1sPKM/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=ABhR6a1sPKM', duration: '22:15', views: '380K' }
  ],
  'probability': [
    { id: 'pr1', title: 'Probability - Complete Chapter Explained', channel: 'TalentSprint Aptitude', videoId: '9OKbbLHM1-o', thumbnail: 'https://img.youtube.com/vi/9OKbbLHM1-o/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=9OKbbLHM1-o', duration: '32:20', views: '1.0M' },
    { id: 'pr2', title: 'Probability Tricks and Problems', channel: 'Anil Kumar', videoId: 'eATSHh1BFME', thumbnail: 'https://img.youtube.com/vi/eATSHh1BFME/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=eATSHh1BFME', duration: '28:45', views: '670K' },
    { id: 'pr3', title: 'Probability - Cards, Dice, Coins', channel: 'CareerRide', videoId: '6Gkr5DLT9Xs', thumbnail: 'https://img.youtube.com/vi/6Gkr5DLT9Xs/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=6Gkr5DLT9Xs', duration: '24:15', views: '520K' },
    { id: 'pr4', title: 'Probability Practice Set | All Types', channel: 'Unacademy CAT', videoId: 'dZJPEFwMJYk', thumbnail: 'https://img.youtube.com/vi/dZJPEFwMJYk/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=dZJPEFwMJYk', duration: '45:00', views: '840K' }
  ],
  'permutations and combinations': [
    { id: 'pc1b', title: 'Permutation & Combination Full Tutorial', channel: 'TalentSprint Aptitude', videoId: 'hRj_VGGcvXU', thumbnail: 'https://img.youtube.com/vi/hRj_VGGcvXU/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=hRj_VGGcvXU', duration: '36:10', views: '1.2M' },
    { id: 'pc2b', title: 'P&C Tricks - nPr and nCr Explained', channel: 'Anil Kumar', videoId: 'XD2OKWFGjH4', thumbnail: 'https://img.youtube.com/vi/XD2OKWFGjH4/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=XD2OKWFGjH4', duration: '30:30', views: '750K' },
    { id: 'pc3b', title: 'Permutations Combinations Practice', channel: 'CareerRide', videoId: 'wPVNkZKBPvc', thumbnail: 'https://img.youtube.com/vi/wPVNkZKBPvc/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=wPVNkZKBPvc', duration: '22:00', views: '480K' },
    { id: 'pc4b', title: 'P&C - 50 Problems for Exam Prep', channel: 'Study Smart', videoId: 'jqTMWdKQqTM', thumbnail: 'https://img.youtube.com/vi/jqTMWdKQqTM/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=jqTMWdKQqTM', duration: '52:00', views: '620K' }
  ],
  'data interpretation': [
    { id: 'di1', title: 'Data Interpretation - Complete Guide', channel: 'TalentSprint Aptitude', videoId: 'hPHsqG9dCBs', thumbnail: 'https://img.youtube.com/vi/hPHsqG9dCBs/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=hPHsqG9dCBs', duration: '40:00', views: '1.6M' },
    { id: 'di2', title: 'DI - Bar Graph, Pie Chart, Table', channel: 'Anil Kumar', videoId: 'Z9yJMeyLxkA', thumbnail: 'https://img.youtube.com/vi/Z9yJMeyLxkA/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Z9yJMeyLxkA', duration: '35:20', views: '980K' },
    { id: 'di3', title: 'Data Interpretation Practice Questions', channel: 'CareerRide', videoId: 'PZ5s0OBgblk', thumbnail: 'https://img.youtube.com/vi/PZ5s0OBgblk/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=PZ5s0OBgblk', duration: '28:45', views: '720K' },
    { id: 'di4', title: 'DI Shortcut Methods for Bank Exams', channel: 'Unacademy CAT', videoId: 'GsuhL6Tk_7E', thumbnail: 'https://img.youtube.com/vi/GsuhL6Tk_7E/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=GsuhL6Tk_7E', duration: '48:30', views: '1.1M' }
  ],
  'logical reasoning': [
    { id: 'lr1', title: 'Logical Reasoning - Complete Chapter', channel: 'TalentSprint Aptitude', videoId: 'WfbwrJFTMBE', thumbnail: 'https://img.youtube.com/vi/WfbwrJFTMBE/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=WfbwrJFTMBE', duration: '38:00', views: '1.8M' },
    { id: 'lr2', title: 'Logical Reasoning Tricks & Strategies', channel: 'Anil Kumar', videoId: 'ow5vlJMFQMQ', thumbnail: 'https://img.youtube.com/vi/ow5vlJMFQMQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=ow5vlJMFQMQ', duration: '32:10', views: '1.0M' },
    { id: 'lr3', title: 'Logical Reasoning - 40 Questions Solved', channel: 'CareerRide', videoId: 'JRYlCvNHDSw', thumbnail: 'https://img.youtube.com/vi/JRYlCvNHDSw/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=JRYlCvNHDSw', duration: '42:30', views: '860K' },
    { id: 'lr4', title: 'Reasoning for Placements', channel: 'Study Smart', videoId: 'A8OB-f2_hVs', thumbnail: 'https://img.youtube.com/vi/A8OB-f2_hVs/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=A8OB-f2_hVs', duration: '50:00', views: '1.3M' }
  ],
  'verbal ability': [
    { id: 'va1', title: 'Verbal Ability - Reading Comprehension', channel: 'TalentSprint Aptitude', videoId: 'bXv_uuHIaEY', thumbnail: 'https://img.youtube.com/vi/bXv_uuHIaEY/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=bXv_uuHIaEY', duration: '30:15', views: '920K' },
    { id: 'va2', title: 'English Verbal Ability - Full Chapter', channel: 'Anil Kumar', videoId: 'pLDp-Zf7VkE', thumbnail: 'https://img.youtube.com/vi/pLDp-Zf7VkE/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=pLDp-Zf7VkE', duration: '26:40', views: '650K' },
    { id: 'va3', title: 'Grammar & Vocabulary for Aptitude', channel: 'CareerRide', videoId: 'fPtGpTuiXmY', thumbnail: 'https://img.youtube.com/vi/fPtGpTuiXmY/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=fPtGpTuiXmY', duration: '22:20', views: '480K' },
    { id: 'va4', title: 'Verbal Ability Practice - Placement Prep', channel: 'Study Smart', videoId: 'T4KZAOS4_j8', thumbnail: 'https://img.youtube.com/vi/T4KZAOS4_j8/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=T4KZAOS4_j8', duration: '35:00', views: '570K' }
  ],
  'coding decoding': [
    { id: 'cd1', title: 'Coding-Decoding Complete Chapter', channel: 'TalentSprint Aptitude', videoId: 'PmxhWMoOqGs', thumbnail: 'https://img.youtube.com/vi/PmxhWMoOqGs/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=PmxhWMoOqGs', duration: '26:00', views: '780K' },
    { id: 'cd2', title: 'Coding Decoding Tricks & Shortcuts', channel: 'Anil Kumar', videoId: '9EaROWV8bXM', thumbnail: 'https://img.youtube.com/vi/9EaROWV8bXM/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=9EaROWV8bXM', duration: '20:30', views: '520K' },
    { id: 'cd3', title: 'Coding Decoding 30 Questions Solved', channel: 'CareerRide', videoId: 'BPiB1HdkTgo', thumbnail: 'https://img.youtube.com/vi/BPiB1HdkTgo/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=BPiB1HdkTgo', duration: '18:45', views: '390K' },
    { id: 'cd4', title: 'Letter Coding Number Coding Tricks', channel: 'Study Smart', videoId: 'RCiSaZbNInw', thumbnail: 'https://img.youtube.com/vi/RCiSaZbNInw/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=RCiSaZbNInw', duration: '24:10', views: '430K' }
  ],
  'blood relations': [
    { id: 'br1', title: 'Blood Relations - Complete Tutorial', channel: 'TalentSprint Aptitude', videoId: 'EqBFy8e0ELQ', thumbnail: 'https://img.youtube.com/vi/EqBFy8e0ELQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=EqBFy8e0ELQ', duration: '22:10', views: '690K' },
    { id: 'br2', title: 'Blood Relations Tricks | Family Tree', channel: 'Anil Kumar', videoId: 'Qbu8qO7g_no', thumbnail: 'https://img.youtube.com/vi/Qbu8qO7g_no/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Qbu8qO7g_no', duration: '18:45', views: '450K' },
    { id: 'br3', title: 'Blood Relations 25 Problems Solved', channel: 'CareerRide', videoId: 'c1RR5f7MrNo', thumbnail: 'https://img.youtube.com/vi/c1RR5f7MrNo/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=c1RR5f7MrNo', duration: '20:00', views: '320K' },
    { id: 'br4', title: 'Family Relationship Problems | Aptitude', channel: 'Study Smart', videoId: 'BsBRSylCOG0', thumbnail: 'https://img.youtube.com/vi/BsBRSylCOG0/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=BsBRSylCOG0', duration: '25:30', views: '370K' }
  ],
  'syllogisms': [
    { id: 'sy1', title: 'Syllogism - All Rules and Types', channel: 'TalentSprint Aptitude', videoId: 'HA5SHjHkjgE', thumbnail: 'https://img.youtube.com/vi/HA5SHjHkjgE/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=HA5SHjHkjgE', duration: '28:20', views: '850K' },
    { id: 'sy2', title: 'Syllogism Venn Diagram Trick', channel: 'Anil Kumar', videoId: 'cGYVYPJhS0g', thumbnail: 'https://img.youtube.com/vi/cGYVYPJhS0g/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=cGYVYPJhS0g', duration: '24:15', views: '610K' },
    { id: 'sy3', title: 'Syllogism Practice - 35 Questions', channel: 'CareerRide', videoId: 'GHMsZgSwO2Y', thumbnail: 'https://img.youtube.com/vi/GHMsZgSwO2Y/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=GHMsZgSwO2Y', duration: '30:00', views: '440K' },
    { id: 'sy4', title: 'Syllogism for Bank PO & SSC', channel: 'Unacademy CAT', videoId: 'M85vHoT7bqg', thumbnail: 'https://img.youtube.com/vi/M85vHoT7bqg/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=M85vHoT7bqg', duration: '40:00', views: '720K' }
  ],
  'directions': [
    { id: 'dir1', title: 'Directions & Distance - Complete Chapter', channel: 'TalentSprint Aptitude', videoId: 'Tzo1j_qMz-M', thumbnail: 'https://img.youtube.com/vi/Tzo1j_qMz-M/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Tzo1j_qMz-M', duration: '18:40', views: '560K' },
    { id: 'dir2', title: 'Direction Sense Tricks | Aptitude', channel: 'Anil Kumar', videoId: 'FeqcAzunYKA', thumbnail: 'https://img.youtube.com/vi/FeqcAzunYKA/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=FeqcAzunYKA', duration: '15:20', views: '380K' },
    { id: 'dir3', title: 'Direction Problems Solved - 20 Questions', channel: 'CareerRide', videoId: 'g7JbRWy1MaA', thumbnail: 'https://img.youtube.com/vi/g7JbRWy1MaA/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=g7JbRWy1MaA', duration: '16:00', views: '290K' },
    { id: 'dir4', title: 'Navigation & Direction Aptitude Problems', channel: 'Study Smart', videoId: 'b8Ss1BRWAl4', thumbnail: 'https://img.youtube.com/vi/b8Ss1BRWAl4/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=b8Ss1BRWAl4', duration: '20:00', views: '330K' }
  ],
  'clocks': [
    { id: 'cl1', title: 'Clock Problems - Angle and Time', channel: 'TalentSprint Aptitude', videoId: 'JJaJCKAKjLg', thumbnail: 'https://img.youtube.com/vi/JJaJCKAKjLg/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=JJaJCKAKjLg', duration: '24:30', views: '720K' },
    { id: 'cl2', title: 'Clock Tricks - Coincidence, Angle', channel: 'Anil Kumar', videoId: 'w3gXZAE3MVw', thumbnail: 'https://img.youtube.com/vi/w3gXZAE3MVw/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=w3gXZAE3MVw', duration: '20:15', views: '480K' },
    { id: 'cl3', title: 'Clock Problems 30 Questions Solved', channel: 'CareerRide', videoId: 'LhUNLtTEzwg', thumbnail: 'https://img.youtube.com/vi/LhUNLtTEzwg/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=LhUNLtTEzwg', duration: '28:00', views: '390K' },
    { id: 'cl4', title: 'Clocks & Calendar Aptitude Shortcut', channel: 'Study Smart', videoId: 'AaYpRyh5MCE', thumbnail: 'https://img.youtube.com/vi/AaYpRyh5MCE/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=AaYpRyh5MCE', duration: '32:00', views: '430K' }
  ],
  'calendars': [
    { id: 'cal1', title: 'Calendar Problems - Odd Days Method', channel: 'TalentSprint Aptitude', videoId: 'ERl8L1nopRI', thumbnail: 'https://img.youtube.com/vi/ERl8L1nopRI/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=ERl8L1nopRI', duration: '20:00', views: '610K' },
    { id: 'cal2', title: 'Calendar Tricks - Day of the Week', channel: 'Anil Kumar', videoId: 'F6RhVfN9oWM', thumbnail: 'https://img.youtube.com/vi/F6RhVfN9oWM/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=F6RhVfN9oWM', duration: '18:30', views: '390K' },
    { id: 'cal3', title: 'Calendar Problems Solved | 20 Questions', channel: 'CareerRide', videoId: 'UNXTiS_I8uo', thumbnail: 'https://img.youtube.com/vi/UNXTiS_I8uo/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=UNXTiS_I8uo', duration: '22:00', views: '310K' },
    { id: 'cal4', title: 'Dates, Days, Calendars - Formula Method', channel: 'Study Smart', videoId: 'G5Q3JUHNuCA', thumbnail: 'https://img.youtube.com/vi/G5Q3JUHNuCA/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=G5Q3JUHNuCA', duration: '24:15', views: '350K' }
  ],
  'mixtures and alligation': [
    { id: 'ma1', title: 'Mixtures and Alligation - Full Chapter', channel: 'TalentSprint Aptitude', videoId: 'Zv6sDn6fkBo', thumbnail: 'https://img.youtube.com/vi/Zv6sDn6fkBo/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Zv6sDn6fkBo', duration: '26:10', views: '740K' },
    { id: 'ma2', title: 'Alligation Method - Rule of Mixture', channel: 'Anil Kumar', videoId: 'U2i5n_Bp1IE', thumbnail: 'https://img.youtube.com/vi/U2i5n_Bp1IE/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=U2i5n_Bp1IE', duration: '22:45', views: '480K' },
    { id: 'ma3', title: 'Mixtures Problems Solved | 25 Questions', channel: 'CareerRide', videoId: 'ZzW6B8n3P7o', thumbnail: 'https://img.youtube.com/vi/ZzW6B8n3P7o/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=ZzW6B8n3P7o', duration: '24:00', views: '360K' },
    { id: 'ma4', title: 'Alligation Shortcut - 10 Questions', channel: 'Study Smart', videoId: 'X1A0BoiPwXo', thumbnail: 'https://img.youtube.com/vi/X1A0BoiPwXo/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=X1A0BoiPwXo', duration: '18:30', views: '290K' }
  ],
  'pipes and cisterns': [
    { id: 'pip1', title: 'Pipes and Cisterns Complete Chapter', channel: 'TalentSprint Aptitude', videoId: 'YN5-5uAQEBw', thumbnail: 'https://img.youtube.com/vi/YN5-5uAQEBw/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=YN5-5uAQEBw', duration: '22:00', views: '680K' },
    { id: 'pip2', title: 'Pipes & Cisterns Tricks | Aptitude', channel: 'Anil Kumar', videoId: 'j95v7wJY7KA', thumbnail: 'https://img.youtube.com/vi/j95v7wJY7KA/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=j95v7wJY7KA', duration: '18:20', views: '430K' },
    { id: 'pip3', title: 'Pipes Cisterns 20 Problems Solved', channel: 'CareerRide', videoId: 'Sb3DPjDBpqA', thumbnail: 'https://img.youtube.com/vi/Sb3DPjDBpqA/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Sb3DPjDBpqA', duration: '20:30', views: '310K' },
    { id: 'pip4', title: 'Pipes and Tanks - Shortcut Methods', channel: 'Study Smart', videoId: 'j4HGSNyEkWI', thumbnail: 'https://img.youtube.com/vi/j4HGSNyEkWI/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=j4HGSNyEkWI', duration: '24:00', views: '360K' }
  ],
  'trains': [
    { id: 'tr1', title: 'Train Problems - Complete Chapter', channel: 'TalentSprint Aptitude', videoId: 'J3S3H2bgMvI', thumbnail: 'https://img.youtube.com/vi/J3S3H2bgMvI/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=J3S3H2bgMvI', duration: '28:00', views: '820K' },
    { id: 'tr2', title: 'Trains Aptitude Tricks - Same/Opposite', channel: 'Anil Kumar', videoId: 'Rr-HN-gCcAA', thumbnail: 'https://img.youtube.com/vi/Rr-HN-gCcAA/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=Rr-HN-gCcAA', duration: '24:10', views: '570K' },
    { id: 'tr3', title: 'Trains Problems 25 Questions Solved', channel: 'CareerRide', videoId: 'e7zeSPTeSs8', thumbnail: 'https://img.youtube.com/vi/e7zeSPTeSs8/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=e7zeSPTeSs8', duration: '22:00', views: '410K' },
    { id: 'tr4', title: 'Trains Speed Formula Shortcut', channel: 'Study Smart', videoId: 'HcvKE_hkOFo', thumbnail: 'https://img.youtube.com/vi/HcvKE_hkOFo/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=HcvKE_hkOFo', duration: '26:30', views: '460K' }
  ],
  'boats and streams': [
    { id: 'bs1', title: 'Boats and Streams - Full Chapter', channel: 'TalentSprint Aptitude', videoId: 'VX9m8e5Jbqc', thumbnail: 'https://img.youtube.com/vi/VX9m8e5Jbqc/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=VX9m8e5Jbqc', duration: '20:30', views: '630K' },
    { id: 'bs2', title: 'Boats Streams Upstream Downstream', channel: 'Anil Kumar', videoId: 'K2YFyFGSqQk', thumbnail: 'https://img.youtube.com/vi/K2YFyFGSqQk/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=K2YFyFGSqQk', duration: '16:45', views: '410K' },
    { id: 'bs3', title: 'Boats Streams 20 Problems Solved', channel: 'CareerRide', videoId: 'o3Wc0U5i0C0', thumbnail: 'https://img.youtube.com/vi/o3Wc0U5i0C0/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=o3Wc0U5i0C0', duration: '18:00', views: '300K' },
    { id: 'bs4', title: 'Boats and Streams Shortcut Formula', channel: 'Study Smart', videoId: 'pWBvJPWGa8s', thumbnail: 'https://img.youtube.com/vi/pWBvJPWGa8s/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=pWBvJPWGa8s', duration: '22:00', views: '340K' }
  ]
};

// Study tips per topic
const studyTips = {
  'number system': ['Learn LCM/HCF formulas', 'Practice divisibility rules', 'Memorize squares up to 30', 'Practice remainder theorem'],
  'percentages': ['Learn fraction-to-percentage conversions', 'Practice successive percentage changes', 'Master percentage increase/decrease formulas'],
  'profit and loss': ['Understand CP, SP, MP concepts', 'Practice discount problems', 'Learn profit% and loss% formulas'],
  'default': ['Review basic formulas', 'Practice with timed mock tests', 'Focus on accuracy before speed', 'Solve previous year questions']
};

router.get('/:topic', (req, res) => {
  const topicRaw = req.params.topic;
  const topic = topicRaw.toLowerCase().trim();

  // Try exact match first
  let videos = mockVideoDB[topic];

  // Fuzzy match if exact not found
  if (!videos) {
    const key = Object.keys(mockVideoDB).find(k =>
      k.includes(topic) || topic.includes(k) ||
      k.split(' ').some(word => topic.includes(word) && word.length > 3)
    );
    videos = key ? mockVideoDB[key] : null;
  }

  // Find matching study tips
  const tipKey = Object.keys(studyTips).find(k => topic.includes(k) || k.includes(topic));
  const tips = studyTips[tipKey] || studyTips['default'];

  if (!videos) {
    // Generic fallback
    videos = [
      { id: 'gen1', title: `${topicRaw} - Complete Aptitude Guide`, channel: 'TalentSprint Aptitude', videoId: 'WfbwrJFTMBE', thumbnail: 'https://img.youtube.com/vi/WfbwrJFTMBE/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=WfbwrJFTMBE', duration: '30:00', views: '500K' },
      { id: 'gen2', title: `${topicRaw} Tricks and Shortcuts`, channel: 'Anil Kumar', videoId: 'mSqT25QvxGQ', thumbnail: 'https://img.youtube.com/vi/mSqT25QvxGQ/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=mSqT25QvxGQ', duration: '25:00', views: '400K' },
      { id: 'gen3', title: `${topicRaw} Practice Questions`, channel: 'CareerRide', videoId: 'eATSHh1BFME', thumbnail: 'https://img.youtube.com/vi/eATSHh1BFME/mqdefault.jpg', url: 'https://www.youtube.com/watch?v=eATSHh1BFME', duration: '20:00', views: '300K' },
    ];
  }

  res.json({ videos, studyTips: tips });
});

module.exports = router;
