import {dataModule} from '~/public/game/controllers/machine-learning/dataModule.js';

export function summarizeLegacyRecords(records) {
    const accepted = records.filter(person => person.empl === 1);
    const rejected = records.filter(person => person.empl === 0);
    const share = group => group.length ? 100 * group.filter(person => person.color === 'orange').length / group.length : null;
    const average = color => {
        const group = records.filter(person => person.color === color);
        return group.length ? 10 * group.reduce((sum, person) => sum + person.qualifications.reduce((a, b) => a + b, 0) / 4, 0) / group.length : null;
    };
    return [share(accepted), share(rejected), average('orange'), average('blue')];
}

class Statistics {
    getCardStats(records) { return summarizeLegacyRecords(records); }
    getManualStats() { return this.getCardStats(dataModule.getManualRecords()); }
    getMlLabStats() { return this.getCardStats(dataModule.getPredictedRecords()); }
    getFeatures() { return ['HiredMakeup', 'RejectedMakeup', 'AverageOrange', 'AverageBlue']; }
}
export const statistics = new Statistics();
