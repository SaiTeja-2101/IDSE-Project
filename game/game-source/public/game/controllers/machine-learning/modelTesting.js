// Legacy report utilities only. Models are never accepted/rejected based on
// whether their outputs support a planned story or an evaluation fixture.
export function reportMetrics(predictions, labels) {
    const correct = predictions.reduce((sum, prediction, i) => sum + (Number(prediction) === labels[i] ? 1 : 0), 0);
    return {total: predictions.length, accuracy: predictions.length ? correct / predictions.length : null};
}
