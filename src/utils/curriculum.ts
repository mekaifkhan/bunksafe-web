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

export const JMI_CSE_DS_CURRICULUM: Record<string, SemesterCurriculum> = {
  'Semester 3': {
    subjects: [
      { code: 'ASM-301', name: 'Universal Human Values', credits: 3, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics III', credits: 3, type: 'Theory' },
      { code: 'DSC-301', name: 'Discrete Mathematics – PCC1', credits: 3, type: 'Theory' },
      { code: 'DSC-302', name: 'Data Structure – PCC2', credits: 3, type: 'Theory' },
      { code: 'DSC-303', name: 'Digital Logic Design – PCC3', credits: 3, type: 'Theory' },
      { code: 'DSC-304', name: 'Database Management System – PCC4', credits: 3, type: 'Theory' },
      { code: 'DSL-301', name: 'Data Structure Lab – PCL1', credits: 1, type: 'Lab' },
      { code: 'DSL-302', name: 'Digital Logic Design Lab – PCL2', credits: 1, type: 'Lab' },
      { code: 'DSL-303', name: 'C Programming Lab – PCL3', credits: 1, type: 'Lab' },
      { code: 'DSL-304', name: 'Database Management System Lab – PCL4', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'ASM-401', name: 'Environmental Science', credits: 2, type: 'Theory' },
      { code: 'DSC-401', name: 'Data Mining – PCC5', credits: 3, type: 'Theory' },
      { code: 'DSC-402', name: 'Computer Organization & Architecture – PCC6', credits: 3, type: 'Theory' },
      { code: 'DSC-403', name: 'Operating System – PCC7', credits: 3, type: 'Theory' },
      { code: 'ASM-402', name: 'Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'AST-401', name: 'Operations Research (OEC-I)', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'Economics (OEC-II)', credits: 3, type: 'Theory' },
      { code: 'DSL-401', name: 'Data Mining Lab – PCL5', credits: 1, type: 'Lab' },
      { code: 'DSL-402', name: 'Python Programming Lab – PCL6', credits: 1, type: 'Lab' },
      { code: 'DSL-403', name: 'Operating System & Linux Lab – PCL7', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric and Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'DSC-501', name: 'Automata Theory – PCC8', credits: 3, type: 'Theory' },
      { code: 'DSC-502', name: 'Data Analytics – PCC9', credits: 3, type: 'Theory' },
      { code: 'DSC-503', name: 'Computer Networks – PCC10', credits: 3, type: 'Theory' },
      { code: 'DSC-504', name: 'Software Engineering – PCC11', credits: 3, type: 'Theory' },
      { code: 'DSC-505', name: 'Object Oriented Programming – PCC12', credits: 3, type: 'Theory' },
      { code: 'DSL-501', name: 'Object Oriented Programming Lab – PCL8', credits: 1, type: 'Lab' },
      { code: 'DSL-502', name: 'Machine Learning Lab – PCL9', credits: 1, type: 'Lab' },
      { code: 'DSL-503', name: 'Computer Network Lab – PCL10', credits: 1, type: 'Lab' },
      { code: 'DSL-504', name: 'Data Analytics Lab – PCL11', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_csds_group1',
        label: 'Professional Elective-I',
        options: [
          { code: 'DSE-501', name: 'Introduction to Machine Learning – PEC1', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'DSC-601', name: 'Analysis and Design of Algorithms – PCC13', credits: 3, type: 'Theory' },
      { code: 'DSC-602', name: 'Compiler Design – PCC14', credits: 3, type: 'Theory' },
      { code: 'DSC-603', name: 'Data Visualization – PCC15', credits: 3, type: 'Theory' },
      { code: 'DSC-604', name: 'Artificial Intelligence – PCC16', credits: 3, type: 'Theory' },
      { code: 'DSL-601', name: 'Compiler Design Lab – PCL12', credits: 1, type: 'Lab' },
      { code: 'DSL-602', name: 'Artificial Intelligence Lab – PCL13', credits: 1, type: 'Lab' },
      { code: 'DSL-603', name: 'Deep Learning Lab – PCL14', credits: 1, type: 'Lab' },
      { code: 'DSL-604', name: 'Data Visualization Lab – PCL15', credits: 1, type: 'Lab' },
      { code: 'DSL-605', name: 'Seminar (Literature Review)', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem6_csds_group1',
        label: 'Professional Elective-II',
        options: [
          { code: 'DSE-605', name: 'Deep Learning – PEC2', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'DSP-792', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'DSP-793', name: 'Minor Project', credits: 3, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_csds_group1',
        label: 'Professional Elective-III',
        options: [
          { code: 'DSE-701', name: 'Computer Vision and Image Processing', credits: 3, type: 'Theory' },
          { code: 'DSE-702', name: 'Mobile Computing', credits: 3, type: 'Theory' },
          { code: 'DSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'DSE-704', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'DSE-705', name: 'NLP and Information Extraction', credits: 3, type: 'Theory' },
          { code: 'DSE-706', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' },
          { code: 'DSE-707', name: 'Advanced Deep Learning', credits: 3, type: 'Theory' },
          { code: 'DSE-708', name: 'Embedded System', credits: 3, type: 'Theory' },
          { code: 'DSE-709', name: 'Parallel & Distributed Computing', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_csds_group2',
        label: 'Professional Elective-IV',
        options: [
          { code: 'DSE-701', name: 'Computer Vision and Image Processing', credits: 3, type: 'Theory' },
          { code: 'DSE-702', name: 'Mobile Computing', credits: 3, type: 'Theory' },
          { code: 'DSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'DSE-704', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'DSE-705', name: 'NLP and Information Extraction', credits: 3, type: 'Theory' },
          { code: 'DSE-706', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' },
          { code: 'DSE-707', name: 'Advanced Deep Learning', credits: 3, type: 'Theory' },
          { code: 'DSE-708', name: 'Embedded System', credits: 3, type: 'Theory' },
          { code: 'DSE-709', name: 'Parallel & Distributed Computing', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_csds_group3',
        label: 'Professional Elective-V',
        options: [
          { code: 'DSE-701', name: 'Computer Vision and Image Processing', credits: 3, type: 'Theory' },
          { code: 'DSE-702', name: 'Mobile Computing', credits: 3, type: 'Theory' },
          { code: 'DSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'DSE-704', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'DSE-705', name: 'NLP and Information Extraction', credits: 3, type: 'Theory' },
          { code: 'DSE-706', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' },
          { code: 'DSE-707', name: 'Advanced Deep Learning', credits: 3, type: 'Theory' },
          { code: 'DSE-708', name: 'Embedded System', credits: 3, type: 'Theory' },
          { code: 'DSE-709', name: 'Parallel & Distributed Computing', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_csds_group4',
        label: 'Professional Elective-VI',
        options: [
          { code: 'DSE-701', name: 'Computer Vision and Image Processing', credits: 3, type: 'Theory' },
          { code: 'DSE-702', name: 'Mobile Computing', credits: 3, type: 'Theory' },
          { code: 'DSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'DSE-704', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'DSE-705', name: 'NLP and Information Extraction', credits: 3, type: 'Theory' },
          { code: 'DSE-706', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' },
          { code: 'DSE-707', name: 'Advanced Deep Learning', credits: 3, type: 'Theory' },
          { code: 'DSE-708', name: 'Embedded System', credits: 3, type: 'Theory' },
          { code: 'DSE-709', name: 'Parallel & Distributed Computing', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_csds_open_group',
        label: 'Open Elective-III',
        options: [
          { code: 'DSO-701', name: 'Any approved Open Elective', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'DSP-891', name: 'Major Project', credits: 6, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_csds_open_group1',
        label: 'Open Elective-IV',
        options: [
          { code: 'DSO-801', name: 'Network Security', credits: 3, type: 'Theory' },
          { code: 'DSO-802', name: 'Blockchain Technology & its Application', credits: 3, type: 'Theory' },
          { code: 'DSO-803', name: 'Software Testing', credits: 3, type: 'Theory' },
          { code: 'DSO-804', name: 'Mobile Computing & IoT', credits: 3, type: 'Theory' },
          { code: 'DSO-805', name: 'Advanced Graph Theory', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_csds_open_group2',
        label: 'Open Elective-V',
        options: [
          { code: 'DSO-801', name: 'Network Security', credits: 3, type: 'Theory' },
          { code: 'DSO-802', name: 'Blockchain Technology & its Application', credits: 3, type: 'Theory' },
          { code: 'DSO-803', name: 'Software Testing', credits: 3, type: 'Theory' },
          { code: 'DSO-804', name: 'Mobile Computing & IoT', credits: 3, type: 'Theory' },
          { code: 'DSO-805', name: 'Advanced Graph Theory', credits: 3, type: 'Theory' }
        ]
      }
    ]
  }
};

export const JMI_COMP_ENG_CURRICULUM: Record<string, SemesterCurriculum> = {
  'Semester 3': {
    subjects: [
      { code: 'ASM-301', name: 'Universal Human Values', credits: 3, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics III', credits: 3, type: 'Theory' },
      { code: 'DSC-301', name: 'Discrete Mathematics – PCC1', credits: 3, type: 'Theory' },
      { code: 'DSC-302', name: 'Data Structure – PCC2', credits: 3, type: 'Theory' },
      { code: 'DSC-303', name: 'Digital Logic Design – PCC3', credits: 3, type: 'Theory' },
      { code: 'DSC-304', name: 'Database Management System – PCC4', credits: 3, type: 'Theory' },
      { code: 'DSL-301', name: 'Data Structure Lab – PCL1', credits: 1, type: 'Lab' },
      { code: 'DSL-302', name: 'Digital Logic Design Lab – PCL2', credits: 1, type: 'Lab' },
      { code: 'DSL-303', name: 'C Programming Lab – PCL3', credits: 1, type: 'Lab' },
      { code: 'DSL-304', name: 'Database Management System Lab – PCL4', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'ASM-401', name: 'Environmental Science', credits: 2, type: 'Theory' },
      { code: 'DSC-401', name: 'Data Mining – PCC5', credits: 3, type: 'Theory' },
      { code: 'DSC-402', name: 'Computer Organization & Architecture – PCC6', credits: 3, type: 'Theory' },
      { code: 'DSC-403', name: 'Operating System – PCC7', credits: 3, type: 'Theory' },
      { code: 'ASM-402', name: 'Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'AST-401', name: 'Operations Research (OEC-I)', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'Economics (OEC-II)', credits: 3, type: 'Theory' },
      { code: 'DSL-401', name: 'Data Mining Lab – PCL5', credits: 1, type: 'Lab' },
      { code: 'DSL-402', name: 'Python Programming Lab – PCL6', credits: 1, type: 'Lab' },
      { code: 'DSL-403', name: 'Operating System & Linux Lab – PCL7', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric & Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'DSC-501', name: 'Automata Theory – PCC8', credits: 3, type: 'Theory' },
      { code: 'DSC-502', name: 'Data Analytics – PCC9', credits: 3, type: 'Theory' },
      { code: 'DSC-503', name: 'Computer Networks – PCC10', credits: 3, type: 'Theory' },
      { code: 'DSC-504', name: 'Software Engineering – PCC11', credits: 3, type: 'Theory' },
      { code: 'DSC-505', name: 'Object Oriented Programming – PCC12', credits: 3, type: 'Theory' },
      { code: 'DSL-501', name: 'Object Oriented Programming Lab – PCL8', credits: 1, type: 'Lab' },
      { code: 'DSL-502', name: 'Machine Learning Lab – PCL9', credits: 1, type: 'Lab' },
      { code: 'DSL-503', name: 'Computer Network Lab – PCL10', credits: 1, type: 'Lab' },
      { code: 'DSL-504', name: 'Data Analytics Lab – PCL11', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_comp_group1',
        label: 'Professional Elective-I',
        options: [
          { code: 'CSE-701', name: 'Computer Vision & Image Processing', credits: 3, type: 'Theory' },
          { code: 'CSE-702', name: 'Mobile Computing & IoT', credits: 3, type: 'Theory' },
          { code: 'CSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-704', name: 'Internet Protocol', credits: 3, type: 'Theory' },
          { code: 'CSE-705', name: 'Soft Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-706', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'CSE-707', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'DSC-601', name: 'Analysis & Design of Algorithms – PCC13', credits: 3, type: 'Theory' },
      { code: 'DSC-602', name: 'Compiler Design – PCC14', credits: 3, type: 'Theory' },
      { code: 'DSC-603', name: 'Data Visualization – PCC15', credits: 3, type: 'Theory' },
      { code: 'DSC-604', name: 'Artificial Intelligence – PCC16', credits: 3, type: 'Theory' },
      { code: 'DSL-601', name: 'Compiler Design Lab – PCL12', credits: 1, type: 'Lab' },
      { code: 'DSL-602', name: 'Artificial Intelligence Lab – PCL13', credits: 1, type: 'Lab' },
      { code: 'DSL-603', name: 'Deep Learning Lab – PCL14', credits: 1, type: 'Lab' },
      { code: 'DSL-604', name: 'Data Visualization Lab – PCL15', credits: 1, type: 'Lab' },
      { code: 'DSL-605', name: 'Seminar', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem6_comp_group1',
        label: 'Professional Elective-II',
        options: [
          { code: 'DSE-605', name: 'Deep Learning', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'CSP-792', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'CSP-793', name: 'Minor Project', credits: 3, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_comp_group1',
        label: 'Professional Elective-III',
        options: [
          { code: 'CSE-701', name: 'Computer Vision & Image Processing', credits: 3, type: 'Theory' },
          { code: 'CSE-702', name: 'Mobile Computing & IoT', credits: 3, type: 'Theory' },
          { code: 'CSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-704', name: 'Internet Protocol', credits: 3, type: 'Theory' },
          { code: 'CSE-705', name: 'Soft Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-706', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'CSE-707', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_comp_group2',
        label: 'Professional Elective-IV',
        options: [
          { code: 'CSE-701', name: 'Computer Vision & Image Processing', credits: 3, type: 'Theory' },
          { code: 'CSE-702', name: 'Mobile Computing & IoT', credits: 3, type: 'Theory' },
          { code: 'CSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-704', name: 'Internet Protocol', credits: 3, type: 'Theory' },
          { code: 'CSE-705', name: 'Soft Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-706', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'CSE-707', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_comp_group3',
        label: 'Professional Elective-V',
        options: [
          { code: 'CSE-701', name: 'Computer Vision & Image Processing', credits: 3, type: 'Theory' },
          { code: 'CSE-702', name: 'Mobile Computing & IoT', credits: 3, type: 'Theory' },
          { code: 'CSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-704', name: 'Internet Protocol', credits: 3, type: 'Theory' },
          { code: 'CSE-705', name: 'Soft Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-706', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'CSE-707', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_comp_group4',
        label: 'Professional Elective-VI',
        options: [
          { code: 'CSE-701', name: 'Computer Vision & Image Processing', credits: 3, type: 'Theory' },
          { code: 'CSE-702', name: 'Mobile Computing & IoT', credits: 3, type: 'Theory' },
          { code: 'CSE-703', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-704', name: 'Internet Protocol', credits: 3, type: 'Theory' },
          { code: 'CSE-705', name: 'Soft Computing', credits: 3, type: 'Theory' },
          { code: 'CSE-706', name: 'Social Network Analysis', credits: 3, type: 'Theory' },
          { code: 'CSE-707', name: 'Artificial Neural Networks', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_comp_open_group',
        label: 'Open Elective-III',
        options: [
          { code: 'CSO-701', name: 'Any approved Open Elective', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'CSP-891', name: 'Major Project', credits: 6, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_comp_open_group1',
        label: 'Open Elective-IV',
        options: [
          { code: 'CSO-801', name: 'Network Security', credits: 3, type: 'Theory' },
          { code: 'CSO-802', name: 'Applications of Blockchain Technology', credits: 3, type: 'Theory' },
          { code: 'CSO-803', name: 'Software Testing', credits: 3, type: 'Theory' },
          { code: 'CSO-804', name: 'Big Data Analytics', credits: 3, type: 'Theory' },
          { code: 'CSO-805', name: 'Applied Linear Algebra in AI & ML', credits: 3, type: 'Theory' },
          { code: 'CSO-806', name: 'Generative AI', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_comp_open_group2',
        label: 'Open Elective-V',
        options: [
          { code: 'CSO-801', name: 'Network Security', credits: 3, type: 'Theory' },
          { code: 'CSO-802', name: 'Applications of Blockchain Technology', credits: 3, type: 'Theory' },
          { code: 'CSO-803', name: 'Software Testing', credits: 3, type: 'Theory' },
          { code: 'CSO-804', name: 'Big Data Analytics', credits: 3, type: 'Theory' },
          { code: 'CSO-805', name: 'Applied Linear Algebra in AI & ML', credits: 3, type: 'Theory' },
          { code: 'CSO-806', name: 'Generative AI', credits: 3, type: 'Theory' }
        ]
      }
    ]
  }
};

export const JMI_FIRST_YEAR_SET_A: Record<string, SemesterCurriculum> = {
  'Semester 1': {
    subjects: [
      { code: 'AST-101', name: 'Communication Skills', credits: 2, type: 'Theory' },
      { code: 'ASB-101', name: 'Engineering Physics I', credits: 3, type: 'Theory' },
      { code: 'ASB-102', name: 'Engineering Chemistry', credits: 3, type: 'Theory' },
      { code: 'ASB-103', name: 'Engineering Mathematics I', credits: 3, type: 'Theory' },
      { code: 'EES-101', name: 'Basics of Electrical Engineering', credits: 3, type: 'Theory' },
      { code: 'CSS-101', name: 'Fundamentals of Computing', credits: 3, type: 'Theory' },
      { code: 'ASL-101', name: 'Language Laboratory', credits: 1, type: 'Lab' },
      { code: 'ASL-102', name: 'Engineering Physics Laboratory I', credits: 1, type: 'Lab' },
      { code: 'ASL-103', name: 'Engineering Chemistry Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-104', name: 'Engineering Graphics & Design', credits: 2, type: 'Lab' },
      { code: 'ECL-101', name: 'Design Thinking & Idea Lab', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 2': {
    subjects: [
      { code: 'ASB-201', name: 'Engineering Physics II', credits: 3, type: 'Theory' },
      { code: 'ASB-202', name: 'Engineering Mathematics II', credits: 3, type: 'Theory' },
      { code: 'ASB-203', name: 'Biology for Engineers', credits: 3, type: 'Theory' },
      { code: 'ECS-201', name: 'Basics of Electronics & Communication Engineering', credits: 3, type: 'Theory' },
      { code: 'MES-201', name: 'Basics of Mechanical Engineering', credits: 3, type: 'Theory' },
      { code: 'CES-201', name: 'Basics of Civil Engineering', credits: 3, type: 'Theory' },
      { code: 'ASM-201', name: 'Constitution of India', credits: 0, type: 'Theory' },
      { code: 'ASL-201', name: 'Engineering Physics Laboratory II', credits: 1, type: 'Lab' },
      { code: 'MEL-201', name: 'Workshop Practice', credits: 2, type: 'Lab' },
      { code: 'MEL-202', name: 'Engineering Mechanics Laboratory', credits: 1, type: 'Lab' }
    ]
  }
};

export const JMI_FIRST_YEAR_SET_B: Record<string, SemesterCurriculum> = {
  'Semester 1': {
    subjects: [
      { code: 'ASB-201', name: 'Engineering Physics II', credits: 3, type: 'Theory' },
      { code: 'ASB-202', name: 'Engineering Mathematics II', credits: 3, type: 'Theory' },
      { code: 'ASB-203', name: 'Biology for Engineers', credits: 3, type: 'Theory' },
      { code: 'ECS-201', name: 'Basics of Electronics & Communication Engineering', credits: 3, type: 'Theory' },
      { code: 'MES-201', name: 'Basics of Mechanical Engineering', credits: 3, type: 'Theory' },
      { code: 'CES-201', name: 'Basics of Civil Engineering', credits: 3, type: 'Theory' },
      { code: 'ASM-201', name: 'Constitution of India', credits: 0, type: 'Theory' },
      { code: 'ASL-201', name: 'Engineering Physics Laboratory II', credits: 1, type: 'Lab' },
      { code: 'MEL-201', name: 'Workshop Practice', credits: 2, type: 'Lab' },
      { code: 'MEL-202', name: 'Engineering Mechanics Laboratory', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 2': {
    subjects: [
      { code: 'AST-101', name: 'Communication Skills', credits: 2, type: 'Theory' },
      { code: 'ASB-101', name: 'Engineering Physics I', credits: 3, type: 'Theory' },
      { code: 'ASB-102', name: 'Engineering Chemistry', credits: 3, type: 'Theory' },
      { code: 'ASB-103', name: 'Engineering Mathematics I', credits: 3, type: 'Theory' },
      { code: 'EES-101', name: 'Basics of Electrical Engineering', credits: 3, type: 'Theory' },
      { code: 'CSS-101', name: 'Fundamentals of Computing', credits: 3, type: 'Theory' },
      { code: 'ASL-101', name: 'Language Laboratory', credits: 1, type: 'Lab' },
      { code: 'ASL-102', name: 'Engineering Physics Laboratory I', credits: 1, type: 'Lab' },
      { code: 'ASL-103', name: 'Engineering Chemistry Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-104', name: 'Engineering Graphics & Design', credits: 2, type: 'Lab' },
      { code: 'ECL-101', name: 'Design Thinking & Idea Lab', credits: 1, type: 'Lab' }
    ]
  }
};

export const JMI_ELECTRICAL_COMPUTER_CURRICULUM: Record<string, SemesterCurriculum> = {
  'Semester 3': {
    subjects: [
      { code: 'ASM-301', name: 'Mandatory Course: Universal Human Values', credits: 3, type: 'Theory' },
      { code: 'ASM-302', name: 'Mandatory Course: Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics-III (Probability & Statistics)', credits: 3, type: 'Theory' },
      { code: 'EEC-302', name: 'Network Analysis', credits: 3, type: 'Theory' },
      { code: 'EEC-303', name: 'Signals and System', credits: 3, type: 'Theory' },
      { code: 'EEC-305', name: 'Data Structures and Algorithms', credits: 3, type: 'Theory' },
      { code: 'EEC-306', name: 'Electric Machines & Power System', credits: 3, type: 'Theory' },
      { code: 'EEL-302', name: 'Network Analysis Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-303', name: 'Signals and System Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-305', name: 'Data Structures and Algorithms Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-306', name: 'Electric Machines & Power System Lab', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'ASM-401', name: 'Mandatory Course: Environmental Science', credits: 2, type: 'Theory' },
      { code: 'AST-401', name: 'OE-I Operations Research', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'OE-II Engineering Economics', credits: 3, type: 'Theory' },
      { code: 'EEC-403', name: 'Power Electronics', credits: 3, type: 'Theory' },
      { code: 'EEC-404', name: 'Analog and Digital Electronics', credits: 3, type: 'Theory' },
      { code: 'EEC-405', name: 'Object Oriented Programming', credits: 3, type: 'Theory' },
      { code: 'EEL-403', name: 'Power Electronics Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-404', name: 'Analog and Digital Electronics Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-405', name: 'Object Oriented Programming Lab', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric & Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'EEC-501', name: 'Control Systems', credits: 3, type: 'Theory' },
      { code: 'EEC-506', name: 'Measurement and Instrumentation', credits: 3, type: 'Theory' },
      { code: 'EEC-507', name: 'Data Communications & Computer Networks', credits: 3, type: 'Theory' },
      { code: 'EEC-508', name: 'Computer Architecture', credits: 3, type: 'Theory' },
      { code: 'EEC-509', name: 'Artificial Intelligence & Machine Learning', credits: 3, type: 'Theory' },
      { code: 'EEL-501', name: 'Control Systems Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-506', name: 'Measurement & Instrumentation Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-507', name: 'Data Communications & Computer Network Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-509', name: 'Artificial Intelligence & Machine Learning Lab', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_eec_group1',
        label: 'Professional Elective-I',
        options: [
          { code: 'EEC-502', name: 'Switchgear & Protection', credits: 3, type: 'Theory' },
          { code: 'EEE-510', name: 'Digital Signal Processing', credits: 3, type: 'Theory' },
          { code: 'EEE-511', name: 'Introduction to Robotics', credits: 3, type: 'Theory' },
          { code: 'EEE-512', name: 'Database Management Systems', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'EEC-603', name: 'Power Systems Analysis', credits: 3, type: 'Theory' },
      { code: 'EEC-604', name: 'SCADA & Smart Grid Technologies', credits: 3, type: 'Theory' },
      { code: 'EEC-605', name: 'Microprocessors & Microcontrollers', credits: 3, type: 'Theory' },
      { code: 'EEC-606', name: 'Operating Systems', credits: 3, type: 'Theory' },
      { code: 'EEL-603', name: 'Power Systems Analysis (MATLAB-based) Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-604', name: 'SCADA & Smart Grid Technologies Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-605', name: 'Microprocessors & Microcontrollers Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-606', name: 'Operating Systems Lab', credits: 1, type: 'Lab' },
      { code: 'EEP-601', name: 'Seminar (Literature Review)', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem6_eec_group1',
        label: 'Professional Elective-II',
        options: [
          { code: 'EEE-602', name: 'HVDC Transmission', credits: 3, type: 'Theory' },
          { code: 'EEE-603', name: 'Electrical Power Generation', credits: 3, type: 'Theory' },
          { code: 'EEE-604', name: 'Intro to Cyber Security', credits: 3, type: 'Theory' },
          { code: 'EEE-605', name: 'Theory of Computation', credits: 3, type: 'Theory' },
          { code: 'EEE-606', name: 'Data Mining', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'EEP-701', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'EEP-702', name: 'Minor Project', credits: 3, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_eec_group1',
        label: 'Professional Elective-III',
        options: [
          { code: 'EEE-702', name: 'Embedded Systems', credits: 3, type: 'Theory' },
          { code: 'EEE-703', name: 'Power System Operation & Control', credits: 3, type: 'Theory' },
          { code: 'EEE-711', name: 'Compiler Design', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_eec_group2',
        label: 'Professional Elective-IV',
        options: [
          { code: 'EEE-702', name: 'Robotics & Automation', credits: 3, type: 'Theory' },
          { code: 'EEE-705', name: 'Advanced Protective Relays', credits: 3, type: 'Theory' },
          { code: 'EEE-712', name: 'Big Data Analytics', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_eec_group3',
        label: 'Professional Elective-V',
        options: [
          { code: 'EEE-709', name: 'VLSI Design', credits: 3, type: 'Theory' },
          { code: 'EEE-713', name: 'Cloud Computing', credits: 3, type: 'Theory' },
          { code: 'EEE-714', name: 'Electric Drives', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_eec_group4',
        label: 'Professional Elective-VI',
        options: [
          { code: 'EEE-710', name: 'Advanced Power Electronics', credits: 3, type: 'Theory' },
          { code: 'EEE-715', name: 'Deep Learning', credits: 3, type: 'Theory' },
          { code: 'EEE-716', name: 'GPU Computing', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_eec_open_group',
        label: 'Open Elective-III',
        options: [
          { code: 'EEO-703', name: 'Software Engineering', credits: 3, type: 'Theory' },
          { code: 'EEO-704', name: 'Power System Automation', credits: 3, type: 'Theory' },
          { code: 'EEO-705', name: 'Cyber Physical Systems', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'EEP-801', name: 'Major Project', credits: 6, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_eec_open_group1',
        label: 'Open Elective-IV',
        options: [
          { code: 'EEO-803', name: 'Grid Protection & Control', credits: 3, type: 'Theory' },
          { code: 'EEO-806', name: 'Computing & Sustainability', credits: 3, type: 'Theory' },
          { code: 'EEO-807', name: 'Advanced Cybersecurity', credits: 3, type: 'Theory' },
          { code: 'EEO-808', name: 'NLP', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_eec_open_group2',
        label: 'Open Elective-V',
        options: [
          { code: 'EEO-805', name: 'Electricity Markets', credits: 3, type: 'Theory' },
          { code: 'EEO-809', name: 'Evolutionary Optimization Techniques', credits: 3, type: 'Theory' },
          { code: 'EEO-810', name: 'Blockchain Technology', credits: 3, type: 'Theory' },
          { code: 'EEO-811', name: 'Image Processing & Computer Vision', credits: 3, type: 'Theory' }
        ]
      }
    ]
  }
};

export const JMI_MECHANICAL_CURRICULUM: Record<string, SemesterCurriculum> = {
  'Semester 3': {
    subjects: [
      { code: 'ASM-301', name: 'Universal Human Values', credits: 3, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics III', credits: 3, type: 'Theory' },
      { code: 'MEC-301', name: 'Mechanics of Solids', credits: 3, type: 'Theory' },
      { code: 'MEC-302', name: 'Fluid Mechanics', credits: 3, type: 'Theory' },
      { code: 'MEC-303', name: 'Manufacturing Processes', credits: 3, type: 'Theory' },
      { code: 'MEC-304', name: 'Material Science', credits: 3, type: 'Theory' },
      { code: 'ASM-302', name: 'Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'MEL-301', name: 'Mechanics of Solids Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-302', name: 'Fluid Mechanics Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-303', name: 'Manufacturing Processes Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-304', name: 'Material Science Laboratory', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'MEC-401', name: 'CAD and FEM', credits: 3, type: 'Theory' },
      { code: 'MEC-402', name: 'Production Engineering-I', credits: 3, type: 'Theory' },
      { code: 'MEC-403', name: 'Heat and Mass Transfer', credits: 3, type: 'Theory' },
      { code: 'AST-401', name: 'Operations Research (OEC-I)', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'Economics (OEC-II)', credits: 3, type: 'Theory' },
      { code: 'MEL-401', name: 'CAD, FEM and Computer Aided Machine Drawing Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-402', name: 'Production Engineering Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-403', name: 'Heat and Mass Transfer Laboratory', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric and Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'MEC-501', name: 'Advanced Fluid Mechanics and Control Engineering', credits: 3, type: 'Theory' },
      { code: 'MEC-502', name: 'Applied Thermodynamics', credits: 3, type: 'Theory' },
      { code: 'MEC-503', name: 'Theory of Mechanisms and Machines', credits: 3, type: 'Theory' },
      { code: 'MEC-504', name: 'Design of Mechanical Components', credits: 3, type: 'Theory' },
      { code: 'MEC-505', name: 'Production Engineering-II', credits: 3, type: 'Theory' },
      { code: 'MEL-501', name: 'Instrumentation, Measurement and Control Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-502', name: 'Theory of Mechanisms and Machines Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-503', name: 'Design of Mechanical Components Practice Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-504', name: 'Mechatronics Laboratory', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_mech_group1',
        label: 'Professional Elective-I',
        options: [
          { code: 'MEE-501', name: 'Mechatronics', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'MEC-601', name: 'Fluid Machines', credits: 3, type: 'Theory' },
      { code: 'MEC-602', name: 'Refrigeration and Air Conditioning', credits: 3, type: 'Theory' },
      { code: 'MEC-603', name: 'Design of Mechanical System', credits: 3, type: 'Theory' },
      { code: 'MEC-604', name: 'Computer Aided Manufacturing', credits: 3, type: 'Theory' },
      { code: 'MEL-601', name: 'Fluid Machines Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-602', name: 'Refrigeration and Air Conditioning Lab', credits: 1, type: 'Lab' },
      { code: 'MEL-603', name: 'Design of Mechanical Systems Practice Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-604', name: 'Computer Aided Manufacturing Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEP-601', name: 'Seminar (Literature Review)', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem6_mech_group1',
        label: 'Professional Elective-II',
        options: [
          { code: 'MEE-601', name: 'Electro-Mechanical Energy Conversion', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'MEL-701', name: 'Industrial Engineering Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-702', name: 'Heat Engines & Solar Energy Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEL-703', name: 'Machinery Dynamics & Vibration Laboratory', credits: 1, type: 'Lab' },
      { code: 'MEP-701', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'MEP-702', name: 'Project', credits: 3, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_mech_group1',
        label: 'Professional Elective-I',
        options: [
          { code: 'MEE-701', name: 'Industrial Engineering', credits: 3, type: 'Theory' },
          { code: 'MEE-702', name: 'I.C. Engines', credits: 3, type: 'Theory' },
          { code: 'MEE-703', name: 'Machinery Dynamics and Vibration', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_mech_open_group',
        label: 'Open Elective-III',
        options: [
          { code: 'MEO-701', name: 'Thermal & Fluid', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'MEP-801', name: 'Major Project', credits: 6, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_mech_open_group1',
        label: 'Open Elective-IV',
        options: [
          { code: 'MEO-801', name: 'Machine Design', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_mech_open_group2',
        label: 'Open Elective-V',
        options: [
          { code: 'MEO-802', name: 'Production & Industrial', credits: 3, type: 'Theory' }
        ]
      }
    ]
  }
};

export const JMI_ELECTRICAL_CURRICULUM: Record<string, SemesterCurriculum> = {
  'Semester 3': {
    subjects: [
      { code: 'EEC-301', name: 'Electronics Devices and Circuits', credits: 3, type: 'Theory' },
      { code: 'EEC-302', name: 'Network Analysis', credits: 3, type: 'Theory' },
      { code: 'EEC-303', name: 'Signals and Systems', credits: 3, type: 'Theory' },
      { code: 'EEC-304', name: 'Transformer and Induction Machine', credits: 3, type: 'Theory' },
      { code: 'ASB-301', name: 'Engineering Mathematics III', credits: 3, type: 'Theory' },
      { code: 'ASM-301', name: 'Universal Human Values', credits: 3, type: 'Theory' },
      { code: 'ASM-302', name: 'Essence of Indian Traditional Knowledge', credits: 0, type: 'Theory' },
      { code: 'EEL-301', name: 'Electronics Devices and Circuits Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-302', name: 'Network Analysis Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-303', name: 'Signals and Systems Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-304', name: 'Transformer and Induction Machine Lab', credits: 1, type: 'Lab' }
    ]
  },
  'Semester 4': {
    subjects: [
      { code: 'EEC-401', name: 'DC and Synchronous Machines', credits: 3, type: 'Theory' },
      { code: 'EEC-402', name: 'Digital Electronics', credits: 3, type: 'Theory' },
      { code: 'EEC-403', name: 'Power Electronics', credits: 3, type: 'Theory' },
      { code: 'ASM-401', name: 'Environmental Science', credits: 2, type: 'Theory' },
      { code: 'AST-401', name: 'Operations Research (OEC-I)', credits: 3, type: 'Theory' },
      { code: 'AST-402', name: 'Engineering Economics (OEC-II)', credits: 3, type: 'Theory' },
      { code: 'EEL-401', name: 'DC and Synchronous Machines Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-402', name: 'Digital Electronics Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-403', name: 'Power Electronics Lab', credits: 1, type: 'Lab' },
      { code: 'ASL-401', name: 'Numeric and Scientific Computing Lab', credits: 2, type: 'Lab' }
    ]
  },
  'Semester 5': {
    subjects: [
      { code: 'EEC-501', name: 'Control Systems', credits: 3, type: 'Theory' },
      { code: 'EEC-502', name: 'Switchgear and Protection', credits: 3, type: 'Theory' },
      { code: 'EEC-503', name: 'Electrical Measurement', credits: 3, type: 'Theory' },
      { code: 'EEC-504', name: 'Programming Languages', credits: 3, type: 'Theory' },
      { code: 'EEC-505', name: 'Fundamentals of Power Systems', credits: 3, type: 'Theory' },
      { code: 'EEL-501', name: 'Control Systems Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-502', name: 'Switchgear and Protection Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-504', name: 'Programming Languages Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-505', name: 'Power Systems Communication Lab', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem5_elec_group1',
        label: 'Professional Elective-I',
        options: [
          { code: 'EEE-501', name: 'Communication Systems', credits: 3, type: 'Theory' },
          { code: 'EEE-502', name: 'Programmable Logic Controller', credits: 3, type: 'Theory' },
          { code: 'EEE-503', name: 'Electromagnetic Field Theory', credits: 3, type: 'Theory' },
          { code: 'EEE-504', name: 'Utilization of Electrical Energy', credits: 3, type: 'Theory' },
          { code: 'EEE-505', name: 'Data Structures and Algorithms', credits: 3, type: 'Theory' },
          { code: 'EEE-508', name: 'Computer Architecture', credits: 3, type: 'Theory' },
          { code: 'EEE-510', name: 'Digital Signal Processing', credits: 3, type: 'Theory' },
          { code: 'EEE-511', name: 'Introduction to Robotics', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 6': {
    subjects: [
      { code: 'EEC-601', name: 'Advanced Control System', credits: 3, type: 'Theory' },
      { code: 'EEC-602', name: 'Electrical and Electronics Instrumentation', credits: 3, type: 'Theory' },
      { code: 'EEC-603', name: 'Power Systems Analysis', credits: 3, type: 'Theory' },
      { code: 'EEC-604', name: 'SCADA and Smart Grid Technologies', credits: 3, type: 'Theory' },
      { code: 'EEL-602', name: 'Electrical Measurement and Instrumentation Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-603', name: 'Power Systems Analysis (MATLAB Based) Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-604', name: 'SCADA and Smart Grid Technologies Lab', credits: 1, type: 'Lab' },
      { code: 'EEL-605', name: 'Microprocessor and Microcontroller Lab', credits: 1, type: 'Lab' },
      { code: 'EEP-601', name: 'Seminar (Literature Review)', credits: 1, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem6_elec_group1',
        label: 'Professional Elective-II',
        options: [
          { code: 'EEE-601', name: 'Microprocessor and Microcontroller', credits: 3, type: 'Theory' },
          { code: 'EEE-602', name: 'HVDC Transmission', credits: 3, type: 'Theory' },
          { code: 'EEE-603', name: 'Electrical Power Generation', credits: 3, type: 'Theory' },
          { code: 'EEE-604', name: 'Robotics and Artificial Intelligence', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 7': {
    subjects: [
      { code: 'EEP-701', name: 'Summer Internship', credits: 2, type: 'Lab' },
      { code: 'EEP-702', name: 'Minor Project', credits: 3, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem7_elec_group1',
        label: 'Professional Elective-III',
        options: [
          { code: 'EEE-701', name: 'Power System Operation and Control', credits: 3, type: 'Theory' },
          { code: 'EEE-702', name: 'Embedded Systems', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_elec_group2',
        label: 'Professional Elective-IV',
        options: [
          { code: 'EEE-703', name: 'Data Communications and Computer Networks', credits: 3, type: 'Theory' },
          { code: 'EEE-704', name: 'Advanced Protective Relays', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_elec_group3',
        label: 'Professional Elective-V',
        options: [
          { code: 'EEE-705', name: 'Electric Drives', credits: 3, type: 'Theory' },
          { code: 'EEE-706', name: 'VLSI Design', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_elec_group4',
        label: 'Professional Elective-VI',
        options: [
          { code: 'EEE-707', name: 'Bio-Medical Instrumentation', credits: 3, type: 'Theory' },
          { code: 'EEE-708', name: 'Electrical Machine Design', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem7_elec_open_group',
        label: 'Open Elective-III',
        options: [
          { code: 'EEO-701', name: 'Advanced Power Electronics', credits: 3, type: 'Theory' },
          { code: 'EEO-705', name: 'Cyber Physical Systems', credits: 3, type: 'Theory' }
        ]
      }
    ]
  },
  'Semester 8': {
    subjects: [
      { code: 'EEP-801', name: 'Major Project', credits: 6, type: 'Lab' }
    ],
    electives: [
      {
        id: 'sem8_elec_open_group1',
        label: 'Open Elective-IV',
        options: [
          { code: 'EEO-801', name: 'High Voltage Engineering', credits: 3, type: 'Theory' },
          { code: 'EEO-802', name: 'Grid Protection and Control', credits: 3, type: 'Theory' },
          { code: 'EEO-803', name: 'Mechatronics', credits: 3, type: 'Theory' }
        ]
      },
      {
        id: 'sem8_elec_open_group2',
        label: 'Open Elective-V',
        options: [
          { code: 'EEO-804', name: 'Soft Computing', credits: 3, type: 'Theory' },
          { code: 'EEO-805', name: 'Electricity Markets and Regulations', credits: 3, type: 'Theory' }
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
  department: string = 'Electronics & Communication Engineering',
  firstYearPattern?: 'SetA' | 'SetB'
 ): { subjects: any[]; electiveSelections: Record<string, string> } {
  const isFirstYear = semesterTitle === 'Semester 1' || semesterTitle === 'Semester 2';
  const isCivil = department === 'Civil Engineering' || department.includes('Civil Engineering');
  const isVlsi = department === 'Electronics (VLSI Design & Technology) (Self-Financed)' || department.includes('VLSI Design');
  const isElec = department === 'Electrical Engineering';
  const isMech = department === 'Mechanical Engineering';
  const isCsds = department.startsWith('Computer Science & Engineering (Data Science') || (department.includes('Computer Science') && department.includes('Data Science'));
  const isCompEng = department === 'Computer Engineering' || (department.includes('Computer') && !department.includes('Data Science') && !department.includes('Electrical'));
  const isEec = department === 'Electrical & Computer Engineering' || department.includes('Electrical & Computer');

  let semData: SemesterCurriculum | undefined = undefined;
  if (isFirstYear) {
    semData = firstYearPattern === 'SetB'
      ? JMI_FIRST_YEAR_SET_B[semesterTitle]
      : JMI_FIRST_YEAR_SET_A[semesterTitle];
  } else {
    semData = isCivil 
      ? JMI_CIVIL_CURRICULUM[semesterTitle] 
      : isVlsi 
        ? JMI_VLSI_CURRICULUM[semesterTitle] 
        : isElec
          ? JMI_ELECTRICAL_CURRICULUM[semesterTitle]
          : isMech
            ? JMI_MECHANICAL_CURRICULUM[semesterTitle]
            : isCsds
              ? JMI_CSE_DS_CURRICULUM[semesterTitle]
              : isCompEng
                ? JMI_COMP_ENG_CURRICULUM[semesterTitle]
                : isEec
                  ? JMI_ELECTRICAL_COMPUTER_CURRICULUM[semesterTitle]
                  : JMI_CURRICULUM[semesterTitle];
  }

  if (!semData) {
    return { subjects: [], electiveSelections: {} };
  }

  const subjectsList: any[] = [];
  const electiveSelections: Record<string, string> = {};

  // Add non-electives
  semData.subjects.forEach((s) => {
    const id = isFirstYear
      ? `sub_jmi_firstyear_${firstYearPattern || 'SetA'}_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
      : isCivil 
        ? `sub_jmi_civil_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
        : isVlsi
          ? `sub_jmi_vlsi_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
          : isElec
            ? `sub_jmi_elec_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
            : isMech
              ? `sub_jmi_mech_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
              : isCsds
                ? `sub_jmi_csds_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
                : isCompEng
                  ? `sub_jmi_comp_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
                  : isEec
                    ? `sub_jmi_eec_${semesterTitle.replace(/\s+/g, '_')}_${s.code.replace(/\s+/g, '_')}`
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
        const id = isFirstYear
          ? `sub_jmi_firstyear_${firstYearPattern || 'SetA'}_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
          : isCivil
            ? `sub_jmi_civil_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
            : isVlsi
              ? `sub_jmi_vlsi_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
              : isElec
                ? `sub_jmi_elec_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
                : isMech
                  ? `sub_jmi_mech_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
                  : isCsds
                    ? `sub_jmi_csds_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
                    : isCompEng
                      ? `sub_jmi_comp_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
                      : isEec
                        ? `sub_jmi_eec_${semesterTitle.replace(/\s+/g, '_')}_elective_${group.id}`
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
