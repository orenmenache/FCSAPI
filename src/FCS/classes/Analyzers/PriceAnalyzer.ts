import { round } from '../../functions/round';
import { ActionName } from '../../types';
import { Factor } from '../Factor';

class PriceAnalyzer {
    price: number;
    //dec: number;
    digits: number;
    rounded!: number;
    factor: Factor;

    constructor(price: number) {
        this.price = price;
        //this.dec = Round.countDec(price);
        this.digits = round.getNumDigits(price);
        this.factor = new Factor(this.digits - 2);
    }
    round(factor: Factor, action: ActionName) {
        //console.log(`action: ${action} factor.f ${factor.f} price ${this.price} type ${factor.type}`);
        this.rounded = round[action](this.price, factor.f, factor.type);
    }
    changeFactor(to: number) {
        this.factor = new Factor(to);
    }
}

export { PriceAnalyzer };
