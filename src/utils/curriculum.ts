export interface CurriculumSubject {
  code: string;
  name: string;
  credits: number;
  type: 'Theory' | 'Lab';
}

export interface ElectiveGroup {
  id: string; // e.g. "sem5_group1"
  label: string; // e.g. "Professional Elective"
  options: CurriculumSubject[];
}

export interface SemesterCurriculum {
  subjects: CurriculumSubject[]; // Non-elective subjects
  electives?: ElectiveGroup[];
}

export const JMI_CURRICULUM: Record<string, SemesterCurriculum> = {
  'Semester 3': {
    subjects: [
      { code: 'ASM-301', name: 'Universal Human Values', credits: 3, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics III', credits: 3, type: 'Theory' },
      { code: 'ECC-301', name: 'Electronic Devices and Circuits-I', credits: 3, type: 'Theory' },
      { code: 'ECC-302', name: 'Circuit Analysis and Synthesis', credits: 3, type: 'Theory' },
      { code: 'ECC-303', name: 'Logic Design', credits: 3, type: 'Theory' },
      { code: 'ECC-304', name: 'Signals and Systems', credits: 3, type: 'Theory' },
      { code: 'ASM-302', name: 'Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'ECL-301', name: 'Electronic Devices and Circuits-I Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-302', name: 'Circuit Analysis and Synthesis Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-303', name: 'Logic Design Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-304', name: 'Electronics Workshop', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'ASM-401', name: 'Environmental Science', credits: 2, type: 'Theory' },
      { code: 'ECC-401', name: 'Electronic Devices and Circuits-II', credits: 3, type: 'Theory' },
      { code: 'ECC-402', name: 'Computer Architecture', credits: 3, type: 'Theory' },
      { code: 'ECC-403', name: 'Analog Communication', credits: 3, type: 'Theory' },
      { code: 'AST-401', name: 'Operations Research', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'Economics', credits: 3, type: 'Theory' },
      { code: 'ECL-401', name: 'Electronic Devices and Circuits-II Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-402', name: 'Computer Architecture Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-403', name: 'Analog Communication Lab', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric and Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'ECC-501', name: 'Active Filters and Signal Processing', credits: 3, type: 'Theory' },
      { code: 'ECC-502', name: 'Digital Communication', credits: 3, type: 'Theory' },
      { code: 'ECC-503', name: 'Microprocessors and Applications', credits: 3, type: 'Theory' },
      { code: 'ECC-504', name: 'Electromagnetic Field Theory', credits: 3, type: 'Theory' },
      { code: 'ECC-505', name: 'Instrumentation and Control Systems', credits: 3, type: 'Theory' },
      { code: 'ECL-501', name: 'Active Filters and Signal Processing Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-502', name: 'Digital Communication Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-503', name: 'Microprocessors and Applications Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-504', name: 'Instrumentation and Control Systems Lab', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_group1',
        label: 'Professional Elective',
        options: [
          { code: 'ECE-501', name: 'DCS', credits: 3, type: 'Theory' },
          { code: 'ECE-502', name: 'Bio-medical Electronics', credits: 3, type: 'Theory' },
          { code: 'ECE-503', name: 'High Speed Electronics', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'ECC-601', name: 'VLSI Design', credits: 3, type: 'Theory' },
      { code: 'ECC-602', name: 'DSP', credits: 3, type: 'Theory' },
      { code: 'ECC-603', name: 'Microwave Engineering', credits: 3, type: 'Theory' },
      { code: 'ECC-604', name: 'DCCN', credits: 3, type: 'Theory' },
      { code: 'ECL-601', name: 'VLSI Design Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-602', name: 'DSP Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-603', name: 'Microwave and Optical Engineering Lab', credits: 1, type: 'Lab' },
      { code: 'ECL-604', name: 'DCCN Lab', credits: 1, type: 'Lab' },
      { code: 'ECP-601', name: 'Seminar', credits: 1, type: 'Theory' }
    ],
    electives: [
      {
        id: 'sem6_group1',
        label: 'Professional Elective',
        options: [
          { code: 'ECE-601', name: 'Antenna and Wave Propagation', credits: 3, type: 'Theory' },
          { code: 'ECE-602', name: 'Adaptive Signal Processing', credits: 3, type: 'Theory' },
          { code: 'ECE-603', name: 'Digital System Design', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'ECP-701', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'ECP-702', name: 'Project', credits: 3, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_group1',
        label: 'Professional Elective Group 1',
        options: [
          { code: 'ECE-701', name: 'Embedded Systems', credits: 3, type: 'Theory' },
          { code: 'ECE-702', name: 'Digital Image Processing', credits: 3, type: 'Theory' },
          { code: 'ECE-703', name: 'Organic Electronics', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_group2',
        label: 'Professional Elective Group 2',
        options: [
          { code: 'ECE-704', name: 'Information Theory and Coding', credits: 3, type: 'Theory' },
          { code: 'ECE-705', name: 'High Speed Communication Networks', credits: 3, type: 'Theory' },
          { code: 'ECE-706', name: 'MIMO Wireless Communication', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_group3',
        label: 'Professional Elective Group 3',
        options: [
          { code: 'ECE-707', name: 'Optical Fiber Communication', credits: 3, type: 'Theory' },
          { code: 'ECE-708', name: 'Fuzzy Logic and Neural Networks', credits: 3, type: 'Theory' },
          { code: 'ECE-709', name: 'Wireless Sensor Networks', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_open_group',
        label: 'Open Elective',
        options: [
          { code: 'ECO-701', name: 'Internet of Things', credits: 3, type: 'Theory' },
          { code: 'ECO-702', name: 'Probability and Stochastic Process', credits: 3, type: 'Theory' },
          { code: 'ECO-703', name: 'Digital System Design', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'ECP-801', name: 'Project', credits: 6, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_open_group1',
        label: 'Open Elective Group 1',
        options: [
          { code: 'ECO-801', name: 'Introduction to MEMS and NEMS', credits: 3, type: 'Theory' },
          { code: 'ECO-802', name: 'Nano-electronics Devices', credits: 3, type: 'Theory' },
          { code: 'ECO-803', name: 'Device Modeling and Circuit Simulation', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_open_group2',
        label: 'Open Elective Group 2',
        options: [
          { code: 'ECO-804', name: 'Wireless Communication', credits: 3, type: 'Theory' },
          { code: 'ECO-805', name: 'Information Theory for Cyber Security', credits: 3, type: 'Theory' },
          { code: 'ECO-806', name: 'Introduction to AI and ML', credits: 3, type: 'Theory' }
        ]
      }
    ]
  }
};

/**
 * Returns default list of subjects for a given Semester.
 * By default, this maps CurriculumSubject items to Subject items (with generated unique IDs).
 * For electives, the first option in the group is chosen as the default.
 */
export function getDefaultCurriculumSubjects(semesterTitle: string): { subjects: any[]; electiveSelections: Record<string, string> } {
  const semData = JMI_CURRICULUM[semesterTitle];
  if (!semData) {
    return { subjects: [], electiveSelections: {} };
  }

  const subjectsList: any[] = [];
  const electiveSelections: Record<string, string> = {};

  // Add non-electives
  semData.subjects.forEach((s) => {
    subjectsList.push({
      id: `sub_jmi_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`,
      name: `${s.code} ${s.name}`,
      type: s.type,
      credits: s.credits,
      isCurriculum: true,
      originalCode: s.code,
      originalName: s.name
    });
  });

  // Add default electives (the first option in each group)
  if (semData.electives) {
    semData.electives.forEach((group) => {
      if (group.options.length > 0) {
        const defaultOpt = group.options[0];
        electiveSelections[group.id] = defaultOpt.code;
        subjectsList.push({
          id: `sub_jmi_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`,
          name: `${defaultOpt.code} ${defaultOpt.name}`,
          type: defaultOpt.type,
          credits: defaultOpt.credits,
          isCurriculum: true,
          originalCode: defaultOpt.code,
          originalName: defaultOpt.name,
          electiveGroupId: group.id
        });
      }
    });
  }

  return { subjects: subjectsList, electiveSelections };
}
