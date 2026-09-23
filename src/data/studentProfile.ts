import { StudentProfile } from '../types';

export const STUDENT_PROFILE: StudentProfile = {
  name: "AYON BARMAN RUPO",
  nationality: "Bangladeshi",
  targetUniversity: "Konyang University (건양대학교)",
  targetProgram: "Korean Language Program (KLP / 한국어 연수 과정)",
  family: {
    count: 4,
    members: [
      {
        relation: "Father",
        occupation: "Businessman",
        koreanRelation: "아버지",
        koreanOccupation: "사업가"
      },
      {
        relation: "Mother",
        occupation: "Teacher",
        koreanRelation: "어머니",
        koreanOccupation: "선생님"
      },
      {
        relation: "Younger Brother",
        occupation: "Student",
        koreanRelation: "남동생",
        koreanOccupation: "학생"
      },
      {
        relation: "Ayon (Self)",
        occupation: "Student / Applicant",
        koreanRelation: "본인 (지원자)",
        koreanOccupation: "학생"
      }
    ]
  }
};

export const UNIVERSITY_INFO = {
  koreanName: "건양대학교",
  englishName: "Konyang University",
  campuses: "Nonsan Main Campus & Daejeon Medical Campus",
  klpProgram: "Korean Language Program (한국어 연수 과정)",
  reputationHighlights: "Renowned for international student support, excellent faculties, medical science & applied humanities, safe academic environment in Chungcheongnam-do.",
  disclaimer: "Notice: These practice materials are developed for AYON BARMAN RUPO's Konyang University KLP interview preparation based on standard Korean university KLP interview syllabi. These are not official Konyang University administrative questionnaires."
};
