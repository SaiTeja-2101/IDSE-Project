import $ from 'jquery';
import {cvCollection} from '~/public/game/assets/text/cvCollection.js';
import CLASSES from '~/public/game/controllers/constants/classes';
import {fillCandidateCard} from '../../../../controllers/common/candidateView';

export default class {
    constructor() {
        this.$el = $('#dataset-view-resume');
        this.$nameEl = this.$el.find('.Resume__title');
        this.$taglineEl = this.$el.find('.Resume__tagline');
        this.$el.removeClass(CLASSES.IS_INACTIVE);
        this._resumeFeatures = cvCollection.cvFeatures;
    }

    previewNewPerson(cv) {
        this.setColor(cv.color);
        this.$nameEl.html(cv.name);
        fillCandidateCard(this.$el[0], cv);
    }

    setColor(color) {
        if (color === 'orange') {
            this.$el
                .addClass(CLASSES.RESUME_ORANGE)
                .removeClass(CLASSES.RESUME_BLUE);
        } else {
            this.$el
                .addClass(CLASSES.RESUME_BLUE)
                .removeClass(CLASSES.RESUME_ORANGE);
        };
    }
    // destroy the instance

    destroy() {
    }
}
