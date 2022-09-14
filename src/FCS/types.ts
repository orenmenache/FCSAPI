type AssetType = 'forex' | 'crypto' | 'stock';
type ProcType = 'noon' | 'even';
type NumSize = 'bigNum' | 'smallNum';
type ActionName = 'ceil' | 'floor';
type ListName =
    | 'noonCurrency'
    | 'evenCurrency'
    | 'noonStocks'
    | 'evenStocks'
    | 'colmexStocks'
    | 'hindiStocks'
    | 'crypto';
type AssetName = string;
type CandleKeys = 'o' | 'c' | 'h' | 'l' | 'v' | 't' | 'tm';
type CandleOBJ = { [key in CandleKeys]: any };
type FCSDateString = string;
type FCSResponseKeys = 'status' | 'headers' | 'data';
type FCSResponseOBJ = { [key in FCSResponseKeys]: any };
type HighLow = { high: number; low: number };
type MovingAverage = number[];
type MovingAverageNames = 'MA5' | 'MA10' | 'MA15' | 'MA20' | 'MA25';
type MovingAverageCluster = { [key in MovingAverageNames]: MovingAverage };

export {
    ProcType,
    NumSize,
    ActionName,
    ListName,
    AssetName,
    CandleKeys,
    CandleOBJ,
    AssetType,
    FCSDateString,
    FCSResponseKeys,
    FCSResponseOBJ,
    HighLow,
    MovingAverage,
    MovingAverageNames,
    MovingAverageCluster,
};
