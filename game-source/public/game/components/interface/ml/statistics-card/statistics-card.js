import $ from 'jquery';
import CLASSES from '~/public/game/controllers/constants/classes';
import {statistics} from '~/public/game/controllers/machine-learning/statistics.js';

export default class {
    constructor(isManualStageStats) {
        let cv;
        if (isManualStageStats) {
            cv = statistics.getManualStats();
            this.$el = $('#statistics-card-manual');
        } else {
            cv = statistics.getMlLabStats();
            this.$el = $('#statistics-card-mllab');
        }
        statistics.getFeatures().forEach((feature, index) => {
            const skillScore = cv[index];
            const skillClass = `.${feature}`;
            const $skillEl = this.$el.find(skillClass);
            const available = skillScore !== null && Number.isFinite(skillScore);
            const width = available ? Math.max(0, Math.min(100, skillScore)) : 0;
            $skillEl.find(`.${CLASSES.STATS_CATEGORY}__progress`).css('width', `${width}%`);
            let $value = $skillEl.find('.stats-category__value');
            if (!$value.length) $value = $('<p class="stats-category__value">').appendTo($skillEl);
            $value.text(!available ? 'Not available' : index < 2
                ? skillScore.toFixed(1) + '% / ' + (100 - skillScore).toFixed(1) + '%'
                : skillScore.toFixed(1) + ' / 100');
        });
    }
}
