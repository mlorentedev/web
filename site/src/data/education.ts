/**
 * Academic path, shown beside the career on the home's timeline. Dates and names
 * as Manu confirmed them on 2026-11-01 (#499); `resume/data/cv.yml` differs on
 * the degree's end year and the last master's name, and the site follows Manu.
 */

export interface Education {
  start: string;
  end: string;
  school: string;
  en: string;
  es: string;
}

export const education: Education[] = [
  {
    start: '2023',
    end: '2024',
    school: 'Universidad Rey Juan Carlos',
    en: "Master's in Cloud Application Development and Deployment",
    es: 'Máster en Desarrollo y Despliegue de Aplicaciones Cloud',
  },
  {
    start: '2019',
    end: '2021',
    school: 'Universidad de Málaga',
    en: "Master's in Embedded Systems",
    es: 'Máster en Sistemas Embebidos',
  },
  {
    start: '2012',
    end: '2017',
    school: 'Universidad de Sevilla',
    en: 'Telecommunications Engineering',
    es: 'Ingeniería de Telecomunicaciones',
  },
];
