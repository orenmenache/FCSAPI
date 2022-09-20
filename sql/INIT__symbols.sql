-- This is the general reset statement
-- Create the tables and primary data
-- for all assets and get ready to log data

DROP TABLE IF EXISTS assetData;
DROP TABLE IF EXISTS symbols;
DROP TABLE IF EXISTS editionNameTypes;
DROP TABLE IF EXISTS assetTypes;

CREATE TABLE assetTypes (
    assetType VARCHAR(8) NOT NULL UNIQUE,
    PRIMARY KEY (assetType)
);

CREATE TABLE editionNameTypes (
    editionNameType VARCHAR(8) NOT NULL UNIQUE,
    PRIMARY KEY (editionNameType)
);

CREATE TABLE symbols(
    symbol VARCHAR(15) NOT NULL UNIQUE,
    assetType VARCHAR(8) NOT NULL REFERENCES assetTypes(assetType),
    assetName VARCHAR(30) NOT NULL,
    editionNameA VARCHAR(8) NOT NULL REFERENCES editionNameTypes(editionNameType),
    editionNameB VARCHAR(8) DEFAULT NULL REFERENCES editionNameTypes(editionNameType),
    PRIMARY KEY (symbol)
);

CREATE TABLE assetData(
    id INT NOT NULL UNIQUE IDENTITY,
    symbol VARCHAR(15) NOT NULL REFERENCES symbols(symbol),
    o VARCHAR(20) NOT NULL,
    c VARCHAR(20) NOT NULL,
    h VARCHAR(20) NOT NULL,
    l VARCHAR(20) NOT NULL,
    v VARCHAR(30) DEFAULT NULL,
    tm DATE NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO assetTypes
VALUES ('forex'),('stock'),('crypto');

INSERT INTO editionNameTypes
VALUES ('noon'),('evening');

INSERT INTO symbols
VALUES

--Forex BOTH
('EUR/USD','forex','EURUSD','noon','evening'),
('USD/JPY','forex','USDJPY','noon','evening'),
('AUD/USD','forex','AUDUSD','noon','evening'),

--Forex Evening
('USD/CAD','forex','USDCAD','evening',NULL),
('GBP/USD','forex','GBPUSD','evening',NULL),
('USD/ZAR','forex','USDZAR','evening',NULL),

--Forex Noon
('USD/CNY','forex','CNYUSD','noon',NULL),
('USD/KRW','forex','USDKRW','noon',NULL),
('USD/INR','forex','INRUSD','noon',NULL),

--CMD
('XAU/USD','forex','Gold','noon','evening'),
('XAG/USD','forex','Silver','noon','evening'),
('WTI/USD','forex','Oil','noon','evening'),

--CRYPTO
('BTC/USD','crypto','BTCUSD','noon','evening'),
('ETH/USD','crypto','ETHUSD','noon','evening'),
('XRP/USD','crypto','XRPUSD','noon','evening'),
('XLM/USD','crypto','XLMUSD','noon','evening'),
('BCH/USD','crypto','BCHUSD','noon','evening'),
('ADA/USD','crypto','ADAUSD','noon','evening'),
('LTC/USD','crypto','LTCUSD','noon','evening'),

--STOCKS
('VWAGY','stock','Volkswagen','evening',NULL),
('BABA','stock','Alibaba','noon','evening'),
('FB','stock','Facebook','evening',NULL),
('TSLA','stock','Tesla','noon','evening'),
('MSFT','stock','Microsoft','evening',NULL),
('TWTR','stock','Twitter','evening',NULL),
('AAPL','stock','Apple','evening',NULL),
('AMZN','stock','Amazon','evening',NULL),
('NKE','stock','Nike','evening',NULL),
('NIO','stock','NIO','evening',NULL),
('BIDU','stock','Baidu','noon',NULL),
('TM','stock','Toyota','noon',NULL),
('SFTBY','stock','Softbank','noon',NULL),
('005930','stock','Samsung Electronics','noon',NULL),

--HE Special Stocks Evening
('MRVL','stock','Marvel','evening',NULL),
('LPSN','stock','Liveperson','evening',NULL),
('AMOT','stock','Amot','evening',NULL),
('CHKP','stock','Checkpoint','evening',NULL),
('ESLT','stock','Elbit Systems','evening',NULL),
('ORA','stock','Ormat Techno','evening',NULL),
('ICL','stock','ICL','evening',NULL),
('TEVA','stock','Teva','evening',NULL),
('BKHYY','stock','Poalim','evening',NULL),
('TSEM','stock','Tower','evening',NULL),
('DOX','stock','Amdocs','evening',NULL), 
('INVZ','stock','Innoviz Technologies','evening',NULL),
('NVCR','stock','Novocure','evening',NULL),
('NICE','stock','Nice','evening',NULL),

--Hindi Stocks Noon
('TCS','stock','Tata Consultancy Services','noon',NULL),
('KTKM','stock','Kotak Mahindra Bank','noon',NULL),
('SBI','stock','State Bank of India','noon',NULL),
('HDBK','stock','HDFC Bank','noon',NULL),
('IBN','stock','ICICI Bank','noon',NULL),
('INFY','stock','Infosys','noon',NULL);