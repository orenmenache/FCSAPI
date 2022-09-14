import * as math from 'mathjs';
import { round } from '../functions/round';
import { PriceAnalyzer } from './PriceAnalyzer';

class HighLowPriceAnalyzer {
    high: PriceAnalyzer;
    low: PriceAnalyzer;
    priceRange: number;
    percentRange: number;
    gap: PriceAnalyzer;
    chartLow: PriceAnalyzer;
    chartHigh: PriceAnalyzer;
    trueRange: number;
    stepsLen: number;
    steps: number[];
    stepsSTR: string[];
    /**
     * @param  {number} high
     * @param  {number} low
     * Analyzes the prices needed to construct a chart
     * Does not calculate pixels
     */
    constructor(high: number, low: number) {
        this.high = new PriceAnalyzer(high);
        this.low = new PriceAnalyzer(low);
        this.priceRange = high - low;
        this.percentRange = 100 / ((high + low) / 2 / this.priceRange);
        this.gap = new PriceAnalyzer(this.priceRange / 10);
        //if (this.gap.digits==1){this.gap.changeFactor(-2)}
        this.gap.round(this.gap.factor, 'ceil');
        this.high.round(this.gap.factor, 'ceil');
        this.low.round(this.gap.factor, 'floor');

        this.chartLow = this.getChartLow();
        this.chartHigh = this.getChartHigh();
        this.trueRange = math.round(
            this.chartHigh.rounded - this.chartLow.rounded,
            math.abs(this.gap.factor.f)
        );
        this.stepsLen = math.round(this.trueRange / this.gap.rounded);
        this.steps = this.getSteps();
        this.stepsSTR = this.getStepsSTR();
        //this.chartLow.round(this.gap.numSize,this.gap.)
    }
    getChartLow() {
        //console.log(`lowR ${this.low.rounded} gapR ${this.gap.rounded}`);
        let chartLow = new PriceAnalyzer(
            this.low.rounded - this.gap.rounded * 2
        );
        chartLow.changeFactor(this.gap.factor.f + 1);
        chartLow.round(chartLow.factor, 'floor');
        return chartLow;
    }
    getChartHigh() {
        let high = this.high.rounded;
        let low = this.chartLow.rounded;
        let absFactor = math.abs(this.gap.factor.f);
        let roundRange = math.round(high - low, absFactor);
        let divided = math.floor(roundRange / this.gap.rounded);
        let chartHigh = math.round(
            low + this.gap.rounded * (divided + 2),
            absFactor
        );
        let PA = new PriceAnalyzer(chartHigh);
        PA.rounded = PA.price;
        return PA;
        //return chartHigh;
    }
    getSteps(): number[] {
        let steps = [];
        let chartLow = this.chartLow.rounded;
        let gap = this.gap.rounded;
        let factor = this.gap.factor.f;
        let dec = math.abs(factor);

        for (let i = 0; i <= this.stepsLen; i++) {
            let calc = math.round(chartLow + i * gap, dec);
            steps.push(calc);
        }

        return steps;
    }
    getStepsSTR(): string[] {
        let stepsSTR = [];
        let factor = this.gap.factor.f;
        let dec = math.abs(factor);

        for (let i = 0; i < this.steps.length; i++) {
            let step = this.steps[i];
            let str = step.toString();
            if (factor < 0) {
                let hasDot = str.indexOf('.') > -1;
                if (!hasDot) {
                    //console.log(`%c${str} doesn't have a dot`,'color: orange');
                    str += '.';
                    for (let j = 0; j < dec; j++) {
                        str += '0';
                    }
                } else {
                    let count = round.countDec(step);
                    if (count < dec) {
                        //console.log(`%c${str} doesn't have enough decimals`,'color: purple');
                        let decGap = dec - count;
                        for (let j = 0; j < decGap; j++) {
                            str += '0';
                        }
                    }
                }
            }
            stepsSTR.push(str);
        }
        return stepsSTR;
    }
}

export { HighLowPriceAnalyzer };
