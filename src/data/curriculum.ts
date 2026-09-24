import type { Course } from '../domain/types'

const course = (value: Omit<Course, 'prerequisites' | 'corequisites' | 'minimumProgress'> & Partial<Pick<Course, 'prerequisites' | 'corequisites' | 'minimumProgress'>>): Course => ({
  prerequisites: [],
  corequisites: [],
  minimumProgress: 0,
  ...value,
})

export const TOTAL_HOURS = 3630

export const CURRICULUM: Course[] = [
  course({ id: 'GA', name: 'Geometria Analítica', period: 1, hours: 60, category: 'basic' }),
  course({ id: 'CAL1', name: 'Cálculo Diferencial e Integral I', period: 1, hours: 60, category: 'basic' }),
  course({ id: 'COMEXP', name: 'Comunicação e Expressão', period: 1, hours: 30, category: 'basic' }),
  course({ id: 'ALGPROG', name: 'Alg. e Prog. para Computação', period: 1, hours: 90, category: 'basic' }),
  course({ id: 'INTENG', name: 'Int. à Eng. da Computação', period: 1, hours: 30, category: 'specific' }),
  course({ id: 'MATDISC', name: 'Matemática Discreta', period: 1, hours: 60, category: 'specific' }),

  course({ id: 'ALGLIN', name: 'Álgebra Linear', period: 2, hours: 60, category: 'basic', prerequisites: ['GA'] }),
  course({ id: 'CAL2', name: 'Cálculo Diferencial e Integral II', period: 2, hours: 60, category: 'basic', prerequisites: ['CAL1'] }),
  course({ id: 'FIS1', name: 'Física Teórica I', period: 2, hours: 60, category: 'basic' }),
  course({ id: 'AED', name: 'Alg. e Estrutura de Dados', period: 2, hours: 60, category: 'specific', prerequisites: ['ALGPROG'] }),
  course({ id: 'ELDIG', name: 'Eletrônica Digital', period: 2, hours: 60, category: 'specific', prerequisites: ['INTENG'], corequisites: ['LABELDIG'] }),
  course({ id: 'LABELDIG', name: 'Lab. de Eletrônica Digital', period: 2, hours: 30, category: 'specific', corequisites: ['ELDIG'] }),

  course({ id: 'LOGICA', name: 'Lógica para Computação', period: 3, hours: 60, category: 'specific', prerequisites: ['MATDISC'] }),
  course({ id: 'FISEXP', name: 'Física Experimental A', period: 3, hours: 60, category: 'basic', corequisites: ['FIS2'] }),
  course({ id: 'FIS2', name: 'Física Teórica II', period: 3, hours: 60, category: 'basic', prerequisites: ['FIS1'], corequisites: ['FISEXP'] }),
  course({ id: 'CIRC', name: 'Circuitos Elétricos', period: 3, hours: 60, category: 'specific', corequisites: ['LABCIRC'] }),
  course({ id: 'LABCIRC', name: 'Lab. de Circuitos Elétricos', period: 3, hours: 30, category: 'specific', corequisites: ['CIRC'] }),
  course({ id: 'OAC', name: 'Org. e Arq. de Computadores', period: 3, hours: 60, category: 'specific', prerequisites: ['ELDIG'], corequisites: ['LABOAC'] }),
  course({ id: 'LABOAC', name: 'Lab. de Org. e Arq. de Comp.', period: 3, hours: 30, category: 'specific', corequisites: ['OAC'] }),

  course({ id: 'CALCNUM', name: 'Cálculo Numérico', period: 4, hours: 60, category: 'basic', prerequisites: ['CAL2', 'ALGLIN', 'ALGPROG'] }),
  course({ id: 'CAL4', name: 'Cálculo Diferencial e Integral IV', period: 4, hours: 60, category: 'basic', prerequisites: ['CAL2'] }),
  course({ id: 'FIS3', name: 'Física Teórica III', period: 4, hours: 60, category: 'basic', prerequisites: ['CAL2', 'FIS2'] }),
  course({ id: 'ELAN', name: 'Eletrônica Analógica', period: 4, hours: 60, category: 'specific', corequisites: ['LABELAN'] }),
  course({ id: 'LABELAN', name: 'Lab. de Eletrônica Analógica', period: 4, hours: 30, category: 'specific', prerequisites: ['LABCIRC'], corequisites: ['ELAN'] }),
  course({ id: 'POO', name: 'Prog. Orientada a Objeto', period: 4, hours: 60, category: 'specific', prerequisites: ['ALGPROG'] }),
  course({ id: 'ESTAT', name: 'Estatística e Prob. p/ Comp.', period: 4, hours: 60, category: 'basic', prerequisites: ['CAL1'] }),

  course({ id: 'SO', name: 'Sistemas Operacionais', period: 5, hours: 60, category: 'specific', prerequisites: ['OAC', 'AED'] }),
  course({ id: 'REDES', name: 'Redes de Computadores', period: 5, hours: 60, category: 'specific', prerequisites: ['OAC'], corequisites: ['LABREDES'] }),
  course({ id: 'LABREDES', name: 'Lab. de Rede de Comp.', period: 5, hours: 30, category: 'specific', corequisites: ['REDES'] }),
  course({ id: 'SMICRO', name: 'Sistemas Microcontrolados', period: 5, hours: 60, category: 'specific', prerequisites: ['ALGPROG', 'OAC', 'ELAN', 'LABELAN'] }),
  course({ id: 'ASS', name: 'Análise de Sinais e Sistemas', period: 5, hours: 60, category: 'specific', prerequisites: ['CAL4'] }),
  course({ id: 'BD1', name: 'Banco de Dados I', period: 5, hours: 60, category: 'specific', corequisites: ['ES1'] }),
  course({ id: 'ES1', name: 'Engenharia de Software I', period: 5, hours: 60, category: 'specific', prerequisites: ['POO'], corequisites: ['BD1'] }),

  course({ id: 'SD1', name: 'Sistemas Distribuídos I', period: 6, hours: 60, category: 'specific', prerequisites: ['REDES'] }),
  course({ id: 'INSTR', name: 'Instrumentação Eletrônica', period: 6, hours: 60, category: 'specific', prerequisites: ['SMICRO'] }),
  course({ id: 'ADM', name: 'Administração p/ Engenharia', period: 6, hours: 30, category: 'specific' }),
  course({ id: 'IA', name: 'Inteligência Artificial', period: 6, hours: 60, category: 'specific', prerequisites: ['LOGICA', 'AED'] }),
  course({ id: 'LFA', name: 'Ling. Formais e Autômatos', period: 6, hours: 60, category: 'specific', prerequisites: ['ALGPROG', 'MATDISC'] }),
  course({ id: 'BD2', name: 'Banco de Dados II', period: 6, hours: 30, category: 'specific', prerequisites: ['BD1'] }),
  course({ id: 'ES2', name: 'Engenharia de Software II', period: 6, hours: 60, category: 'specific', prerequisites: ['ES1', 'BD1'] }),

  course({ id: 'TELECOM', name: 'Princípios de Telecom.', period: 7, hours: 60, category: 'specific', prerequisites: ['ASS'] }),
  course({ id: 'CTRL1', name: 'Sistemas de Controle I', period: 7, hours: 60, category: 'specific', prerequisites: ['ASS'] }),
  course({ id: 'CG', name: 'Computação Gráfica', period: 7, hours: 60, category: 'specific', prerequisites: ['GA', 'AED'] }),
  course({ id: 'MEIOAMB', name: 'Meio Ambiente e Desenv. Sust.', period: 7, hours: 30, category: 'specific' }),
  course({ id: 'COMPIL', name: 'Compiladores', period: 7, hours: 60, category: 'specific', prerequisites: ['AED', 'OAC'] }),
  course({ id: 'ECON', name: 'Introdução à Eng. Econômica', period: 7, hours: 30, category: 'specific' }),
  course({ id: 'METPESQ', name: 'Metod. de Pesq. Científica', period: 7, hours: 30, category: 'basic', prerequisites: ['COMEXP'] }),

  course({ id: 'LEGAIS', name: 'Aspectos Legais p/ Comp.', period: 8, hours: 30, category: 'specific' }),
  course({ id: 'CTRL2', name: 'Sistemas de Controle II', period: 8, hours: 60, category: 'specific', prerequisites: ['CTRL1'] }),
  course({ id: 'TCC1', name: 'Trab. de Conc. de Curso I', period: 8, hours: 60, category: 'specific', minimumProgress: 0.7 }),
  course({ id: 'ELET1', name: 'Eletiva I', period: 8, hours: 60, category: 'complementary' }),
  course({ id: 'MODSIM', name: 'Modelagem e Simulação', period: 8, hours: 60, category: 'specific', prerequisites: ['ESTAT', 'OAC', 'ES1', 'CALCNUM'] }),
  course({ id: 'TEOCOMP', name: 'Teoria da Computação', period: 8, hours: 60, category: 'specific', prerequisites: ['LFA'] }),
  course({ id: 'OPT1', name: 'Optativa I', period: 8, hours: 60, category: 'elective' }),

  course({ id: 'EMPREEND', name: 'Empreendedorismo', period: 9, hours: 30, category: 'specific' }),
  course({ id: 'OPT3', name: 'Optativa III', period: 9, hours: 60, category: 'elective' }),
  course({ id: 'TCC2', name: 'Trab. de Conc. de Curso II', period: 9, hours: 60, category: 'specific', prerequisites: ['TCC1'] }),
  course({ id: 'NUCLEO', name: 'Núcleo Temático', period: 9, hours: 120, category: 'specific' }),
  course({ id: 'OPT2', name: 'Optativa II', period: 9, hours: 60, category: 'elective' }),
  course({ id: 'AVALDES', name: 'Aval. e Des. de Sistemas', period: 9, hours: 60, category: 'specific', prerequisites: ['REDES', 'SD1'] }),

  course({ id: 'ELET2', name: 'Eletiva II', period: 10, hours: 60, category: 'complementary' }),
  course({ id: 'ESTAGIO', name: 'Estágio Supervisionado', period: 10, hours: 240, category: 'specific', minimumProgress: 0.5 }),
  course({ id: 'OPT4', name: 'Optativa IV', period: 10, hours: 60, category: 'elective' }),
]

export const COURSE_CATEGORY_LABELS = {
  basic: 'Ciclo básico',
  specific: 'Específicas',
  elective: 'Optativas',
  complementary: 'Complementares',
} as const
