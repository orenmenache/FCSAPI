import * as math from 'mathjs';
import { ActionName, NumSize } from '../types';

const round = {
    getNumDigits(num: number): number {
        let power = 5;
        let multiplied = Math.round(num * this.power(power)); //1.12341234 => 112341
        let tooManyDigits = (Math.log(multiplied) * Math.LOG10E + 1) | 0;
        return tooManyDigits - power;
    },
    countDec(num: number) {
        if (Math.floor(num) === num) {
            return 0;
        }
        return num.toString().split('.')[1].length || 0;
    },
    power(toThePower: number): number {
        if (toThePower <= -4) {
            return 0.0001;
        } else return Math.pow(10, toThePower);
    },
    /**
     * @param {number} num
     * @param {number} digits
     * @returns number
     * Math function sometimes return a buggy number with
     * lots and lots of decimals. So we round`em up
     */
    fixLongBug(num: number, factor: number): number {
        if (factor < 0) {
            let numLength = num.toString().length;
            //console.log(`%cnum ${num} factor ${factor} < 0 numLength ${numLength}`,'color: grey');
            if (numLength >= 6) {
                //console.log(`%cnumLength ${numLength} >= 6`,'color: orange');
                if (num < 0.0001) {
                    return 0.0001;
                }
                num = Number(num.toString().slice(0, 6));
            }
        }
        return num;
    },
    smallNum(num: number, factor: number, action: ActionName) {
        //console.log(`num ${num} factor ${factor} action ${action}`);
        let absFactor = math.abs(factor);
        let result = this.fixLongBug(math[action](num, absFactor), factor);
        //console.log(`result ${result}`);
        return result;
    },
    bigNum(num: number, factor: number, action: ActionName) {
        let power = this.power(math.abs(factor));
        let divided = num / power;
        return math[action](divided) * power;
    },
    ceil(num: number, factor: number, numType: NumSize): number {
        return this[numType](num, factor, 'ceil');
    },
    floor(num: number, factor: number, numType: NumSize): number {
        return this[numType](num, factor, 'floor');
    },
};

export { round };
