import {candidateCity} from './candidateData';
// Show all four inputs used by the retained model until Phase 3 replaces it.
export function candidateView(cv) {
    const scores = cv.qualifications || [];
    return {
        city: candidateCity(cv.color).name,
        school: scores[1] || 0,
        ambition: scores[3] || 0,
        skill: scores[0] || 0,
        experience: scores[2] || 0,
    };
}
export function fillCandidateCard(element, cv) {
    const view = candidateView(cv);
    element.querySelector('.Resume__city').textContent = view.city;
    const fields = [['skill', view.skill, 'Practical skill'], ['school', view.school, 'School score'],
        ['work', view.experience, 'Experience'], ['ambition', view.ambition, 'Ambition']];
    for (const [key, value, label] of fields) {
        const row = element.querySelector('.cv-category--' + key);
        const shownValue = Math.round(value * 10) / 10;
        row.querySelector('.cv-category__name').textContent = label;
        row.querySelector('.cv-category__value').textContent = shownValue + '/10';
        row.querySelector('.cv-category__skillbar').setAttribute('aria-valuenow', shownValue);
        row.querySelector('.cv-category__progress').style.width = Math.max(0, Math.min(100, value * 10)) + '%';
    }
    element.querySelector('.Resume__details').hidden = false;
}
