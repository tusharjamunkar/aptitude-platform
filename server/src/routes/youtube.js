const router = require('express').Router();

// 100% Verified, live educational YouTube videos for all 25 aptitude topics
// Every single link has been tested and confirmed via YouTube oEmbed API
const verifiedVideoDB = {
  "number system": [
    {
      "id": "number_system_1",
      "title": "Number System || Introduction (LESSON-1)",
      "channel": "Feel Free to Learn",
      "videoId": "qwHJtfEUCgE",
      "thumbnail": "https://img.youtube.com/vi/qwHJtfEUCgE/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=qwHJtfEUCgE",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "number_system_2",
      "title": "Number System || Divisibility Rule (LESSON-2) Tricks to Learn",
      "channel": "Feel Free to Learn",
      "videoId": "QUP1FpINICo",
      "thumbnail": "https://img.youtube.com/vi/QUP1FpINICo/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=QUP1FpINICo",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "number_system_3",
      "title": "Number System || Introduction(Lesson-1) || TAMIL",
      "channel": "FeelFreetoLearn_தமிழ்",
      "videoId": "aT9gStcGvnc",
      "thumbnail": "https://img.youtube.com/vi/aT9gStcGvnc/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=aT9gStcGvnc",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "number_system_4",
      "title": "Number System || Divisibility Rule(Lesson-2) Tricks to Learn || TAMIL",
      "channel": "FeelFreetoLearn_தமிழ்",
      "videoId": "fjVTSy2cPD8",
      "thumbnail": "https://img.youtube.com/vi/fjVTSy2cPD8/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=fjVTSy2cPD8",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "percentages": [
    {
      "id": "percentages_1",
      "title": "Percentage -  Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "RWdNhJWwzSs",
      "thumbnail": "https://img.youtube.com/vi/RWdNhJWwzSs/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=RWdNhJWwzSs",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "percentages_2",
      "title": "Percentage Tricks/Shortcuts/Formula | Percentage Problems Tricks and Shortcuts | DSSSB, CTET, KVS",
      "channel": "Dear Sir",
      "videoId": "gbR_m1byDns",
      "thumbnail": "https://img.youtube.com/vi/gbR_m1byDns/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=gbR_m1byDns",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "percentages_3",
      "title": "Best Percent Hack - How find Percents Shortcut",
      "channel": "Guinness And Math Guy",
      "videoId": "WG19nzEBd7I",
      "thumbnail": "https://img.youtube.com/vi/WG19nzEBd7I/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=WG19nzEBd7I",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "percentages_4",
      "title": "Math Tricks - Percentage Tricks - \"Zero in the Middle\" Math Hack - Mental Math Tricks #mathstricks",
      "channel": "JustQuant",
      "videoId": "j3o-mhACTX4",
      "thumbnail": "https://img.youtube.com/vi/j3o-mhACTX4/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=j3o-mhACTX4",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "profit and loss": [
    {
      "id": "profit_and_loss_1",
      "title": "Profit and Loss - Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "T2odvmxqi1I",
      "thumbnail": "https://img.youtube.com/vi/T2odvmxqi1I/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=T2odvmxqi1I",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "profit_and_loss_2",
      "title": "Aptitude Made Easy - Profit & Loss – Basics and Methods, Profit and loss shortcuts, Math tricks",
      "channel": "Jobs & Careers",
      "videoId": "_cW7_BUDYcw",
      "thumbnail": "https://img.youtube.com/vi/_cW7_BUDYcw/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=_cW7_BUDYcw",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "profit_and_loss_3",
      "title": "Profit and Loss Trick | How to solve profit and loss question for IBPS, SSC, CGL, CSAT, CAT, MAT|",
      "channel": "imran sir maths",
      "videoId": "DJUckY-o2c4",
      "thumbnail": "https://img.youtube.com/vi/DJUckY-o2c4/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=DJUckY-o2c4",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "profit_and_loss_4",
      "title": "Profit and Loss : Lesson 1 || Introduction || Formulas and Basics",
      "channel": "Feel Free to Learn",
      "videoId": "frDUnX_rFP4",
      "thumbnail": "https://img.youtube.com/vi/frDUnX_rFP4/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=frDUnX_rFP4",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "simple interest": [
    {
      "id": "simple_interest_1",
      "title": "Simple Interest - Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "jvRq87ZWzIk",
      "thumbnail": "https://img.youtube.com/vi/jvRq87ZWzIk/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=jvRq87ZWzIk",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "simple_interest_2",
      "title": "Aptitude Made Easy - Simple Interest Full Series, Learn maths #withme #StayHome",
      "channel": "Jobs & Careers",
      "videoId": "9gYCxj7bfPE",
      "thumbnail": "https://img.youtube.com/vi/9gYCxj7bfPE/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=9gYCxj7bfPE",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "simple_interest_3",
      "title": "Simple Interest Tricks | RRB NTPC Exam Maths Trick | simple interest",
      "channel": "imran sir maths",
      "videoId": "u2oVoD3F7u0",
      "thumbnail": "https://img.youtube.com/vi/u2oVoD3F7u0/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=u2oVoD3F7u0",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "simple_interest_4",
      "title": "Simple Interest Q-1 (Quantitative Aptitude) #feelfreetolearn #aptitudequestions  #FFLtricks #FFL",
      "channel": "Feel Free to Learn",
      "videoId": "XY4k0Qaa_e8",
      "thumbnail": "https://img.youtube.com/vi/XY4k0Qaa_e8/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=XY4k0Qaa_e8",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "compound interest": [
    {
      "id": "compound_interest_1",
      "title": "CI And SI Short Tricks In Hindi | Compound Interest Problems | General Aptitude For GATE 2024",
      "channel": "Dr.Gajendra Purohit - GATE / IIT JAM / CSIR NET",
      "videoId": "z2HFclpQHWc",
      "thumbnail": "https://img.youtube.com/vi/z2HFclpQHWc/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=z2HFclpQHWc",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "compound_interest_2",
      "title": "Compound Interest in Seconds! | CSAT Shortcut Trick for UPSC & Competitive Exams",
      "channel": "Narayana IAS Academy Official",
      "videoId": "HXGdxbnnujA",
      "thumbnail": "https://img.youtube.com/vi/HXGdxbnnujA/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=HXGdxbnnujA",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "compound_interest_3",
      "title": "compound interest trick #shorts #maths #tricks #trending",
      "channel": "ER STUDY CIRCLE",
      "videoId": "ZrorSCHjvMI",
      "thumbnail": "https://img.youtube.com/vi/ZrorSCHjvMI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=ZrorSCHjvMI",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "compound_interest_4",
      "title": "Compound interest trick",
      "channel": "STEP - IN MATHS",
      "videoId": "6M90wN5xUio",
      "thumbnail": "https://img.youtube.com/vi/6M90wN5xUio/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=6M90wN5xUio",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "time and work": [
    {
      "id": "time_and_work_1",
      "title": "Time and Work - Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "KE7tQf9spPg",
      "thumbnail": "https://img.youtube.com/vi/KE7tQf9spPg/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=KE7tQf9spPg",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "time_and_work_2",
      "title": "Time & Work Trick | Maths Tricks | imran sir maths",
      "channel": "imran sir maths",
      "videoId": "Ajn288_rB-E",
      "thumbnail": "https://img.youtube.com/vi/Ajn288_rB-E/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=Ajn288_rB-E",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "time_and_work_3",
      "title": "TIME AND WORK _ Chain Rule _ Lesson #1",
      "channel": "Feel Free to Learn",
      "videoId": "RhCwy2j2pHY",
      "thumbnail": "https://img.youtube.com/vi/RhCwy2j2pHY/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=RhCwy2j2pHY",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "time_and_work_4",
      "title": "TIME AND WORK _ EFFICIENCY _ Lesson #2",
      "channel": "Feel Free to Learn",
      "videoId": "ce_dT_10qRQ",
      "thumbnail": "https://img.youtube.com/vi/ce_dT_10qRQ/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=ce_dT_10qRQ",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "time speed distance": [
    {
      "id": "time_speed_distance_1",
      "title": "Speed, Distance & Time - Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "jzNxXm5twx4",
      "thumbnail": "https://img.youtube.com/vi/jzNxXm5twx4/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=jzNxXm5twx4",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "time_speed_distance_2",
      "title": "Time Speed and Distance Trick | Train Realted Questions | Maths Trick by imran sir | imran sir maths",
      "channel": "imran sir maths",
      "videoId": "m-s3vdPoIn4",
      "thumbnail": "https://img.youtube.com/vi/m-s3vdPoIn4/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=m-s3vdPoIn4",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "time_speed_distance_3",
      "title": "Time Speed and Distance Trick | Time Speed Distance Concept/Problems/Solutions/Tricks/Questions",
      "channel": "Dear Sir",
      "videoId": "oMwAHfqsQLo",
      "thumbnail": "https://img.youtube.com/vi/oMwAHfqsQLo/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=oMwAHfqsQLo",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "time_speed_distance_4",
      "title": "Time Speed & Distance| Time and Distance Math Tricks for SSC MTS GD CHSL|",
      "channel": "TUMI JITBE ",
      "videoId": "erYxF_FfvGI",
      "thumbnail": "https://img.youtube.com/vi/erYxF_FfvGI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=erYxF_FfvGI",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "ratio and proportion": [
    {
      "id": "ratio_and_proportion_1",
      "title": "Ratio & Proportion Tricks | Maths Trick | imran sir maths",
      "channel": "imran sir maths",
      "videoId": "F63Op34Xqow",
      "thumbnail": "https://img.youtube.com/vi/F63Op34Xqow/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=F63Op34Xqow",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "ratio_and_proportion_2",
      "title": "Ratio and Proportion - Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "jfoJBivWlnQ",
      "thumbnail": "https://img.youtube.com/vi/jfoJBivWlnQ/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=jfoJBivWlnQ",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "ratio_and_proportion_3",
      "title": "Ratio and Proportion | Lesson-1(Introduction) | Quantitative Aptitude",
      "channel": "Feel Free to Learn",
      "videoId": "xRLNYich5Ls",
      "thumbnail": "https://img.youtube.com/vi/xRLNYich5Ls/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=xRLNYich5Ls",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "ratio_and_proportion_4",
      "title": "Ratio and Proportion | Lesson-2(Finding Ratio?) | Quantitative Aptitude",
      "channel": "Feel Free to Learn",
      "videoId": "6rbRAVomTUg",
      "thumbnail": "https://img.youtube.com/vi/6rbRAVomTUg/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=6rbRAVomTUg",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "averages": [
    {
      "id": "averages_1",
      "title": "Averages - Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "rhSxQ4ieAYc",
      "thumbnail": "https://img.youtube.com/vi/rhSxQ4ieAYc/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=rhSxQ4ieAYc",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "averages_2",
      "title": "AVERAGE _ LESSON - 1 # INTRODUCTION",
      "channel": "Feel Free to Learn",
      "videoId": "Qx73gH1kdfw",
      "thumbnail": "https://img.youtube.com/vi/Qx73gH1kdfw/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=Qx73gH1kdfw",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "averages_3",
      "title": "AVERAGE _ LESSON - 2 # BASIC QUESTIONS",
      "channel": "Feel Free to Learn",
      "videoId": "w5Vel3L0OwY",
      "thumbnail": "https://img.youtube.com/vi/w5Vel3L0OwY/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=w5Vel3L0OwY",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "averages_4",
      "title": "Average Short Tricks in Hindi | Average Questions/Problems",
      "channel": "Dear Sir",
      "videoId": "mzGZfv63oD4",
      "thumbnail": "https://img.youtube.com/vi/mzGZfv63oD4/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=mzGZfv63oD4",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "ages": [
    {
      "id": "ages_1",
      "title": "Age Problems Tricks and Shortcuts | Maths Tricks | imran sir maths",
      "channel": "imran sir maths",
      "videoId": "PcmYrI-z118",
      "thumbnail": "https://img.youtube.com/vi/PcmYrI-z118/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=PcmYrI-z118",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "ages_2",
      "title": "Problems on Ages - Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "tJHl73PBnwY",
      "thumbnail": "https://img.youtube.com/vi/tJHl73PBnwY/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=tJHl73PBnwY",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "ages_3",
      "title": "Aptitude Made Easy   Problems on Ages full series, Learn maths #StayHome",
      "channel": "Jobs & Careers",
      "videoId": "7pg8aQNPkcE",
      "thumbnail": "https://img.youtube.com/vi/7pg8aQNPkcE/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=7pg8aQNPkcE",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "ages_4",
      "title": "Problem on Ages Trick In Hindi| Age Problem Shortcut | Math Trick | #shorts",
      "channel": "TUMI JITBE ",
      "videoId": "6vX52cyJ1M8",
      "thumbnail": "https://img.youtube.com/vi/6vX52cyJ1M8/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=6vX52cyJ1M8",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "probability": [
    {
      "id": "probability_1",
      "title": "Probability - Shortcuts & Tricks for 2026 Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "ximxxERGSUc",
      "thumbnail": "https://img.youtube.com/vi/ximxxERGSUc/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=ximxxERGSUc",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "probability_2",
      "title": "Probability Trick | Probability Aptitude Tricks | Probability DSSSB/CLASS 10/CLASS 12/Short Trick",
      "channel": "Dear Sir",
      "videoId": "mYbdGLnTd4c",
      "thumbnail": "https://img.youtube.com/vi/mYbdGLnTd4c/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=mYbdGLnTd4c",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "probability_3",
      "title": "Arithmetic fast trick l Probability l Problem-1 l #SSC #BANKING #UPSC l prelims level #mathstricks",
      "channel": "Exam Affairs",
      "videoId": "CkRNr2lCNlQ",
      "thumbnail": "https://img.youtube.com/vi/CkRNr2lCNlQ/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=CkRNr2lCNlQ",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "probability_4",
      "title": "SSC Maths: Complete Probability (प्रायिकता) Formula Cheat Sheet & Short Tricks",
      "channel": "Smart Study Hub",
      "videoId": "16_QUguNHyo",
      "thumbnail": "https://img.youtube.com/vi/16_QUguNHyo/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=16_QUguNHyo",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "permutations and combinations": [
    {
      "id": "permutations_and_combinations_1",
      "title": "Permutation and Combination Aptitude Tricks  | Circular Permutation | Shortcut/Tricks",
      "channel": "Dr.Gajendra Purohit - GATE / IIT JAM / CSIR NET",
      "videoId": "gT_riJtb1xg",
      "thumbnail": "https://img.youtube.com/vi/gT_riJtb1xg/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=gT_riJtb1xg",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "permutations_and_combinations_2",
      "title": "Permutation and Combination - Shortcuts & Tricks for 2026 Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "ETiRE7N7pEI",
      "thumbnail": "https://img.youtube.com/vi/ETiRE7N7pEI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=ETiRE7N7pEI",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "permutations_and_combinations_3",
      "title": "PERMUTATION AND COMBINATION  (P AND C) SHORTCUT//TRICKS FOR NDA/JEE/AIRFOCRE GROUP X/ CLASS 11 NCERT",
      "channel": "Unknown teacher",
      "videoId": "V7BWIgSSI6g",
      "thumbnail": "https://img.youtube.com/vi/V7BWIgSSI6g/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=V7BWIgSSI6g",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "permutations_and_combinations_4",
      "title": "PERMUTATION AND COMBINATION  (P AND C) SHORTCUT METHOD FOR NDA/JEE/AIRFOCRE GROUP X/ CLASS 11 NCERT",
      "channel": "Unknown teacher",
      "videoId": "gy2LQZAY_Fw",
      "thumbnail": "https://img.youtube.com/vi/gy2LQZAY_Fw/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=gy2LQZAY_Fw",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "data interpretation": [
    {
      "id": "data_interpretation_1",
      "title": "Data interpretation Tricks | Pie Chart | How to Solve Data interpretation Questions Easily ",
      "channel": "imran sir maths",
      "videoId": "xtj2ylwGwrg",
      "thumbnail": "https://img.youtube.com/vi/xtj2ylwGwrg/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=xtj2ylwGwrg",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "data_interpretation_2",
      "title": "DATA INTERPRETATION/ HARD QUESTION/ EASY Shortcuts| SOLVE IN SEC QUESTION for SSC CGL,CHSL,CPO,GD,JE",
      "channel": "CP EDUCARE",
      "videoId": "StZum3dAAGk",
      "thumbnail": "https://img.youtube.com/vi/StZum3dAAGk/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=StZum3dAAGk",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "data_interpretation_3",
      "title": "GATE 2027 Quantitative Aptitude – Data Interpretation | Complete Formula & Shortcut Tricks",
      "channel": "EDUZ LEARNING ",
      "videoId": "xFVbd3dA6GM",
      "thumbnail": "https://img.youtube.com/vi/xFVbd3dA6GM/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=xFVbd3dA6GM",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "data_interpretation_4",
      "title": "Data Interpretation DI । Ugc Net Paper-1 Important & Expected Questions MCQ Topics #ugcnet #netjrf",
      "channel": "🇮🇳 Easy Notes 4u Online study ",
      "videoId": "xWPqxow9MU8",
      "thumbnail": "https://img.youtube.com/vi/xWPqxow9MU8/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=xWPqxow9MU8",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "logical reasoning": [
    {
      "id": "logical_reasoning_1",
      "title": "Coding Decoding Tricks | Logical Reasoning Questions | Bank Exams #ytshorts #codingdecodingtricks",
      "channel": "Nyra Academy ",
      "videoId": "47rXPJ62sDE",
      "thumbnail": "https://img.youtube.com/vi/47rXPJ62sDE/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=47rXPJ62sDE",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "logical_reasoning_2",
      "title": "Reasoning Shortcut Tricks",
      "channel": "Guinness And Math Guy",
      "videoId": "LzzQRu4x8rg",
      "thumbnail": "https://img.youtube.com/vi/LzzQRu4x8rg/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=LzzQRu4x8rg",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "logical_reasoning_3",
      "title": "Dice 🎲 रीज़निंग | Missing Number| Reasoning Tricks for SSC CGL CHSL MTS CRPF RRB |",
      "channel": "TUMI JITBE ",
      "videoId": "aqx1IWu4Ftk",
      "thumbnail": "https://img.youtube.com/vi/aqx1IWu4Ftk/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=aqx1IWu4Ftk",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "logical_reasoning_4",
      "title": "2 Seconds Trick for Reasoning Missing Number! 😱 SSC CGL, CHSL, RRB NTPC | Lakshmi Mam #shorts #yt",
      "channel": "Focus40 Academy",
      "videoId": "neGSEr78mOE",
      "thumbnail": "https://img.youtube.com/vi/neGSEr78mOE/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=neGSEr78mOE",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "verbal ability": [
    {
      "id": "verbal_ability_1",
      "title": "Articles in Verbal Ability - Concept, Tips & Practice Exercises for Placement Tests, Jobs & Exams",
      "channel": "CareerRide",
      "videoId": "TNkq01wrqUg",
      "thumbnail": "https://img.youtube.com/vi/TNkq01wrqUg/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=TNkq01wrqUg",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "verbal_ability_2",
      "title": "Omission of Articles in Verbal Ability - Concept, Tips & Practice for Placement Tests, Jobs & Exams",
      "channel": "CareerRide",
      "videoId": "5ph-2SerrlY",
      "thumbnail": "https://img.youtube.com/vi/5ph-2SerrlY/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=5ph-2SerrlY",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "verbal_ability_3",
      "title": "MBA CET Verbal Section Tips and Tricks | JBIMS | MBA CET",
      "channel": "The Top Percentile - MBA",
      "videoId": "hZzwJYcVMkE",
      "thumbnail": "https://img.youtube.com/vi/hZzwJYcVMkE/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=hZzwJYcVMkE",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "verbal_ability_4",
      "title": "Verbal Analogy Quiz | Practice Question 3 | Verbal Ability #reasoning",
      "channel": "Happy Professional Training ",
      "videoId": "5siNMqGECxI",
      "thumbnail": "https://img.youtube.com/vi/5siNMqGECxI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=5siNMqGECxI",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "coding decoding": [
    {
      "id": "coding_decoding_1",
      "title": "Coding Decoding Reasoning Trick | Reasoning Trick | Maths Trick | imran sir maths",
      "channel": "imran sir maths",
      "videoId": "5uKXoKYV0MM",
      "thumbnail": "https://img.youtube.com/vi/5uKXoKYV0MM/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=5uKXoKYV0MM",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "coding_decoding_2",
      "title": "Coding and Decoding - Tricks & Shortcuts for 2026 - 2027 Placement tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "wwN3mJ-b4FY",
      "thumbnail": "https://img.youtube.com/vi/wwN3mJ-b4FY/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=wwN3mJ-b4FY",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "coding_decoding_3",
      "title": "Coding Decoding Question | Reasoning Tricks #codingdecodingtricks #reasoningtricks",
      "channel": "Nyra Academy ",
      "videoId": "Ptafuxy0mDA",
      "thumbnail": "https://img.youtube.com/vi/Ptafuxy0mDA/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=Ptafuxy0mDA",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "coding_decoding_4",
      "title": "Coding Decoding Tricks | Logical Reasoning Questions | Bank Exams #ytshorts #codingdecodingtricks",
      "channel": "Nyra Academy ",
      "videoId": "47rXPJ62sDE",
      "thumbnail": "https://img.youtube.com/vi/47rXPJ62sDE/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=47rXPJ62sDE",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "blood relations": [
    {
      "id": "blood_relations_1",
      "title": "Blood Relations - Tricks & Shortcuts for 2026 - 2027 Placement tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "LRdLhfDupMU",
      "thumbnail": "https://img.youtube.com/vi/LRdLhfDupMU/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=LRdLhfDupMU",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "blood_relations_2",
      "title": "Blood Reasoning Trick | Maths Trick |Reasoning Trick | imran sir maths",
      "channel": "imran sir maths",
      "videoId": "tPqrZh56tqI",
      "thumbnail": "https://img.youtube.com/vi/tPqrZh56tqI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=tPqrZh56tqI",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "blood_relations_3",
      "title": "Blood Relation Reasoning Tricks | Reasoning Blood Relation | Trick/Questions/Classes in Hindi",
      "channel": "Dear Sir",
      "videoId": "eFykHutJRzc",
      "thumbnail": "https://img.youtube.com/vi/eFykHutJRzc/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=eFykHutJRzc",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "blood_relations_4",
      "title": "Easy tricks for Blood Relationship | Harjeet Ma'am | Success Tree",
      "channel": "Success Tree - Online Classes",
      "videoId": "d6LxMKs5V6U",
      "thumbnail": "https://img.youtube.com/vi/d6LxMKs5V6U/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=d6LxMKs5V6U",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "syllogisms": [
    {
      "id": "syllogisms_1",
      "title": "Syllogism Without VENN Diagram | Solve Questions Without Pen | Syllogism Short Tricks",
      "channel": "Digital Tyari",
      "videoId": "YhQbZMK58VU",
      "thumbnail": "https://img.youtube.com/vi/YhQbZMK58VU/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=YhQbZMK58VU",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "syllogisms_2",
      "title": "Syllogism - Tricks & Shortcuts for 2026 - 2027 Placement tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "knFLfSr35wU",
      "thumbnail": "https://img.youtube.com/vi/knFLfSr35wU/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=knFLfSr35wU",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "syllogisms_3",
      "title": "Easy & Fast Syllogism Reasoning Tricks | PSI-STI-ASO Combine Group B Exam | By Sandip Patil Sir",
      "channel": "Reliable Academy",
      "videoId": "k0VqAqE-JGg",
      "thumbnail": "https://img.youtube.com/vi/k0VqAqE-JGg/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=k0VqAqE-JGg",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "syllogisms_4",
      "title": "SBI PO 2025 Syllogism Reasoning Tricks | SBI PO Syllogism ( Never/No Possibility) Practice Question",
      "channel": "EduTap Banking Exams",
      "videoId": "Y1_DUrpsXgI",
      "thumbnail": "https://img.youtube.com/vi/Y1_DUrpsXgI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=Y1_DUrpsXgI",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "directions": [
    {
      "id": "directions_1",
      "title": "Directions no diagram trick by chandan Venna sir #chandan_logics #chandan_venna_fan_club #reasoning",
      "channel": "Chandan Logics - English",
      "videoId": "5f5CGE67y7M",
      "thumbnail": "https://img.youtube.com/vi/5f5CGE67y7M/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=5f5CGE67y7M",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "directions_2",
      "title": "Direction Sense Questions | CSAT Reasoning Important Topics | UPSC CSAT Preparation 2025 | EduTap",
      "channel": "EduTap - UPSC",
      "videoId": "wkhnEb2FEiY",
      "thumbnail": "https://img.youtube.com/vi/wkhnEb2FEiY/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=wkhnEb2FEiY",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "directions_3",
      "title": "Direction Test Tricks | Logical Reasoning Tricks #viral #directiontest #shorts #reasoning",
      "channel": "Nyra Academy ",
      "videoId": "8mCRlyfYn5Y",
      "thumbnail": "https://img.youtube.com/vi/8mCRlyfYn5Y/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=8mCRlyfYn5Y",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "directions_4",
      "title": "Direction Sense Test | Reasoning Tricks || Direction problems ||GK ||GK with prima|",
      "channel": "GK with PRIMA",
      "videoId": "-0HMAIQvYqA",
      "thumbnail": "https://img.youtube.com/vi/-0HMAIQvYqA/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=-0HMAIQvYqA",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "clocks": [
    {
      "id": "clocks_1",
      "title": "Clock Formula Short Trick | Clock Angle Degree Short Trick | Clock Reasoning Aptitude",
      "channel": "LOGICALLY YOURS",
      "videoId": "UPmxMgRD1II",
      "thumbnail": "https://img.youtube.com/vi/UPmxMgRD1II/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=UPmxMgRD1II",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "clocks_2",
      "title": "That is REALLY QUICK II Angle Between Hands of Clock II Shortest Trick #youtubeshorts #clock #angle",
      "channel": "Suresh Aggarwal",
      "videoId": "BtJZwPo9xxI",
      "thumbnail": "https://img.youtube.com/vi/BtJZwPo9xxI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=BtJZwPo9xxI",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "clocks_3",
      "title": "Clock Reasoning..⏰🕕 Trick Formula #shorts #notes #reasoning #youtubeshorts",
      "channel": "Nidhi Kumari ",
      "videoId": "FRAax3d0j18",
      "thumbnail": "https://img.youtube.com/vi/FRAax3d0j18/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=FRAax3d0j18",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "clocks_4",
      "title": "At what time  both minute and hour hand coincide? ||clock trick",
      "channel": "MANDAL EDUCATIONAL JET",
      "videoId": "e_62O4G_ObE",
      "thumbnail": "https://img.youtube.com/vi/e_62O4G_ObE/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=e_62O4G_ObE",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "calendars": [
    {
      "id": "calendars_1",
      "title": "Calendar Tricks | Reasoning Tricks | Maths Tricks | imran sir maths",
      "channel": "imran sir maths",
      "videoId": "T6vzmw96Lms",
      "thumbnail": "https://img.youtube.com/vi/T6vzmw96Lms/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=T6vzmw96Lms",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "calendars_2",
      "title": "Aptitude Made Easy   Problems on Calendar full series, Learn maths #StayHome",
      "channel": "Jobs & Careers",
      "videoId": "fa0x2KkKPgk",
      "thumbnail": "https://img.youtube.com/vi/fa0x2KkKPgk/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=fa0x2KkKPgk",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "calendars_3",
      "title": "Calendar - Tricks & Shortcuts for Placement tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "oxc4G14nyUY",
      "thumbnail": "https://img.youtube.com/vi/oxc4G14nyUY/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=oxc4G14nyUY",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "calendars_4",
      "title": "Calendar | Calendar Shortcuts Tricks | Reasoning Classes| Calendar Reasoning for SSC CGL GD",
      "channel": "TUMI JITBE ",
      "videoId": "F7-PMSTrcRQ",
      "thumbnail": "https://img.youtube.com/vi/F7-PMSTrcRQ/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=F7-PMSTrcRQ",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "mixtures and alligation": [
    {
      "id": "mixtures_and_alligation_1",
      "title": "Mixture and Alligation - Shortcuts & Tricks for 2026 Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "OKSJDDAyqP0",
      "thumbnail": "https://img.youtube.com/vi/OKSJDDAyqP0/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=OKSJDDAyqP0",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "mixtures_and_alligation_2",
      "title": "Alligations and Mixtures Tricks | Mixture and Alligations Concept/Questions/Problems/Solutions",
      "channel": "Dear Sir",
      "videoId": "gA0EFrv9aL0",
      "thumbnail": "https://img.youtube.com/vi/gA0EFrv9aL0/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=gA0EFrv9aL0",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "mixtures_and_alligation_3",
      "title": "Alligations and Mixtures Tricks | Mixture and Alligations Concepts/Questions/Problems/Solutions",
      "channel": "imran sir maths",
      "videoId": "Xsg6-1c-IGI",
      "thumbnail": "https://img.youtube.com/vi/Xsg6-1c-IGI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=Xsg6-1c-IGI",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "mixtures_and_alligation_4",
      "title": "Fast Calculation Short Trick II Mixture Problem II Solve in 5 Seconds #quant #mixture #youtubeshorts",
      "channel": "Suresh Aggarwal",
      "videoId": "zQBFpxqI-84",
      "thumbnail": "https://img.youtube.com/vi/zQBFpxqI-84/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=zQBFpxqI-84",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "pipes and cisterns": [
    {
      "id": "pipes_and_cisterns_1",
      "title": "Pipes and Cisterns - Shortcuts & Tricks for 2026 Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "mBtBD1N7ywQ",
      "thumbnail": "https://img.youtube.com/vi/mBtBD1N7ywQ/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=mBtBD1N7ywQ",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "pipes_and_cisterns_2",
      "title": "Pipe and Cisterns Problems Tricks | Pipe and Tanki Shortcuts and Tricks | DSSSB, CTET, Bank PO",
      "channel": "Dear Sir",
      "videoId": "x3SEYdBUGaA",
      "thumbnail": "https://img.youtube.com/vi/x3SEYdBUGaA/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=x3SEYdBUGaA",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "pipes_and_cisterns_3",
      "title": "Pipe and Cistern Trick | maths trick by imran sir | Pipe and Tanki Shortcuts and Tricks",
      "channel": "imran sir maths",
      "videoId": "JZYnYhdCc1w",
      "thumbnail": "https://img.youtube.com/vi/JZYnYhdCc1w/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=JZYnYhdCc1w",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "pipes_and_cisterns_4",
      "title": "CAT 2026: Can You Solve This Pipes & Cisterns Question? 🔥",
      "channel": "Cracku - MBA CAT Preparation",
      "videoId": "Al3H7aJzkhI",
      "thumbnail": "https://img.youtube.com/vi/Al3H7aJzkhI/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=Al3H7aJzkhI",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "trains": [
    {
      "id": "trains_1",
      "title": "Problems on Trains - Shortcuts & Tricks for Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "78b4Jn4rw44",
      "thumbnail": "https://img.youtube.com/vi/78b4Jn4rw44/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=78b4Jn4rw44",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "trains_2",
      "title": "Time Speed and Distance Trick | Train Realted Questions | Maths Trick by imran sir | imran sir maths",
      "channel": "imran sir maths",
      "videoId": "m-s3vdPoIn4",
      "thumbnail": "https://img.youtube.com/vi/m-s3vdPoIn4/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=m-s3vdPoIn4",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "trains_3",
      "title": "Train Problems | Time, Speed and Distance",
      "channel": "Shiksha Target",
      "videoId": "tE9IoQptEVM",
      "thumbnail": "https://img.youtube.com/vi/tE9IoQptEVM/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=tE9IoQptEVM",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "trains_4",
      "title": "Problems on Trains Aptitude Trick | Yogesh Shirude",
      "channel": "Intelox",
      "videoId": "oUXiwqP8G3c",
      "thumbnail": "https://img.youtube.com/vi/oUXiwqP8G3c/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=oUXiwqP8G3c",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ],
  "boats and streams": [
    {
      "id": "boats_and_streams_1",
      "title": "Boats and Streams - Shortcuts & Tricks for 2026 Placement Tests, Job Interviews & Exams",
      "channel": "CareerRide",
      "videoId": "-EdJ4kAW-j4",
      "thumbnail": "https://img.youtube.com/vi/-EdJ4kAW-j4/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=-EdJ4kAW-j4",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "boats_and_streams_2",
      "title": "Boat And Stream | Boat And Stream Problems Tricks/Concept/Formula/Short Trick/Shortcut | In Hindi",
      "channel": "Dear Sir",
      "videoId": "4HRLswVPOG8",
      "thumbnail": "https://img.youtube.com/vi/4HRLswVPOG8/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=4HRLswVPOG8",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "boats_and_streams_3",
      "title": "Boat And Stream | Boat and Stream problems tricks | maths trick by imran sir maths",
      "channel": "imran sir maths",
      "videoId": "bGsngq-JTuM",
      "thumbnail": "https://img.youtube.com/vi/bGsngq-JTuM/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=bGsngq-JTuM",
      "duration": "Lesson",
      "views": "High Quality"
    },
    {
      "id": "boats_and_streams_4",
      "title": "Boat and stream",
      "channel": "STEP - IN MATHS",
      "videoId": "V9zDSG3To54",
      "thumbnail": "https://img.youtube.com/vi/V9zDSG3To54/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=V9zDSG3To54",
      "duration": "Lesson",
      "views": "High Quality"
    }
  ]
};

// Expert study tips per topic
const studyTips = {
  "number system": [
    "Learn LCM/HCF formulas",
    "Practice divisibility rules for 7, 8, 9, 11",
    "Memorize squares up to 30 and cubes up to 15",
    "Practice remainder theorem and unit digit techniques"
  ],
  "percentages": [
    "Memorize standard fraction-to-percentage conversions (1/2 to 1/12)",
    "Master successive percentage change: a + b + (ab)/100",
    "Practice expenditure vs consumption trade-off problems"
  ],
  "profit and loss": [
    "Understand Cost Price, Selling Price and Marked Price relationship",
    "Learn dishonest dealer discount and false weight formulas",
    "Practice successive discount calculations"
  ],
  "simple interest": [
    "Master SI = (P * R * T) / 100 fundamentals",
    "Practice sum doubling/tripling time period questions",
    "Learn installment payment calculation formulas"
  ],
  "compound interest": [
    "Use formula A = P(1 + r/100)^n and compounding intervals",
    "Learn 2-year difference formula: CI - SI = P(R/100)^2",
    "Practice 3-year difference formula and effective rate method"
  ],
  "time and work": [
    "Always convert work into 1-day individual units (LCM method)",
    "Calculate efficiencies of workers as parts of total work",
    "Practice alternate-day work and workers joining/leaving scenarios"
  ],
  "time speed distance": [
    "Convert km/h to m/s by multiplying with 5/18 and vice-versa (18/5)",
    "Use relative speed: (S1 + S2) in opposite directions, (S1 - S2) in same direction",
    "Practice average speed formula: 2xy / (x + y)"
  ],
  "ratio and proportion": [
    "Master finding combined ratios A:B:C from A:B and B:C",
    "Practice coin-based ratio problems (denominations and total value)",
    "Understand mean, third, and fourth proportional equations"
  ],
  "averages": [
    "Use formula: Average = Total Sum / Number of Elements",
    "Practice weighted average and replacement of members techniques",
    "Understand change in average upon addition or exclusion"
  ],
  "ages": [
    "Set linear equations using Present Age as base variable X",
    "Formulate past and future conditions carefully (+ years, - years)",
    "Use ratio cross-multiplication shortcuts to solve in seconds"
  ],
  "probability": [
    "Use classical formula P(E) = Favorable outcomes / Total outcomes",
    "Master deck of cards (52 cards, 4 suits, 13 ranks, 12 face cards)",
    "Practice coin tosses and dice rolls combined probabilities"
  ],
  "permutations and combinations": [
    "Understand difference: Permutation is arrangement (order matters), Combination is selection",
    "Formulae: nPr = n! / (n - r)! and nCr = n! / [r! * (n - r)!]",
    "Master grouping and vowels-together problem types"
  ],
  "data interpretation": [
    "Master fast approximations and mental percentage estimation",
    "Practice reading Bar Charts, Pie Charts, and Data Tables accurately",
    "Calculate ratio changes and growth rates directly without calculating absolute values"
  ],
  "logical reasoning": [
    "Identify pattern progressions in number and letter series",
    "Draw clean diagrams for linear and circular seating arrangements",
    "Use elimination strategy on multiple-choice options"
  ],
  "verbal ability": [
    "Check Subject-Verb Agreement rules and pronoun antecedents",
    "Look for context clues in reading comprehension and sentence completion",
    "Memorize high-frequency GRE/CAT root words, synonyms, and idioms"
  ],
  "coding decoding": [
    "Write alphabet position ranks (A=1 to Z=26) and reverse ranks (A=26 to Z=1)",
    "Check for shift patterns (+1, -2, alternate)",
    "Look for reverse word order, vowel shifts, and cross-letter coding"
  ],
  "blood relations": [
    "Draw standard family tree diagrams (+ for male, - for female, = for spouses)",
    "Break complex \"Pointing to someone\" statements from the end of the sentence",
    "Be careful with gender assumptions based on names alone"
  ],
  "syllogisms": [
    "Draw standard Venn diagrams for statements",
    "Check if conclusion is valid in all possible Venn diagrams",
    "Understand complimentary pairs (Either I or II follows for Some + No)"
  ],
  "directions": [
    "Always fix standard 4 cardinal directions (N, S, E, W) on paper",
    "Use Pythagoras Theorem (a^2 + b^2 = c^2) for shortest distance",
    "For shadows: Sunrise shadow falls West; Sunset shadow falls East"
  ],
  "clocks": [
    "Formula for angle between hands: |30H - (11/2)M|",
    "Minute hand moves 6 degrees per minute, hour hand moves 0.5 degrees per minute",
    "Hands coincide 22 times and are at right angles 44 times in 24 hours"
  ],
  "calendars": [
    "Normal year has 1 odd day (365 % 7 = 1), Leap year has 2 odd days (366 % 7 = 2)",
    "Century leap years must be divisible by 400 (e.g. 1600, 2000)",
    "Find day by adding total odd days from base century date"
  ],
  "mixtures and alligation": [
    "Rule of Alligation: (Cheaper Quantity) / (Dearer Quantity) = (d - m) / (m - c)",
    "Practice replacement problems: Final = Initial * (1 - x/C)^n",
    "Apply alligation to percentage profits and average costs"
  ],
  "pipes and cisterns": [
    "Inlet pipes do positive work (+1/time), outlet leaks do negative work (-1/time)",
    "Use total tank capacity as LCM of all given times",
    "Calculate net filling rate per minute when multiple taps operate"
  ],
  "trains": [
    "Length of train + Length of platform/bridge = Total distance to cross",
    "Crossing a man or pole: distance = train length only",
    "Relative speed applies when two trains are moving"
  ],
  "boats and streams": [
    "Downstream speed = Boat speed (u) + Stream speed (v)",
    "Upstream speed = Boat speed (u) - Stream speed (v)",
    "Boat speed in still water = (Downstream + Upstream) / 2"
  ],
  "default": [
    "Review foundational formulas and shortcut methods",
    "Practice with a timed stopwatch to build exam speed",
    "Analyze incorrect questions and review step-by-step solutions",
    "Solve authentic previous-year question papers"
  ]
};

router.get('/:topic', (req, res) => {
  const topicRaw = req.params.topic;
  if (!topicRaw) {
    return res.status(400).json({ error: 'Topic parameter required' });
  }

  const topic = topicRaw.toLowerCase().trim();

  // Try exact match first
  let videos = verifiedVideoDB[topic];

  // Fuzzy match if exact not found
  if (!videos) {
    const key = Object.keys(verifiedVideoDB).find(k =>
      k.includes(topic) || topic.includes(k) ||
      k.split(' ').some(word => topic.includes(word) && word.length > 3)
    );
    videos = key ? verifiedVideoDB[key] : null;
  }

  // Find matching study tips
  const tipKey = Object.keys(studyTips).find(k => topic.includes(k) || k.includes(topic));
  const tips = studyTips[tipKey] || studyTips['default'];

  if (!videos) {
    // Verified fallback from Number System
    videos = verifiedVideoDB['number system'] || [];
  }

  res.json({ videos, studyTips: tips });
});

module.exports = router;
