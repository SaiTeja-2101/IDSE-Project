/* ///////////////////
Object of all CVs for each stage
As of now, skills are scaled out of 10
*/// /////////////////

import CLASSES from '~/public/game/controllers/constants/classes';
import {normalizeCandidates} from '../../controllers/common/candidateData';

const cvCollection = {
    cvFeatures: [
        {
            name: 'Practical skill',
            class: CLASSES.CV_SKILL,
        },
        {
            name: 'School score',
            class: CLASSES.CV_SCHOOL,
        },
        {
            name: 'Work Experience',
            class: CLASSES.CV_WORK,
        },
        {
            name: 'Ambition',
            class: CLASSES.CV_AMBITION,
        },
    ],
    cvData: normalizeCandidates(require('./cvData.json').candidates),
    cvDataEqual: normalizeCandidates(require('./equalCvData.json').candidates),
    specialCandidate: normalizeCandidates([{"name": "Elvan Yang", "city": 1, "color": "blue", "empl": 0, "qualifications": [10, 9, 8, 9]}])[0]
};

export {cvCollection};
