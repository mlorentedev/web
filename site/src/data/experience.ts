
/**
 * Career facts, condensed from the canonical CV (the `resume` project's
 * `data/cv.yml`) and told in Manu's words (#499): a few short paragraphs per
 * role, what he did and one moment that shows it. The home's timeline renders
 * this list next to `data/education.ts`, and every figure elsewhere on the home
 * is held to it (`tests/bio.test.mjs`). A new figure goes here first, next to
 * the role it belongs to. Bilingual, same shape as `portfolio.ts`.
 *
 * Nothing here names a customer, a product or a defect: the moment is told
 * by what Manu did, and the detail stays for the interview.
 */

/**
 * One paragraph of a role's story. `label` names the stage it covers (pre-sales,
 * integration...) where a role has several; a role told in one paragraph has
 * none. `text` may carry `[words](/path/)` links to site pages, localised at
 * render time.
 */
export interface StoryBlock {
  label?: string;
  text: string;
}

/** Per-language copy for a role. */
export interface RoleContent {
  /** Job title. */
  role: string;
  /** What Manu did, in his words, as one or more short paragraphs. */
  story: StoryBlock[];
}

/** A timeline entry: language-neutral dates/company + per-language role + location. */
export interface Experience {
  /** Start year, e.g. "2019". */
  start: string;
  /** End year, or `null` for an ongoing role. */
  end: string | null;
  /**
   * Employer — language-neutral. Manu names it as he lived it: e2v until 2019,
   * then Teledyne Technologies, which bought it (his dating, 2026-11-02).
   */
  company: string;
  /** Localized location string. */
  location: { en: string; es: string };
  en: RoleContent;
  es: RoleContent;
}

