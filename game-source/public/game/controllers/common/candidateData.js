// Sprite colour is the city identity in this adaptation. Keep one mapping for
// the model, CVs, applicant art, and city summaries, including retained records.
export function candidateCity(color) {
    if (color === 'orange') return {id: 1, name: 'Bengaluru'};
    if (color === 'blue') return {id: 0, name: 'Chennai'};
    throw new Error('Applicant has an unknown city colour: ' + color);
}

export function normalizeCandidates(candidates) {
    return candidates.map(candidate => {
        // Some upstream evaluation fixtures contain a city ID but no sprite.
        const color = candidate.color === undefined
            ? (candidate.city === 1 ? 'orange' : candidate.city === 0 ? 'blue' : undefined)
            : candidate.color;
        const city = candidateCity(color);
        return {...candidate, color, city: city.id, cityName: city.name};
    });
}
