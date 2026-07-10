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

export const JMI_CIVIL_CURRICULUM: Record<string, SemesterCurriculum> = {
  'Semester 3': {
    subjects: [
      { code: 'ASM-301', name: 'Universal Human Values', credits: 3, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics III', credits: 3, type: 'Theory' },
      { code: 'CEC-301', name: 'Engineering Mechanics', credits: 3, type: 'Theory' },
      { code: 'CEC-302', name: 'Building Materials', credits: 3, type: 'Theory' },
      { code: 'CEC-303', name: 'Surveying', credits: 3, type: 'Theory' },
      { code: 'CEC-304', name: 'Strength of Materials', credits: 3, type: 'Theory' },
      { code: 'ASM-302', name: 'Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'CEL-301', name: 'Engineering Mechanics Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-302', name: 'Building Materials Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-303', name: 'Surveying Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-304', name: 'Strength of Materials Lab', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'ASM-401', name: 'Environmental Science', credits: 2, type: 'Theory' },
      { code: 'CEC-401', name: 'Structural Analysis', credits: 3, type: 'Theory' },
      { code: 'CEC-402', name: 'Fluid Mechanics', credits: 3, type: 'Theory' },
      { code: 'CEC-403', name: 'Concrete Technology', credits: 3, type: 'Theory' },
      { code: 'AST-401', name: 'Operations Research', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'Engineering Economics', credits: 3, type: 'Theory' },
      { code: 'CEL-401', name: 'Structural Analysis Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-402', name: 'Fluid Mechanics Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-403', name: 'Concrete Technology Lab', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric & Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'CEC-501', name: 'Geotechnical Engineering - I', credits: 3, type: 'Theory' },
      { code: 'CEC-502', name: 'Design of Structures - I', credits: 3, type: 'Theory' },
      { code: 'CEC-503', name: 'Environmental Engineering - I', credits: 3, type: 'Theory' },
      { code: 'CEC-504', name: 'Transportation Engineering - I', credits: 3, type: 'Theory' },
      { code: 'CEC-505', name: 'Water Resources Engineering - I', credits: 3, type: 'Theory' },
      { code: 'CEL-501', name: 'Geotechnical Engineering Lab - I', credits: 1, type: 'Lab' },
      { code: 'CEL-502', name: 'Environmental Engineering Lab - I', credits: 1, type: 'Lab' },
      { code: 'CEL-503', name: 'CAD Lab', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_group1',
        label: 'Professional Elective-I',
        options: [
          { code: 'CEE-501', name: 'Advanced Surveying', credits: 3, type: 'Theory' },
          { code: 'CEE-502', name: 'Advanced Mechanics of Solids', credits: 3, type: 'Theory' },
          { code: 'CEE-503', name: 'Rock Mechanics', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'CEC-601', name: 'Geotechnical Engineering - II', credits: 3, type: 'Theory' },
      { code: 'CEC-602', name: 'Design of Structures - II', credits: 3, type: 'Theory' },
      { code: 'CEC-603', name: 'Environmental Engineering - II', credits: 3, type: 'Theory' },
      { code: 'CEC-604', name: 'Transportation Engineering - II', credits: 3, type: 'Theory' },
      { code: 'CEL-601', name: 'Geotechnical Engineering Lab - II', credits: 1, type: 'Lab' },
      { code: 'CEL-602', name: 'Transportation Engineering Lab - I', credits: 1, type: 'Lab' },
      { code: 'CEP-601', name: 'Seminar', credits: 1, type: 'Theory' }
    ],
    electives: [
      {
        id: 'sem6_group1',
        label: 'Professional Elective-II',
        options: [
          { code: 'CEE-601', name: 'Bridge Engineering', credits: 3, type: 'Theory' },
          { code: 'CEE-602', name: 'Ground Improvement Techniques', credits: 3, type: 'Theory' },
          { code: 'CEE-603', name: 'Prestressed Concrete', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'CEP-701', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'CEP-702', name: 'Minor Project', credits: 4, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_group1',
        label: 'Professional Elective-III',
        options: [
          { code: 'CEE-701', name: 'Advanced Concrete Technology', credits: 3, type: 'Theory' },
          { code: 'CEE-702', name: 'Earth and Earth Retaining Structures', credits: 3, type: 'Theory' },
          { code: 'CEE-703', name: 'Hydraulic Structures', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_group2',
        label: 'Professional Elective-IV',
        options: [
          { code: 'CEE-704', name: 'Traffic Engineering', credits: 3, type: 'Theory' },
          { code: 'CEE-705', name: 'Air Pollution and Control', credits: 3, type: 'Theory' },
          { code: 'CEE-706', name: 'Construction Management', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_group3',
        label: 'Professional Elective-V',
        options: [
          { code: 'CEE-707', name: 'Structural Dynamics', credits: 3, type: 'Theory' },
          { code: 'CEE-708', name: 'Ground Water Hydrology', credits: 3, type: 'Theory' },
          { code: 'CEE-709', name: 'Environmental Impact Assessment', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_open_group',
        label: 'Open Elective-III',
        options: [
          { code: 'CEO-701', name: 'Disaster Management', credits: 3, type: 'Theory' },
          { code: 'CEO-702', name: 'Environmental Management', credits: 3, type: 'Theory' },
          { code: 'CEO-703', name: 'Remote Sensing and GIS', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'CEP-801', name: 'Major Project', credits: 8, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_open_group1',
        label: 'Open Elective-IV',
        options: [
          { code: 'CEO-801', name: 'Project Management', credits: 3, type: 'Theory' },
          { code: 'CEO-802', name: 'Solid Waste Management', credits: 3, type: 'Theory' },
          { code: 'CEO-803', name: 'Smart Cities', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_open_group2',
        label: 'Open Elective-V',
        options: [
          { code: 'CEO-804', name: 'Renewable Energy Resources', credits: 3, type: 'Theory' },
          { code: 'CEO-805', name: 'Transport Planning and Management', credits: 3, type: 'Theory' },
          { code: 'CEO-806', name: 'Industrial Waste Treatment', credits: 3, type: 'Theory' }
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
export function getDefaultCurriculumSubjects(
  semesterTitle: string,
  department: string = 'Electronics & Communication Engineering'
): { subjects: any[]; electiveSelections: Record<string, string> } {
  const isCivil = department === 'Civil Engineering';
  const semData = isCivil ? JMI_CIVIL_CURRICULUM[semesterTitle] : JMI_CURRICULUM[semesterTitle];
  if (!semData) {
    return { subjects: [], electiveSelections: {} };
  }

  const subjectsList: any[] = [];
  const electiveSelections: Record<string, string> = {};

  // Add non-electives
  semData.subjects.forEach((s) => {
    const id = isCivil 
      ? `sub_jmi_civil_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
      : `sub_jmi_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`;
    subjectsList.push({
      id,
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
        const id = isCivil
          ? `sub_jmi_civil_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
          : `sub_jmi_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`;
        subjectsList.push({
          id,
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
