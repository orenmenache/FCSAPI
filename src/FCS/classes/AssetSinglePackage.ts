import { AssetName, MovingAverageCluster } from '../types';
import { FCSCandle } from './Candle';
import { HighLowPriceAnalyzer } from './Analyzers/HighLowAnalyzer';
import { VolumeAnanyzer } from './Analyzers/VolumeAnalyzer';
import formatToSQLDate from '../../functions/formatToSQLDate';

class AssetSinglePackage {
    name: string;
    candles: FCSCandle[];
    HLAnalyzer: HighLowPriceAnalyzer;
    VAnalyzer: VolumeAnanyzer;
    MA?: MovingAverageCluster;
    constructor(
        assetName: string,
        candles: FCSCandle[],
        HLAnalyzer: HighLowPriceAnalyzer,
        VAnalyzer: VolumeAnanyzer,
        MA?: MovingAverageCluster
    ) {
        this.name = assetName;
        this.candles = candles;
        this.HLAnalyzer = HLAnalyzer;
        this.VAnalyzer = VAnalyzer;
        this.MA = MA;
    }

    getSQLDateOfMostRecentCandle(): false | string {
        if (this.candles.length == 0) {
            return false;
        }
        return formatToSQLDate(this.candles[0].tm);
    }
}

export { AssetSinglePackage };
