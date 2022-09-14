import { AssetName, MovingAverageCluster } from './types';
import { FCSCandle } from './Candle';
import { HighLowPriceAnalyzer } from './Analyzers/HighLowAnalyzer';
import { VolumeAnanyzer } from './Analyzers/VolumeAnalyzer';

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
}

export { AssetSinglePackage };
