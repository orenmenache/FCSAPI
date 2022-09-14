import { NumSize } from './types';

class Factor {
    f: number;
    type: NumSize;

    constructor(factor: number) {
        this.f = factor;
        this.type = factor > 2 ? 'bigNum' : 'smallNum';
    }
}

export { Factor };