export const experience: Experience[] = [
  {
    start: '2024',
    end: null,
    company: 'Teledyne Technologies',
    location: { en: 'USA', es: 'EE. UU.' },
    en: {
      role: 'Applications Engineer',
      story: [
        { label: 'Pre-sales', text: 'I learn what the customer\'s application needs, find which of our cameras, sensors, modules or systems fits it, and build a proof of concept to show it working.' },
        { label: 'Integration', text: 'If they design with us, I stay with them until it is tuned: I train them on our API, audit their full design, which is complex to integrate, and write small pieces of code for them.' },
        { label: 'After-sales', text: 'When there is a fire, it gets put out. Several times a year I debug in the field with the customer\'s engineering teams. On one of those trips a couple of routines and some product registers had to change: I wrote the change on the spot, and the same day they had a beta to test, which went into a product update.' },
        { label: 'Cross-cutting', text: 'I built the platform that generates and validates the SDK and a PoC for each product, mostly sensors and modules, which is why that beta took a day. I designed, built and maintain the company brain: a harness that is an expert on our products, on Copilot and Azure, used by the applications, business and sales teams. Microsoft already indexes mail, Teams and documents; what was missing was structured, curated product knowledge, so I gathered it from several sources and put it on top. It is used from Copilot chat and from scripts, and I expose it as an MCP server so coding agents have the product data. Customer onboarding went from 120 days to 20–30. How I work with agents is on [AI](/ai/); what I run at home, in the [lab](/lab/).' },
      ],
    },
    es: {
      role: 'Ingeniero de Aplicaciones',
      story: [
        { label: 'Preventa', text: 'Entiendo qué necesita la aplicación del cliente, busco qué cámara, sensor, módulo o sistema nuestro le encaja y le monto una prueba de concepto para enseñárselo funcionando.' },
        { label: 'Integración', text: 'Si diseña con nosotros, le acompaño hasta la puesta a punto: le formo en nuestra API, audito su diseño completo, que es complejo de integrar, y le hago pequeños desarrollos.' },
        { label: 'Postventa', text: 'Cuando hay un fuego, se arregla. Varias veces al año me toca depurar en el campo con los equipos de ingeniería del cliente. En uno de esos viajes había que cambiar un par de rutinas y algunos registros del producto: lo desarrollé sobre la marcha y ese mismo día tenían una beta para probar, que acabó en una actualización del producto.' },
        { label: 'Transversal', text: 'Construí la plataforma que genera y valida el SDK y una PoC de cada producto, casi siempre sensores y módulos: por eso esa beta salió en un día. Diseñé, desarrollé y mantengo el company brain: un harness experto en nuestros productos sobre Copilot y Azure, que usan los equipos de aplicaciones, negocio y ventas. Microsoft ya indexa el correo, Teams y los documentos; lo que faltaba era el conocimiento de producto estructurado y curado, así que lo reuní de varias fuentes y lo puse encima. Se usa desde el chat de Copilot y desde scripts, y lo expongo como servidor MCP para que los agentes de programación tengan los datos de producto. El onboarding de un cliente ha bajado de 120 días a 20–30. Cómo trabajo con agentes, en [IA](/ai/); lo que tengo en casa, en el [lab](/lab/).' },
      ],
    },
  },
  {
    start: '2019',
    end: '2024',
    company: 'Teledyne Technologies',
    location: { en: 'Spain', es: 'España' },
    en: {
      role: 'Applications Engineer',
      story: [
        { text: 'The same work, from pre-sales to after-sales, with European customers. This is where everything I use today began: we replaced the MATLAB manufacturing scripts with a Python CLI for the global teams, and from it came the SDK customers used to evaluate each product against their industry\'s standards. That code kept growing until it became today\'s platform.' },
      ],
    },
    es: {
      role: 'Ingeniero de Aplicaciones',
      story: [
        { text: 'El mismo trabajo, de la preventa a la postventa, con clientes europeos. Aquí empezó todo lo que uso hoy: sustituimos los scripts de MATLAB de fabricación por una CLI en Python para los equipos globales, y de ahí salió el SDK con el que los clientes evaluaban cada producto según los estándares de cada industria. Ese código fue creciendo hasta convertirse en la plataforma actual.' },
      ],
    },
  },
  {
    start: '2018',
    end: '2019',
    company: 'e2v',
    location: { en: 'Shenzhen, China', es: 'Shenzhen (China)' },
    en: {
      role: 'Technical Specialist',
      story: [
        { text: 'The same work I do today, with customers in Asia: pre-sales, integration and after-sales, closer to the customer and with less development. I was also the engineering link between Europe and China.' },
      ],
    },
    es: {
      role: 'Especialista Técnico',
      story: [
        { text: 'El mismo trabajo que hago hoy, pero con clientes de Asia: preventa, integración y postventa, más cerca del cliente y con menos desarrollo. Además hacía de enlace de ingeniería entre Europa y China.' },
      ],
    },
  },
  {
    start: '2017',
    end: '2018',
    company: 'e2v',
    location: { en: 'Grenoble, France', es: 'Grenoble (Francia)' },
    en: {
      role: 'R&D Engineer',
      story: [
        { text: 'I was on the team that developed two cameras, one Camera Link and one Gigabit Ethernet, on sensors I had characterised in Seville. My part was the C firmware and the VHDL, from the first build to the fine-tuning, at latencies under 10 ms; another team did the PCB and the rest of the hardware.' },
      ],
    },
    es: {
      role: 'Ingeniero de I+D',
      story: [
        { text: 'Formé parte del equipo que desarrolló dos cámaras, una Camera Link y otra Gigabit Ethernet, sobre sensores que había caracterizado en Sevilla. Lo mío fue el firmware en C y el VHDL, del desarrollo inicial a los ajustes finos, con latencias por debajo de 10 ms; la PCB y el resto del hardware los hizo otro equipo.' },
      ],
    },
  },
  {
    start: '2015',
    end: '2017',
    company: 'e2v',
    location: { en: 'Seville, Spain', es: 'Sevilla, España' },
    en: {
      role: 'Test Engineer',
      story: [
        { text: 'More electronics engineer than software: electro-optical characterisation of CMOS image sensors, with lab measurements and a lot of testing. I automated data acquisition with the oscilloscope and the rest of the lab instruments, and processed the data in MATLAB and Python. It took more than 15 hours a week of manual work off my plate. Some of those sensors ended up in the cameras I worked on later in Grenoble.' },
      ],
    },
    es: {
      role: 'Ingeniero de Test',
      story: [
        { text: 'Más de ingeniero electrónico que de software: caracterización electro-óptica de sensores de imagen CMOS, con medidas de laboratorio y mucho testing. Automaticé la adquisición de datos con el osciloscopio y el resto de la instrumentación, y procesaba los datos con MATLAB y Python. Me quité más de 15 horas semanales de trabajo manual. Algunos de esos sensores acabaron en las cámaras en las que trabajé después en Grenoble.' },
      ],
    },
  },
];
