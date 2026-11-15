import {buildFakeDataModel, predictPreprocResume} from '~/public/game/controllers/machine-learning/modelTraining.js';
import {cvCollection} from '~/public/game/assets/text/cvCollection.js';

class DataModule {
    constructor() {
        this.accepted = [];
        this.rejected = [];
        this.mlRejected = [];
        this.lastIndex = 0;
        this.groundTruth = [];
        this.acceptanceArrayByAlgo = [];
        this.colorArr = [];
        this.predictedRecords = [];
        this.averageScore = [0, 0, 0, 0];
        this.skillFeatureSize = cvCollection.cvFeatures.length;
        this.toInspectIndex;
    }

    recordAccept(personIndex) {
        if (!this.accepted.includes(personIndex) && !this.rejected.includes(personIndex)) this.accepted.push(personIndex);
    }

    recordReject(personIndex) {
        if (!this.accepted.includes(personIndex) && !this.rejected.includes(personIndex)) this.rejected.push(personIndex);
    }

    recordMLReject(personIndex) {
        this.mlRejected.push(personIndex);
    }

    recordLastIndex(personIndex) {
        this.lastIndex = personIndex;
    }

    getLastIndex() {
        return this.lastIndex;
    }

    getAverageScore(options) {
        let _index = 0;
        let averageScore = [0,0,0,0]
        let selectedIndexArray = [];

        // this is for an array of all selected indices
        if (options.selectedIndexArray && options.selectedIndexArray.length > 0) {
            selectedIndexArray = options.selectedIndexArray;
        } 
        // this is for an array of start and end range index
        else if (options.indexRange && options.indexRange.length == 2) {
            for (let i = options.indexRange[0]; i <= options.indexRange[1]; i++) {
                selectedIndexArray.push(i);
            }
        }

        else throw new Error('Incorrect index array passed to calculate average people scores');

        selectedIndexArray.forEach((personId) => {
            let qual = cvCollection.cvData[personId].qualifications;
            for (_index=0; _index<this.skillFeatureSize; _index++) {
                averageScore[_index] += qual[_index];
            }
        });

        for (_index=0; _index<this.skillFeatureSize; _index++) {
            averageScore[_index] = (averageScore[_index] / selectedIndexArray.length).toFixed(2);
        }

        return averageScore;
    }

    _calculateScore() {
        let hiredAverage = this.getAverageScore({selectedIndexArray: this.accepted});
        let candidateAverage = this.getAverageScore({indexRange: [0, this.lastIndex]});

        const formatScoreText = (maxDiff, maxDiffFeature) => {
            return `You hired people with ${maxDiff >= 0 ? `<u>${maxDiff}%</u> more` : `<u>${maxDiff}%</u> less`} ${maxDiffFeature.toLowerCase()} than the average applicant.`
        }

        let diff = [];
        hiredAverage.forEach((score, idx) => {
            diff.push(parseFloat(((score - candidateAverage[idx]) * 10).toFixed(1)));
        });

        let maxDiff = Math.round(Math.max(...diff));
        let maxDiffFeature = cvCollection.cvFeatures[diff.indexOf(Math.max(...diff))].name;

        return formatScoreText(maxDiff, maxDiffFeature);
    }

    train() {
        this.featurePref = [0, 1, 2, 3];
        this.clf = buildFakeDataModel(this.featurePref, this.accepted, this.rejected);
    }

    predict(inputResume) {
        // if starting in MLlab stage, we need to quickly train to not break anything
        if (!this.clf) this.train();
        
        const result = this.clf.predict(predictPreprocResume([inputResume], this.featurePref));

        // measure ongoing performance and bias
        this.groundTruth.push(inputResume.empl);
        this.acceptanceArrayByAlgo.push(result);
        this.predictedRecords.push({...inputResume, empl: Number(result[0])});
        this.colorArr.push(inputResume.color);
        
        return result;
    }

    getManualRecords() {
        return [...this.accepted.map(i => ({...cvCollection.cvData[i], empl: 1})),
            ...this.rejected.map(i => ({...cvCollection.cvData[i], empl: 0}))];
    }

    getPredictedRecords() { return this.predictedRecords.slice(); }

    getAcceptedPeople() {
        return this.accepted;
    }

    getAcceptanceByTheAlgo() {
        return this.acceptanceArrayByAlgo;
    }

    uploadUserDecisions() {
        // this.accepted has the indices of accepted candidates
        // _getRejectedPeople() returns indices of rejected people
        // BE CAREFUL! IF DATASET IS REGENERATED ON THE PYTHON SIDE, THE INDICES STILL REFER TO THE OLD DB
        // function best called in the beginning of training
        return;
    }
}

export const dataModule = new DataModule();
