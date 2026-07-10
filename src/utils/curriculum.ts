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
      { code: 'ASM-302', name: 'Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics III', credits: 3, type: 'Theory' },
      { code: 'CEC-301', name: 'Soil Mechanics', credits: 3, type: 'Theory' },
      { code: 'CEC-302', name: 'Fluid Mechanics', credits: 3, type: 'Theory' },
      { code: 'CEC-303', name: 'Engineering Materials & Concrete Technology', credits: 3, type: 'Theory' },
      { code: 'CEC-304', name: 'Geomatics', credits: 3, type: 'Theory' },
      { code: 'CEL-301', name: 'Soil Mechanics Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-302', name: 'Fluid Mechanics Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-303', name: 'Engineering Materials & Concrete Technology Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-304', name: 'Geomatics Engineering Lab', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'CEC-401', name: 'Structural Analysis I', credits: 3, type: 'Theory' },
      { code: 'CEC-402', name: 'Hydraulics', credits: 3, type: 'Theory' },
      { code: 'CEC-403', name: 'Building Construction and Quantity Surveying', credits: 3, type: 'Theory' },
      { code: 'AST-401', name: 'Operations Research', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'Economics', credits: 3, type: 'Theory' },
      { code: 'CEL-401', name: 'Structural Analysis Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-402', name: 'Hydraulics Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-403', name: 'Civil Engineering Drawing & CAD Lab', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric and Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'CEC-501', name: 'Soil Mechanics', credits: 3, type: 'Theory' },
      { code: 'CEC-502', name: 'Water Treatment & Supply', credits: 3, type: 'Theory' },
      { code: 'CEC-503', name: 'Design of RCC Structures', credits: 3, type: 'Theory' },
      { code: 'CEC-504', name: 'Structural Analysis II', credits: 3, type: 'Theory' },
      { code: 'CEC-505', name: 'Design of Steel Structures', credits: 3, type: 'Theory' },
      { code: 'CEL-501', name: 'Soil Mechanics Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-502', name: 'Water Treatment Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-503', name: 'RCC Design & Drawing Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-506', name: 'Surveying Camp', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_group1',
        label: 'Professional Elective (PEC)',
        options: [
          { code: 'CEE-501', name: 'Open Channel Flow', credits: 3, type: 'Theory' },
          { code: 'CEE-50x', name: 'Other PEC through SWAYAM', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'CEC-601', name: 'Engineering Economics & Construction Management', credits: 3, type: 'Theory' },
      { code: 'CEC-602', name: 'Wastewater Collection and Treatment', credits: 3, type: 'Theory' },
      { code: 'CEC-603', name: 'Transportation Engineering', credits: 3, type: 'Theory' },
      { code: 'CEC-604', name: 'Engineering Hydrology', credits: 3, type: 'Theory' },
      { code: 'CEL-601', name: 'Construction Management Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-602', name: 'Wastewater Engineering Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-603', name: 'Transportation Engineering Lab', credits: 1, type: 'Lab' },
      { code: 'CEL-605', name: 'Civil Engineering Software Lab', credits: 1, type: 'Lab' },
      { code: 'CEP-601', name: 'Seminar', credits: 1, type: 'Theory' }
    ],
    electives: [
      {
        id: 'sem6_group1',
        label: 'Professional Elective',
        options: [
          { code: 'CEE-601', name: 'Advanced Structural Design', credits: 3, type: 'Theory' },
          { code: 'CEE-60x', name: 'Other PEC through SWAYAM', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'CEP-701', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'CEP-702', name: 'Project', credits: 3, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_group1',
        label: 'Professional Elective Slot 1',
        options: [
          { code: 'CEE-701', name: 'Foundation Engineering', credits: 3, type: 'Theory' },
          { code: 'CEE-70x', name: 'Other PEC', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_group2',
        label: 'Professional Elective Slot 2',
        options: [
          { code: 'CEE-702', name: 'Advanced Structural Design II', credits: 3, type: 'Theory' },
          { code: 'CEE-70y', name: 'Other PEC', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_group3',
        label: 'Professional Elective Slot 3',
        options: [
          { code: 'CEE-703', name: 'Irrigation Engineering', credits: 3, type: 'Theory' },
          { code: 'CEE-70z', name: 'Other PEC', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_group4',
        label: 'Professional Elective Slot 4',
        options: [
          { code: 'CEE-704', name: 'Advanced Transportation Engineering', credits: 3, type: 'Theory' },
          { code: 'CEE-705', name: 'Building Services', credits: 3, type: 'Theory' },
          { code: 'CEE-70w', name: 'Other PEC', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_open_group',
        label: 'Open Elective',
        options: [
          { code: 'CEO-701', name: 'Construction Project Management', credits: 3, type: 'Theory' },
          { code: 'CEO-702', name: 'Computational Methods in Civil Engineering', credits: 3, type: 'Theory' },
          { code: 'CEO-70x', name: 'Other OEC through SWAYAM', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'CEP-801', name: 'Major Project', credits: 6, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_open_group1',
        label: 'Open Elective Slot 1',
        options: [
          { code: 'CEO-801', name: 'Environmental Pollution Control', credits: 3, type: 'Theory' },
          { code: 'CEO-802', name: 'Water Resources Engineering', credits: 3, type: 'Theory' },
          { code: 'CEO-803', name: 'Earth Resistant Design', credits: 3, type: 'Theory' },
          { code: 'CEO-804', name: 'Advanced Geomatics', credits: 3, type: 'Theory' },
          { code: 'CEO-80x', name: 'Other OEC through SWAYAM', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_open_group2',
        label: 'Open Elective Slot 2',
        options: [
          { code: 'CEO-80y', name: 'Other OEC through SWAYAM', credits: 3, type: 'Theory' }
        ]
      }
    ]
  }
};

export const JMI_VLSI_CURRICULUM: Record<string, SemesterCurriculum> = {
  'Semester 3': {
    subjects: [
      { code: 'ASM-301', name: 'Universal Human Values', credits: 3, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics III', credits: 3, type: 'Theory' },
      { code: 'VDC-301', name: 'Electronic Devices', credits: 3, type: 'Theory' },
      { code: 'VDC-302', name: 'Digital System Design', credits: 3, type: 'Theory' },
      { code: 'VDC-303', name: 'Signals and Systems', credits: 3, type: 'Theory' },
      { code: 'VDC-304', name: 'Network Theory', credits: 3, type: 'Theory' },
      { code: 'ASM-302', name: 'Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'VDL-301', name: 'Electronic Devices Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-302', name: 'Digital System Design Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-303', name: 'Electronics Workshop Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-304', name: 'Network Theory Lab', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'VDC-401', name: 'Analog Circuits', credits: 3, type: 'Theory' },
      { code: 'VDC-402', name: 'Microprocessors and its Applications', credits: 3, type: 'Theory' },
      { code: 'VDC-403', name: 'Analog and Digital Communication', credits: 3, type: 'Theory' },
      { code: 'AST-401', name: 'Operations Research (OEC-I)', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'Engineering Economics (OEC-II)', credits: 3, type: 'Theory' },
      { code: 'VDL-401', name: 'Analog Circuits Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-402', name: 'Microprocessors Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-403', name: 'Analog and Digital Communication Lab', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric and Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'VDC-501', name: 'Digital Signal Processing', credits: 3, type: 'Theory' },
      { code: 'VDC-502', name: 'Electromagnetic Waves', credits: 3, type: 'Theory' },
      { code: 'VDC-503', name: 'Digital IC Design', credits: 3, type: 'Theory' },
      { code: 'VDC-504', name: 'Control Systems', credits: 3, type: 'Theory' },
      { code: 'VDC-505', name: 'Microcontrollers and Embedded Systems', credits: 3, type: 'Theory' },
      { code: 'VDL-501', name: 'Digital Signal Processing Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-502', name: 'Digital IC Design Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-503', name: 'Microcontrollers and Embedded Systems Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-504', name: 'Electronic Systems Design and Verification Lab', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_vlsi_group1',
        label: 'Professional Elective (PEC)',
        options: [
          { code: 'VDE-501', name: 'Electronic Systems Design and Verification Using HDL', credits: 3, type: 'Theory' },
          { code: 'VDE-502', name: 'Introduction to VLSI Life Cycle', credits: 3, type: 'Theory' },
          { code: 'VDE-503', name: 'Memory Design and Testing', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'VDC-601', name: 'VLSI Physical Design', credits: 3, type: 'Theory' },
      { code: 'VDC-602', name: 'VLSI Testing and Design For Testability', credits: 3, type: 'Theory' },
      { code: 'VDC-603', name: 'Analog and Mixed Signal IC Design', credits: 3, type: 'Theory' },
      { code: 'VDC-604', name: 'VLSI Fabrication Technology', credits: 3, type: 'Theory' },
      { code: 'VDL-601', name: 'VLSI Physical Design Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-602', name: 'VLSI Testing and Design For Testability Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-603', name: 'Analog and Mixed Signal IC Design Lab', credits: 1, type: 'Lab' },
      { code: 'VDL-604', name: 'VLSI Fabrication Technology Lab', credits: 1, type: 'Lab' },
      { code: 'VDP-601', name: 'Seminar (Literature Review)', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem6_vlsi_group1',
        label: 'Professional Elective (PEC)',
        options: [
          { code: 'VDE-601', name: 'Computer Architecture and Organization', credits: 3, type: 'Theory' },
          { code: 'VDE-602', name: 'Semiconductor Materials Synthesis and Characterization', credits: 3, type: 'Theory' },
          { code: 'VDE-603', name: 'Semiconductor Device Modelling', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'VDP-701', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'VDP-702', name: 'Project', credits: 3, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_vlsi_group1',
        label: 'Professional Elective Slot 1',
        options: [
          { code: 'VDE-701', name: 'RF Microelectronic Devices', credits: 3, type: 'Theory' },
          { code: 'VDE-702', name: 'RF CMOS SoC Design', credits: 3, type: 'Theory' },
          { code: 'VDE-703', name: 'Nanoscale Devices and Characterization', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_vlsi_group2',
        label: 'Professional Elective Slot 2',
        options: [
          { code: 'VDE-704', name: 'PCB and System Design', credits: 3, type: 'Theory' },
          { code: 'VDE-705', name: 'System Verilog for Design and Verification', credits: 3, type: 'Theory' },
          { code: 'VDE-706', name: 'ASIC and FPGA Design', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_vlsi_group3',
        label: 'Professional Elective Slot 3',
        options: [
          { code: 'VDE-707', name: 'Semiconductor Equipment Design and Technology', credits: 3, type: 'Theory' },
          { code: 'VDE-708', name: 'Introduction to Internet of Things', credits: 3, type: 'Theory' },
          { code: 'VDE-709', name: 'CAD for VLSI', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_vlsi_group4',
        label: 'Professional Elective Slot 4',
        options: [
          { code: 'VDE-710', name: 'Semiconductor Packaging and Testing', credits: 3, type: 'Theory' },
          { code: 'VDE-711', name: 'System on Chip (SoC) Design', credits: 3, type: 'Theory' },
          { code: 'VDE-712', name: 'C-Based VLSI Design', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_vlsi_open_group',
        label: 'Open Elective',
        options: [
          { code: 'VDO-701', name: 'Fundamentals of Nanotechnology', credits: 3, type: 'Theory' },
          { code: 'VDO-702', name: 'Low Power VLSI Design', credits: 3, type: 'Theory' },
          { code: 'VDO-703', name: 'VLSI Digital Signal Processing', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'VDP-801', name: 'Major Project', credits: 6, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_vlsi_open_group1',
        label: 'Open Elective Slot 1',
        options: [
          { code: 'VDO-801', name: 'Machine Learning and Deep Learning – Fundamentals and Applications', credits: 3, type: 'Theory' },
          { code: 'VDO-802', name: 'Neuromorphic AI Chip Design', credits: 3, type: 'Theory' },
          { code: 'VDO-803', name: 'Microsensors and Nanosensors', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_vlsi_open_group2',
        label: 'Open Elective Slot 2',
        options: [
          { code: 'VDO-804', name: 'Quantum Computing', credits: 3, type: 'Theory' },
          { code: 'VDO-805', name: 'VLSI Interconnects', credits: 3, type: 'Theory' },
          { code: 'VDO-806', name: 'Organic Electronics', credits: 3, type: 'Theory' }
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
  const isVlsi = department === 'Electronics (VLSI Design & Technology) (Self-Financed)';
  const semData = isCivil 
    ? JMI_CIVIL_CURRICULUM[semesterTitle] 
    : isVlsi 
      ? JMI_VLSI_CURRICULUM[semesterTitle] 
      : JMI_CURRICULUM[semesterTitle];
  if (!semData) {
    return { subjects: [], electiveSelections: {} };
  }

  const subjectsList: any[] = [];
  const electiveSelections: Record<string, string> = {};

  // Add non-electives
  semData.subjects.forEach((s) => {
    const id = isCivil 
      ? `sub_jmi_civil_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
      : isVlsi
        ? `sub_jmi_vlsi_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
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
          : isVlsi
            ? `sub_jmi_vlsi_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
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
